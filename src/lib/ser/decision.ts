import type { DgtLabel, ZoneType } from "./types";
import { splitParkingWindow } from "./schedule";
import { costFromBreakpoints } from "./tariff";
import {
  DGT_MODIFIER,
  RESIDENT_VERDE_RATE_PER_HOUR,
  ZONE_TARIFFS,
} from "./tariffs";

export interface ParkingInput {
  zone: ZoneType;
  label: DgtLabel;
  start: Date;
  end: Date;
  /** Registered resident of the zona verde being evaluated. */
  isResident?: boolean;
  isHoliday?: (date: Date) => boolean;
}

export interface ParkingDecision {
  zone: ZoneType;
  /** Whether the vehicle may legally park for the whole window. */
  allowed: boolean;
  /** Whether the total cost is zero. */
  isFree: boolean;
  totalMinutes: number;
  regulatedMinutes: number;
  freeMinutes: number;
  /** Cost before the DGT label modifier. */
  baseCost: number;
  /** Final cost after applying the DGT label modifier. */
  finalCost: number;
  /** Regulated time exceeds the maximum stay for the zone. */
  exceedsMaxStay: boolean;
  /** Human-readable explanation (Spanish). */
  reason: string;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function base(input: ParkingInput, split: ReturnType<typeof splitParkingWindow>) {
  return {
    zone: input.zone,
    totalMinutes: split.totalMinutes,
    regulatedMinutes: split.regulatedMinutes,
    freeMinutes: split.freeMinutes,
  };
}

/**
 * Evaluate whether a vehicle can park in a given SER zone for a time window and
 * how much it would cost, taking the DGT environmental label and the SER
 * schedule into account.
 */
export function evaluateParking(input: ParkingInput): ParkingDecision {
  const split = splitParkingWindow(input.start, input.end, input.isHoliday);
  const common = base(input, split);

  // Free / unregulated grey band: always allowed, never charged.
  if (input.zone === "libre") {
    return {
      ...common,
      allowed: true,
      isFree: true,
      baseCost: 0,
      finalCost: 0,
      exceedsMaxStay: false,
      reason: "Aparcamiento libre (banda no regulada). Sin coste a cualquier hora.",
    };
  }

  // Reserved red band: not available for general parking.
  if (input.zone === "rojo") {
    return {
      ...common,
      allowed: false,
      isFree: false,
      baseCost: 0,
      finalCost: 0,
      exceedsMaxStay: false,
      reason: "Plaza reservada (carga y descarga u otros usos). No disponible.",
    };
  }

  // Parking entirely outside SER hours: free for everyone.
  if (split.regulatedMinutes === 0) {
    return {
      ...common,
      allowed: true,
      isFree: true,
      baseCost: 0,
      finalCost: 0,
      exceedsMaxStay: false,
      reason: "Fuera del horario SER: aparcamiento gratuito.",
    };
  }

  // Resident flat rate in their own green zone.
  if (input.isResident && input.zone === "verde") {
    const finalCost = roundCents(
      (split.regulatedMinutes / 60) * RESIDENT_VERDE_RATE_PER_HOUR,
    );
    return {
      ...common,
      allowed: true,
      isFree: finalCost === 0,
      baseCost: finalCost,
      finalCost,
      exceedsMaxStay: false,
      reason: "Tarifa de residente en zona verde (sin límite de tiempo).",
    };
  }

  const modifier = DGT_MODIFIER[input.label];

  // Sin distintivo: not allowed to park in a regulated zone during SER hours.
  if (modifier === null) {
    return {
      ...common,
      allowed: false,
      isFree: false,
      baseCost: 0,
      finalCost: 0,
      exceedsMaxStay: false,
      reason:
        "Vehículo sin distintivo ambiental: no puede estacionar en zona SER en horario regulado.",
    };
  }

  const tariff = ZONE_TARIFFS[input.zone];

  // Zones we cannot price (naranja / desconocido): allow but flag.
  if (!tariff) {
    return {
      ...common,
      allowed: true,
      isFree: false,
      baseCost: 0,
      finalCost: 0,
      exceedsMaxStay: false,
      reason: "Zona especial: consulta la señalización para la tarifa aplicable.",
    };
  }

  const baseCost = costFromBreakpoints(tariff.breakpoints, split.regulatedMinutes);
  const finalCost = roundCents(baseCost * modifier);
  const exceedsMaxStay = split.regulatedMinutes > tariff.maxStayMinutes;

  let reason: string;
  if (modifier === 0) {
    reason = "Etiqueta CERO: gratis en toda la zona SER.";
  } else if (exceedsMaxStay) {
    reason = `Supera el tiempo máximo (${tariff.maxStayMinutes / 60} h). Coste limitado a la tarifa máxima.`;
  } else {
    reason = "Estacionamiento regulado: coste calculado para el tramo de pago.";
  }

  return {
    ...common,
    allowed: true,
    isFree: finalCost === 0,
    baseCost,
    finalCost,
    exceedsMaxStay,
    reason,
  };
}
