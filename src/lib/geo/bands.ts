import { classifyColor } from "@/lib/ser/classify";
import type { ZoneType } from "@/lib/ser/types";

export interface RawBandFeature {
  type: "Feature";
  properties: {
    Color?: string;
    Bateria_Linea?: string;
    Res_NumPlazas?: number;
  };
  geometry: {
    type: "LineString" | "MultiLineString";
    coordinates: number[][] | number[][][];
  };
}

export interface BandProperties {
  /** Zone type. */
  z: ZoneType;
  /** Number of regulated plazas on the band. */
  n: number;
}

export interface BandFeature {
  type: "Feature";
  properties: BandProperties;
  geometry: {
    type: "LineString" | "MultiLineString";
    coordinates: number[][] | number[][][];
  };
}

const DECIMALS = 6;

function roundCoord(value: number): number {
  const f = 10 ** DECIMALS;
  return Math.round(value * f) / f;
}

function roundCoordinates(coords: unknown): unknown {
  if (typeof coords === "number") return roundCoord(coords);
  return (coords as unknown[]).map(roundCoordinates);
}

/** Convert a raw ArcGIS band feature into a slim, app-ready feature. */
export function slimBandFeature(feature: RawBandFeature): BandFeature {
  return {
    type: "Feature",
    properties: {
      z: classifyColor(feature.properties.Color ?? ""),
      n: feature.properties.Res_NumPlazas ?? 0,
    },
    geometry: {
      type: feature.geometry.type,
      coordinates: roundCoordinates(feature.geometry.coordinates) as
        | number[][]
        | number[][][],
    },
  };
}
