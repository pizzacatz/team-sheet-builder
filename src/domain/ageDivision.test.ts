import { describe, expect, it } from "vitest";
import { divisionForBirthYear } from "./ageDivision";

describe("divisionForBirthYear", () => {
  it("maps 2014 or later to Junior", () => {
    expect(divisionForBirthYear(2014)).toBe("Junior");
    expect(divisionForBirthYear(2020)).toBe("Junior");
  });

  it("maps 2010–2013 to Senior", () => {
    expect(divisionForBirthYear(2013)).toBe("Senior");
    expect(divisionForBirthYear(2010)).toBe("Senior");
  });

  it("maps 2009 or earlier to Master", () => {
    expect(divisionForBirthYear(2009)).toBe("Master");
    expect(divisionForBirthYear(1990)).toBe("Master");
  });
});
