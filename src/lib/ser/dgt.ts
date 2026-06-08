import type { DgtLabel } from "./types";

export interface DgtOption {
  id: DgtLabel;
  label: string;
  /** Short pricing effect shown under the label. */
  effect: string;
  color: string;
}

/** Display metadata for the DGT environmental sticker selector. */
export const DGT_OPTIONS: DgtOption[] = [
  { id: "cero", label: "CERO", effect: "Gratis en SER", color: "#1f9d55" },
  { id: "eco", label: "ECO", effect: "−75 %", color: "#0ea5a5" },
  { id: "c", label: "C", effect: "−10 %", color: "#2f6fed" },
  { id: "b", label: "B", effect: "+20 %", color: "#e8702a" },
  {
    id: "sin_distintivo",
    label: "Sin etiqueta",
    effect: "No permitido",
    color: "#8a9099",
  },
];
