import { describe, expect, it } from "vitest";
import { MOBILE_FLOATING_TRAY_CONTENT_GAP_PX, mobileFloatingTrayClearancePx } from "./mobileTray";

describe("mobile tray clearance", () => {
  it("includes the tray height, bottom offset, and one content rhythm gap", () => {
    expect(MOBILE_FLOATING_TRAY_CONTENT_GAP_PX).toBe(14);
    expect(mobileFloatingTrayClearancePx(201.9375, 12)).toBe(228);
    expect(mobileFloatingTrayClearancePx(347.9375, 12)).toBe(374);
  });
});
