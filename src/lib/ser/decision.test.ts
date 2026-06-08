import { describe, it, expect } from "vitest";
import { evaluateParking } from "./decision";

const at = (y: number, m: number, d: number, h: number, min = 0) =>
  new Date(y, m - 1, d, h, min);

// 2026-06-08 Monday.
describe("evaluateParking", () => {
  it("marks the free (grey) band as always allowed and free", () => {
    const r = evaluateParking({
      zone: "libre",
      label: "b",
      start: at(2026, 6, 8, 10),
      end: at(2026, 6, 8, 12),
    });
    expect(r.allowed).toBe(true);
    expect(r.isFree).toBe(true);
    expect(r.finalCost).toBe(0);
  });

  it("prices a non-resident blue-zone stay with the C-label discount", () => {
    const r = evaluateParking({
      zone: "azul",
      label: "c",
      start: at(2026, 6, 8, 10),
      end: at(2026, 6, 8, 12),
    });
    // base 2.75 (120 min) * 0.9 = 2.475 -> 2.48
    expect(r.regulatedMinutes).toBe(120);
    expect(r.baseCost).toBe(2.75);
    expect(r.finalCost).toBe(2.48);
    expect(r.allowed).toBe(true);
  });

  it("only charges the regulated portion of an evening dinner stay", () => {
    // Green zone, label B, Mon 19:00 -> 24:00. Paid 19-21 (120), free 21-24 (180).
    const r = evaluateParking({
      zone: "verde",
      label: "b",
      start: at(2026, 6, 8, 19),
      end: at(2026, 6, 9, 0),
    });
    expect(r.regulatedMinutes).toBe(120);
    expect(r.freeMinutes).toBe(180);
    // base 4.10 * 1.2 = 4.92
    expect(r.finalCost).toBe(4.92);
    expect(r.allowed).toBe(true);
  });

  it("is free for a CERO-label vehicle in any regulated zone", () => {
    const r = evaluateParking({
      zone: "azul",
      label: "cero",
      start: at(2026, 6, 8, 10),
      end: at(2026, 6, 8, 12),
    });
    expect(r.allowed).toBe(true);
    expect(r.isFree).toBe(true);
    expect(r.finalCost).toBe(0);
  });

  it("forbids a vehicle with no label during SER hours", () => {
    const r = evaluateParking({
      zone: "azul",
      label: "sin_distintivo",
      start: at(2026, 6, 8, 10),
      end: at(2026, 6, 8, 12),
    });
    expect(r.allowed).toBe(false);
  });

  it("allows a vehicle with no label when parking entirely outside SER hours", () => {
    const r = evaluateParking({
      zone: "azul",
      label: "sin_distintivo",
      start: at(2026, 6, 8, 22),
      end: at(2026, 6, 8, 23),
    });
    expect(r.allowed).toBe(true);
    expect(r.isFree).toBe(true);
  });

  it("forbids parking on a reserved (red) band", () => {
    const r = evaluateParking({
      zone: "rojo",
      label: "c",
      start: at(2026, 6, 8, 10),
      end: at(2026, 6, 8, 12),
    });
    expect(r.allowed).toBe(false);
  });

  it("flags exceeding the maximum stay and caps the cost", () => {
    // Blue zone 09:00-15:00 = 360 regulated min, max 240. Cap 8.20 * 0.9 = 7.38.
    const r = evaluateParking({
      zone: "azul",
      label: "c",
      start: at(2026, 6, 8, 9),
      end: at(2026, 6, 8, 15),
    });
    expect(r.exceedsMaxStay).toBe(true);
    expect(r.baseCost).toBe(8.2);
    expect(r.finalCost).toBe(7.38);
  });

  it("applies the flat resident rate in a green zone with no max stay", () => {
    const r = evaluateParking({
      zone: "verde",
      label: "c",
      isResident: true,
      start: at(2026, 6, 8, 9),
      end: at(2026, 6, 8, 13),
    });
    // 4 regulated hours * 0.20 = 0.80
    expect(r.finalCost).toBe(0.8);
    expect(r.exceedsMaxStay).toBe(false);
    expect(r.allowed).toBe(true);
  });
});
