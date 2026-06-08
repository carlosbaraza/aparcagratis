/**
 * Domain types for the Madrid SER (Servicio de Estacionamiento Regulado) engine.
 */

/** Type of parking band, derived from the official `Color` attribute of the shapefile. */
export type ZoneType =
  | "azul" // Zona azul — high rotation, any non-resident
  | "verde" // Zona verde — mixed resident / short-stay
  | "alta_rotacion" // Alta rotación — very short stay
  | "naranja" // Naranja — special / differentiated zone
  | "rojo" // Rojo — reserved (e.g. loading), not for general parking
  | "libre" // Free / unregulated band (official `Gris`)
  | "desconocido"; // Unmapped / empty value

/** DGT environmental sticker categories that affect SER pricing and access. */
export type DgtLabel =
  | "cero" // Etiqueta CERO (0 emisiones)
  | "eco" // Etiqueta ECO
  | "c" // Etiqueta C
  | "b" // Etiqueta B
  | "sin_distintivo"; // Sin etiqueta (categoría A)

/** A single point in time expressed in local Madrid wall-clock terms. */
export interface LocalDateTime {
  /** 0 = Sunday … 6 = Saturday (matches JS Date.getDay). */
  weekday: number;
  /** Hour 0–23. */
  hour: number;
  /** Minute 0–59. */
  minute: number;
  /** Month 1–12 (used for August special schedule). */
  month: number;
  /** Whether this calendar day is a public holiday in Madrid. */
  isHoliday?: boolean;
}
