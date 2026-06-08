import type { DgtLabel, ZoneType } from "./types";

/**
 * SINGLE SOURCE OF TRUTH for SER pricing, schedule and DGT modifiers.
 *
 * Figures reflect the Madrid SER tariff published for 2025 (Ordenanza de
 * Movilidad Sostenible). They are intentionally isolated here so they can be
 * updated in one place without touching the engine logic.
 *
 * Sources:
 *  - https://www.idealista.com/news/inmobiliario/vivienda/2025/08/02/849164-zona-azul-y-zona-verde-en-madrid-horario-tarifas-y-como-funcionan
 *  - https://datos.madrid.es (Zonas del Servicio de Estacionamiento Regulado SER)
 */

/** [minutes, accumulated cost in euros] breakpoints, ascending by minutes. */
export type Breakpoints = ReadonlyArray<readonly [number, number]>;

export interface ZoneTariff {
  /** Pricing breakpoints for a non-resident driver. */
  readonly breakpoints: Breakpoints;
  /** Maximum continuous stay allowed, in minutes (non-resident). */
  readonly maxStayMinutes: number;
}

/** Per-zone tariff tables. Zones absent here are never charged. */
export const ZONE_TARIFFS: Partial<Record<ZoneType, ZoneTariff>> = {
  azul: {
    breakpoints: [
      [5, 0.05],
      [20, 0.25],
      [30, 0.4],
      [60, 1.1],
      [120, 2.75],
      [240, 8.2],
    ],
    maxStayMinutes: 240,
  },
  verde: {
    breakpoints: [
      [5, 0.15],
      [20, 0.5],
      [30, 0.9],
      [60, 2.05],
      [120, 4.1],
    ],
    maxStayMinutes: 120,
  },
  // Alta rotación shares the high-rotation pricing of zona azul but with a
  // shorter maximum stay.
  alta_rotacion: {
    breakpoints: [
      [5, 0.05],
      [20, 0.25],
      [30, 0.4],
      [60, 1.1],
      [120, 2.75],
    ],
    maxStayMinutes: 120,
  },
};

/**
 * Multiplier applied to the base tariff depending on the DGT environmental
 * label. `null` means the vehicle is not allowed to park in a regulated zone.
 */
export const DGT_MODIFIER: Record<DgtLabel, number | null> = {
  cero: 0, // CERO: free in the whole SER
  eco: 0.25, // ECO: 75% discount
  c: 0.9, // C: 10% discount
  b: 1.2, // B: 20% surcharge
  sin_distintivo: null, // Sin distintivo: not allowed within the regulated area
};

/**
 * Flat hourly rate (euros/hour) for a registered resident parking in their own
 * zona verde. Residents are not subject to the non-resident maximum stay.
 */
export const RESIDENT_VERDE_RATE_PER_HOUR = 0.2;

/** SER active schedule (local Madrid time). Outside these windows parking is free. */
export const SCHEDULE = {
  /** Mon–Fri active hours [startHour, endHour). */
  weekday: { start: 9, end: 21 },
  /** Saturday active hours [startHour, endHour). */
  saturday: { start: 9, end: 15 },
  /** August: Mon–Sat only, reduced hours. */
  august: { start: 9, end: 15 },
} as const;
