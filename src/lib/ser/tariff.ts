import type { Breakpoints } from "./tariffs";

/** Round a euro amount to whole cents. */
function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Compute the parking cost for a given number of minutes using a piecewise
 * linear tariff table.
 *
 * - 0 or fewer minutes cost nothing.
 * - Below the first breakpoint the minimum charge (first breakpoint price) applies.
 * - Between breakpoints the price is interpolated linearly.
 * - Beyond the last breakpoint the cost is capped at the last breakpoint price.
 */
export function costFromBreakpoints(
  breakpoints: Breakpoints,
  minutes: number,
): number {
  if (minutes <= 0 || breakpoints.length === 0) return 0;

  const [firstMin, firstPrice] = breakpoints[0];
  if (minutes <= firstMin) return roundCents(firstPrice);

  const last = breakpoints[breakpoints.length - 1];
  if (minutes >= last[0]) return roundCents(last[1]);

  for (let i = 1; i < breakpoints.length; i++) {
    const [m1, p1] = breakpoints[i];
    if (minutes <= m1) {
      const [m0, p0] = breakpoints[i - 1];
      const ratio = (minutes - m0) / (m1 - m0);
      return roundCents(p0 + ratio * (p1 - p0));
    }
  }

  return roundCents(last[1]);
}
