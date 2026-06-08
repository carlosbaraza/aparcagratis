import type { ZoneType } from "./types";

/** Normalise a string: lowercase, strip accents, collapse whitespace. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const COLOR_TO_ZONE: Record<string, ZoneType> = {
  verde: "verde",
  azul: "azul",
  "alta rotacion": "alta_rotacion",
  naranja: "naranja",
  rojo: "rojo",
  gris: "libre",
};

/**
 * Map the official `Color` attribute of a SER parking band to a {@link ZoneType}.
 * The grey ("Gris") band represents free / unregulated parking.
 */
export function classifyColor(color: string): ZoneType {
  return COLOR_TO_ZONE[normalize(color)] ?? "desconocido";
}
