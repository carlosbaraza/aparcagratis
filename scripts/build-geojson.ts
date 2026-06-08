/**
 * Downloads the official Madrid SER (Servicio de Estacionamiento Regulado) GIS
 * data from the City Council ArcGIS REST service and builds the slim GeoJSON
 * files consumed by the web app.
 *
 *   Source service:
 *   https://sigma.madrid.es/hosted/rest/services/GEOPORTAL/SERVICIO_DE_ESTACIONAMIENTO_REGULADO/MapServer
 *   Catalogue entry (datos abiertos / Geoportal):
 *   https://geoportal.madrid.es/IDEAM_WBGEOPORTAL/dataset.iam?id=9506daa5-e317-11ec-8359-60634c31c0aa
 *
 * Run with: pnpm build:data
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { slimBandFeature, type RawBandFeature } from "../src/lib/geo/bands";

const BASE =
  "https://sigma.madrid.es/hosted/rest/services/GEOPORTAL/SERVICIO_DE_ESTACIONAMIENTO_REGULADO/MapServer";

const RAW_DIR = path.resolve(process.cwd(), "data/raw");
const PUBLIC_DIR = path.resolve(process.cwd(), "public/data");

async function fetchJson(url: string, attempt = 1): Promise<any> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(`ArcGIS error: ${JSON.stringify(json.error)}`);
    return json;
  } catch (err) {
    if (attempt >= 4) throw err;
    const wait = attempt * 1500;
    console.warn(`  retry ${attempt} after error (${String(err)}), waiting ${wait}ms`);
    await new Promise((r) => setTimeout(r, wait));
    return fetchJson(url, attempt + 1);
  }
}

/** Page through an ArcGIS layer returning all GeoJSON features. */
async function fetchLayer(
  layerId: number,
  outFields: string,
  pageSize = 2000,
): Promise<any[]> {
  const features: any[] = [];
  let offset = 0;
  for (;;) {
    const url =
      `${BASE}/${layerId}/query?where=1%3D1` +
      `&outFields=${encodeURIComponent(outFields)}` +
      `&orderByFields=OBJECTID&outSR=4326&f=geojson` +
      `&resultOffset=${offset}&resultRecordCount=${pageSize}`;
    const json = await fetchJson(url);
    const batch: any[] = json.features ?? [];
    features.push(...batch);
    process.stdout.write(`\r  layer ${layerId}: ${features.length} features`);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  process.stdout.write("\n");
  return features;
}

async function writeGeoJson(dir: string, name: string, features: any[]) {
  const fc = { type: "FeatureCollection", features };
  const file = path.join(dir, name);
  await writeFile(file, JSON.stringify(fc));
  const kb = (JSON.stringify(fc).length / 1024).toFixed(0);
  console.log(`  wrote ${name} (${features.length} features, ${kb} KB)`);
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });

  console.log("Downloading SER parking bands (layer 4)…");
  const rawBands = await fetchLayer(4, "Color,Bateria_Linea,Res_NumPlazas");
  await writeGeoJson(RAW_DIR, "ser_bandas_4326.geojson", rawBands);

  console.log("Downloading SER neighbourhood limits (layer 3)…");
  const barrios = await fetchLayer(3, "*");
  await writeGeoJson(RAW_DIR, "ser_barrios_4326.geojson", barrios);

  console.log("Downloading Low-Emission Zones (ZBE / ZBEDEP)…");
  const zbe = [
    { id: 62, name: "zbe_madrid" },
    { id: 61, name: "zbedep_centro" },
    { id: 60, name: "zbedep_plaza_eliptica" },
  ];
  const zbeFeatures: any[] = [];
  for (const { id, name } of zbe) {
    const f = await fetchLayer(id, "*");
    f.forEach((feat) => (feat.properties = { ...feat.properties, _zbe: name }));
    zbeFeatures.push(...f);
  }
  await writeGeoJson(RAW_DIR, "zbe_4326.geojson", zbeFeatures);

  await buildSlim(rawBands as RawBandFeature[], zbeFeatures);
}

/**
 * Build the slim, app-facing GeoJSON. Regulated bands load by default; the much
 * larger free ("libre") set is split out so it can be lazy-loaded on demand.
 */
async function buildSlim(rawBands: RawBandFeature[], zbeFeatures: any[]) {
  console.log("Building slim app GeoJSON…");
  const slim = rawBands.map(slimBandFeature);
  const stats: Record<string, number> = {};
  for (const f of slim) stats[f.properties.z] = (stats[f.properties.z] ?? 0) + 1;

  const regulated = slim.filter((f) => f.properties.z !== "libre");
  const libre = slim.filter((f) => f.properties.z === "libre");
  await writeGeoJson(PUBLIC_DIR, "ser-bands.geojson", regulated);
  await writeGeoJson(PUBLIC_DIR, "ser-libre.geojson", libre);
  await writeFile(
    path.join(PUBLIC_DIR, "ser-zbe.geojson"),
    JSON.stringify({ type: "FeatureCollection", features: zbeFeatures }),
  );

  console.log("\nZone distribution:");
  for (const [z, n] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${z.padEnd(15)} ${n}`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nBuild failed:", err);
  process.exit(1);
});
