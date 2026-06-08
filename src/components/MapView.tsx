"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import type {
  Map as LeafletMap,
  GeoJSON as LeafletGeoJSON,
  LayerGroup,
  Canvas,
  PathOptions,
} from "leaflet";
import type { ZoneType } from "@/lib/ser/types";
import { ZONE_META } from "@/lib/ser/zones";
import { asset } from "@/lib/basePath";

export type Basemap = "map" | "satellite";

interface MapViewProps {
  /** Currently enabled zone types. */
  enabled: Record<ZoneType, boolean>;
  /** Whether to draw the Low-Emission Zone (ZBE) outlines. */
  showZbe: boolean;
  /** Active base layer. */
  basemap: Basemap;
}

const MADRID_CENTER: [number, number] = [40.4168, -3.7038];

const CARTO_ATTR =
  'Datos: <a href="https://geoportal.madrid.es">Ayto. de Madrid (SER)</a> · &copy; <a href="https://carto.com/">CARTO</a> · <a href="https://www.openstreetmap.org/copyright">OSM</a>';
const PNOA_ATTR =
  'Datos: <a href="https://geoportal.madrid.es">Ayto. de Madrid (SER)</a> · Ortofoto <a href="https://www.ign.es">PNOA © IGN España</a>';

function bandStyle(z: ZoneType, basemap: Basemap): PathOptions {
  const sat = basemap === "satellite";
  const isLibre = z === "libre";
  return {
    color: ZONE_META[z]?.color ?? "#999",
    weight: isLibre ? (sat ? 3 : 2.5) : sat ? 4 : 3,
    opacity: isLibre ? (sat ? 0.95 : 0.8) : sat ? 1 : 0.9,
    dashArray: isLibre ? "2 4" : undefined,
    lineCap: "round",
  };
}

/** HTML for the click popup with deep links to Google Maps and Street View. */
function buildLinkPopup(lat: number, lng: number): string {
  const q = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const coords = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const panoUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${q}`;
  return `
    <div class="sv-popup">
      <div class="sv-title">¿Aparcar aquí?</div>
      <div class="sv-coords">${coords}</div>
      <a class="sv-btn sv-btn-maps" target="_blank" rel="noopener noreferrer" href="${mapsUrl}">
        Abrir en Google Maps
      </a>
      <a class="sv-btn sv-btn-pano" target="_blank" rel="noopener noreferrer" href="${panoUrl}">
        Ver en Street View
      </a>
    </div>`;
}

/** Build the base tile layer(s) for a given basemap as a single group. */
function makeBaseGroup(L: typeof import("leaflet"), basemap: Basemap): LayerGroup {
  const group = L.layerGroup();
  if (basemap === "satellite") {
    // IGN PNOA orthophoto — high-resolution aerial imagery of Spain.
    L.tileLayer(
      "https://www.ign.es/wmts/pnoa-ma?layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}",
      { attribution: PNOA_ATTR, maxZoom: 19, crossOrigin: true },
    ).addTo(group);
    // Haloed place / street labels so the imagery stays navigable.
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Etiquetas © Esri", maxZoom: 19 },
    ).addTo(group);
  } else {
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: CARTO_ATTR,
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(group);
  }
  return group;
}

export default function MapView({ enabled, showZbe, basemap }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<Partial<Record<ZoneType, LeafletGeoJSON>>>({});
  const zbeRef = useRef<LeafletGeoJSON | null>(null);
  const rendererRef = useRef<Canvas | null>(null);
  const baseRef = useRef<LayerGroup | null>(null);
  const basemapRef = useRef<Basemap>(basemap);
  const libreLoaded = useRef(false);
  // Flips true once the Leaflet map has finished initialising, so layer effects
  // that ran before the (async) map setup can re-run and actually attach.
  const [ready, setReady] = useState(false);

  // Initialise the Leaflet map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: MADRID_CENTER,
        zoom: 14,
        zoomControl: false,
        preferCanvas: true,
        attributionControl: true,
      });
      rendererRef.current = L.canvas({ padding: 0.5 });

      baseRef.current = makeBaseGroup(L, basemapRef.current).addTo(map);

      // Click anywhere to open deep links to Google Maps / Street View.
      map.on("click", (e: Leaflet.LeafletMouseEvent) => {
        L.popup({ closeButton: true, className: "sv-popup-wrap", maxWidth: 230, offset: [0, -4] })
          .setLatLng(e.latlng)
          .setContent(buildLinkPopup(e.latlng.lat, e.latlng.lng))
          .openOn(map);
      });

      mapRef.current = map;
      await loadRegulated(L);
      applyVisibility();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildZoneLayers(
    L: typeof import("leaflet"),
    features: GeoJSON.Feature[],
  ) {
    const byZone = new Map<ZoneType, GeoJSON.Feature[]>();
    for (const f of features) {
      const z = (f.properties as { z: ZoneType }).z;
      if (!byZone.has(z)) byZone.set(z, []);
      byZone.get(z)!.push(f);
    }
    for (const [z, feats] of byZone) {
      if (layersRef.current[z]) continue;
      const layer = L.geoJSON(
        { type: "FeatureCollection", features: feats } as GeoJSON.FeatureCollection,
        {
          renderer: rendererRef.current!,
          style: () => bandStyle(z, basemapRef.current),
        } as Leaflet.GeoJSONOptions,
      );
      layersRef.current[z] = layer;
    }
  }

  async function loadRegulated(L: typeof import("leaflet")) {
    const res = await fetch(asset("/data/ser-bands.geojson"));
    const data: GeoJSON.FeatureCollection = await res.json();
    buildZoneLayers(L, data.features);
  }

  async function loadLibre() {
    if (libreLoaded.current) return;
    libreLoaded.current = true;
    const L = await import("leaflet");
    const res = await fetch(asset("/data/ser-libre.geojson"));
    const data: GeoJSON.FeatureCollection = await res.json();
    buildZoneLayers(L, data.features);
    applyVisibility();
  }

  function applyVisibility() {
    const map = mapRef.current;
    if (!map) return;
    (Object.keys(layersRef.current) as ZoneType[]).forEach((z) => {
      const layer = layersRef.current[z];
      if (!layer) return;
      if (enabled[z]) {
        if (!map.hasLayer(layer)) layer.addTo(map);
      } else if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
  }

  // React to filter changes.
  useEffect(() => {
    if (enabled.libre && !libreLoaded.current) {
      loadLibre();
    }
    applyVisibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Swap the base layer and restyle the bands when the basemap changes.
  useEffect(() => {
    basemapRef.current = basemap;
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapRef.current) return;
      if (baseRef.current) map.removeLayer(baseRef.current);
      baseRef.current = makeBaseGroup(L, basemap);
      baseRef.current.addTo(map);
      (Object.keys(layersRef.current) as ZoneType[]).forEach((z) => {
        layersRef.current[z]?.setStyle(bandStyle(z, basemap));
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [basemap]);

  // Toggle the ZBE overlay.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map = mapRef.current;
      if (!map) return;
      if (showZbe) {
        if (!zbeRef.current) {
          const L = await import("leaflet");
          const res = await fetch(asset("/data/ser-zbe.geojson"));
          const data: GeoJSON.FeatureCollection = await res.json();
          if (cancelled) return;
          zbeRef.current = L.geoJSON(data, {
            // Share the bands' canvas renderer so the map keeps a single canvas.
            renderer: rendererRef.current ?? undefined,
            // Bold dashed outline so the boundary reads clearly without tinting
            // the whole city (the Madrid ZBE covers almost the entire centre).
            style: {
              color: "#D6336C",
              weight: 3,
              opacity: 0.95,
              fillColor: "#D6336C",
              fillOpacity: 0.05,
              dashArray: "10 6",
            },
          } as Leaflet.GeoJSONOptions);
        }
        zbeRef.current.addTo(map);
        zbeRef.current.bringToFront();
      } else if (zbeRef.current && map.hasLayer(zbeRef.current)) {
        map.removeLayer(zbeRef.current);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showZbe, ready]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
