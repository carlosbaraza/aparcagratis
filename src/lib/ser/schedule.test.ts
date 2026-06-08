import { describe, it, expect } from "vitest";
import { splitParkingWindow } from "./schedule";

// Helper: build a local-time Date. Month is 1-based here for readability.
const at = (y: number, m: number, d: number, h: number, min = 0) =>
  new Date(y, m - 1, d, h, min);

// 2026-06-08 is a Monday; 2026-06-13 a Saturday; 2026-06-14 a Sunday.
describe("splitParkingWindow", () => {
  it("counts a weekday window fully inside SER hours as regulated", () => {
    const r = splitParkingWindow(at(2026, 6, 8, 10), at(2026, 6, 8, 12));
    expect(r).toEqual({ totalMinutes: 120, regulatedMinutes: 120, freeMinutes: 0 });
  });

  it("frees the part of the evening after SER ends at 21:00 (dinner scenario)", () => {
    // Park Monday 19:00 -> 24:00. SER ends 21:00 => 2h paid, 3h free.
    const r = splitParkingWindow(at(2026, 6, 8, 19), at(2026, 6, 9, 0));
    expect(r.regulatedMinutes).toBe(120);
    expect(r.freeMinutes).toBe(180);
  });

  it("treats the whole of Sunday as free", () => {
    const r = splitParkingWindow(at(2026, 6, 14, 10), at(2026, 6, 14, 14));
    expect(r.regulatedMinutes).toBe(0);
    expect(r.freeMinutes).toBe(240);
  });

  it("uses the shorter Saturday schedule ending at 15:00", () => {
    const r = splitParkingWindow(at(2026, 6, 13, 14), at(2026, 6, 13, 16));
    expect(r.regulatedMinutes).toBe(60);
    expect(r.freeMinutes).toBe(60);
  });

  it("does not charge before 09:00", () => {
    const r = splitParkingWindow(at(2026, 6, 8, 7), at(2026, 6, 8, 9));
    expect(r.regulatedMinutes).toBe(0);
  });

  it("handles windows crossing midnight into a free early morning", () => {
    // Friday 2026-06-12 20:00 -> Saturday 02:00. Fri paid 20-21 (60), rest free.
    const r = splitParkingWindow(at(2026, 6, 12, 20), at(2026, 6, 13, 2));
    expect(r.regulatedMinutes).toBe(60);
    expect(r.freeMinutes).toBe(300);
  });

  it("applies the reduced August schedule (Mon-Sat 09:00-15:00)", () => {
    // 2026-08-10 is a Monday.
    const r = splitParkingWindow(at(2026, 8, 10, 14), at(2026, 8, 10, 16));
    expect(r.regulatedMinutes).toBe(60);
    expect(r.freeMinutes).toBe(60);
  });

  it("treats a provided holiday as a free day", () => {
    const isHoliday = (d: Date) => d.getMonth() === 5 && d.getDate() === 8;
    const r = splitParkingWindow(at(2026, 6, 8, 10), at(2026, 6, 8, 12), isHoliday);
    expect(r.regulatedMinutes).toBe(0);
    expect(r.freeMinutes).toBe(120);
  });
});
