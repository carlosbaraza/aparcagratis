import { describe, it, expect } from "vitest";
import { ZONE_META, ZONE_ORDER } from "./zones";
import type { ZoneType } from "./types";

const ALL: ZoneType[] = [
  "azul",
  "verde",
  "alta_rotacion",
  "naranja",
  "rojo",
  "libre",
  "desconocido",
];

describe("ZONE_META", () => {
  it("has metadata for every zone type", () => {
    for (const z of ALL) {
      expect(ZONE_META[z]).toBeTruthy();
      expect(ZONE_META[z].color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(ZONE_META[z].label.length).toBeGreaterThan(0);
    }
  });

  it("marks the free band as unregulated and zona azul as regulated", () => {
    expect(ZONE_META.libre.regulated).toBe(false);
    expect(ZONE_META.azul.regulated).toBe(true);
  });

  it("orders the user-facing zones with no duplicates", () => {
    expect(new Set(ZONE_ORDER).size).toBe(ZONE_ORDER.length);
    expect(ZONE_ORDER).toContain("verde");
  });
});
