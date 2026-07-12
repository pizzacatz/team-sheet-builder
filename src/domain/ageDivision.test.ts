import { describe, expect, it } from "vitest";
import { ageDivisionHint, divisionForBirthYear } from "./ageDivision";

describe("age division from birth year", () => {
  it("uses the current year by default (age-based)", () => {
    const now = new Date().getFullYear();
    expect(divisionForBirthYear(now - 5)).toBe("Junior"); // age 5
    expect(divisionForBirthYear(now - 12)).toBe("Junior"); // age 12 (boundary)
    expect(divisionForBirthYear(now - 13)).toBe("Senior"); // age 13
    expect(divisionForBirthYear(now - 16)).toBe("Senior"); // age 16 (boundary)
    expect(divisionForBirthYear(now - 17)).toBe("Master"); // age 17
  });

  it("matches the 2026-season cutoffs when passed explicitly", () => {
    expect(divisionForBirthYear(2014, 2026)).toBe("Junior");
    expect(divisionForBirthYear(2013, 2026)).toBe("Senior");
    expect(divisionForBirthYear(2010, 2026)).toBe("Senior");
    expect(divisionForBirthYear(2009, 2026)).toBe("Master");
  });

  it("computes tooltip cutoffs from the season year", () => {
    expect(ageDivisionHint("Junior", 2026)).toBe("Born in 2014 or later");
    expect(ageDivisionHint("Senior", 2026)).toBe("Born 2010–2013");
    expect(ageDivisionHint("Master", 2026)).toBe("Born in 2009 or earlier");
  });
});
