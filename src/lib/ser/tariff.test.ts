import { describe, it, expect } from "vitest";
import { costFromBreakpoints } from "./tariff";
import { ZONE_TARIFFS } from "./tariffs";

const azul = ZONE_TARIFFS.azul!.breakpoints;

describe("costFromBreakpoints", () => {
  it("charges nothing for zero or negative minutes", () => {
    expect(costFromBreakpoints(azul, 0)).toBe(0);
    expect(costFromBreakpoints(azul, -10)).toBe(0);
  });

  it("applies the minimum charge below the first breakpoint", () => {
    expect(costFromBreakpoints(azul, 3)).toBe(0.05);
    expect(costFromBreakpoints(azul, 5)).toBe(0.05);
  });

  it("returns exact breakpoint prices", () => {
    expect(costFromBreakpoints(azul, 60)).toBe(1.1);
    expect(costFromBreakpoints(azul, 120)).toBe(2.75);
  });

  it("interpolates linearly between breakpoints, rounded to cents", () => {
    // halfway between 60min (1.10) and 120min (2.75) -> 1.925 -> 1.93
    expect(costFromBreakpoints(azul, 90)).toBe(1.93);
  });

  it("caps the cost at the maximum breakpoint", () => {
    expect(costFromBreakpoints(azul, 240)).toBe(8.2);
    expect(costFromBreakpoints(azul, 600)).toBe(8.2);
  });
});
