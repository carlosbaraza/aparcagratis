import type { ZoneType } from "./types";

export interface ZoneMeta {
  id: ZoneType;
  /** Full display label. */
  label: string;
  /** Hex colour used on the map and in the UI. */
  color: string;
  /** Whether the band is part of the regulated (paid) service. */
  regulated: boolean;
  /** Short human description. */
  description: string;
}

export const ZONE_META: Record<ZoneType, ZoneMeta> = {
  azul: {
    id: "azul",
    label: "Zona Azul",
    color: "#2F6FED",
    regulated: true,
    description: "Alta rotación para cualquier vehículo. Estancia máx. 4 h.",
  },
  verde: {
    id: "verde",
    label: "Zona Verde",
    color: "#1F9D55",
    regulated: true,
    description: "Mixta residentes / corta estancia. No residentes máx. 2 h.",
  },
  alta_rotacion: {
    id: "alta_rotacion",
    label: "Alta Rotación",
    color: "#0EA5A5",
    regulated: true,
    description: "Rotación muy alta en entornos de gran demanda.",
  },
  naranja: {
    id: "naranja",
    label: "Naranja",
    color: "#E8702A",
    regulated: true,
    description: "Ámbito diferenciado / zona especial. Consulta señalización.",
  },
  rojo: {
    id: "rojo",
    label: "Reservada",
    color: "#D93838",
    regulated: true,
    description: "Plazas reservadas (carga y descarga u otros usos).",
  },
  libre: {
    id: "libre",
    label: "Libre",
    color: "#7C3AED",
    regulated: false,
    description: "Banda no regulada. Aparcamiento gratuito a cualquier hora.",
  },
  desconocido: {
    id: "desconocido",
    label: "Sin clasificar",
    color: "#B0A8C0",
    regulated: true,
    description: "Tramo sin clasificación de color disponible.",
  },
};

/** User-facing display/filter order. */
export const ZONE_ORDER: ZoneType[] = [
  "verde",
  "azul",
  "alta_rotacion",
  "naranja",
  "rojo",
  "libre",
];
