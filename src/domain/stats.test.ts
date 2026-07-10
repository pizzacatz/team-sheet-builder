import { describe, expect, it } from "vitest";
import { achievableStatValues, impliedStatPoints } from "./stats";

describe("stat point back-out", () => {
  it("backs out neutral stats exactly", () => {
    expect(impliedStatPoints(120, 100, 1)).toBe(20);
    expect(impliedStatPoints(100, 100, 1)).toBe(0);
    expect(impliedStatPoints(99, 100, 1)).toBeNull(); // below default, can't be neutral
    expect(impliedStatPoints(133, 100, 1)).toBeNull(); // needs 33 > 32 points
  });

  it("recognizes that a raised (x1.1) stat skips some integers", () => {
    const legal = achievableStatValues(100, 1.1);
    expect(legal[0]).toBe(110); // 0 points: floor(110)
    expect(legal).toContain(119); // 9 points: floor(119.9)
    expect(legal).toContain(121); // 10 points: floor(121)
    expect(legal).not.toContain(120); // unreachable — no allocation floors to 120
    expect(impliedStatPoints(120, 100, 1.1)).toBeNull();
    expect(impliedStatPoints(119, 100, 1.1)).toBe(9);
  });

  it("allows a lowered stat neutralized by points", () => {
    // default 90, lowered x0.9: 10 points -> floor(100 * 0.9) = 90 == default.
    expect(impliedStatPoints(90, 90, 0.9)).not.toBeNull();
  });
});
