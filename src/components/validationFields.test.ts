import { describe, expect, it } from "vitest";
import { collectErrorFieldIds, collectWarningFieldIds, fieldIdForPath } from "./validationFields";

const issues = [
  { severity: "error", code: "MISSING_SPECIES", path: "pokemon.0.speciesId" },
  { severity: "error", code: "ILLEGAL_MOVE", path: "pokemon.1.moves.2" },
  { severity: "warning", code: "MEGA_ITEM_MISMATCH", path: "pokemon.0.itemId" }
];

describe("validationFields", () => {
  it("maps issue paths to field ids", () => {
    expect(fieldIdForPath("player.dateOfBirth")).toBe("date-of-birth");
    expect(fieldIdForPath("pokemon.3.stats.spa")).toBe("pokemon-3-spa");
    expect(fieldIdForPath("pokemon.1.moves.2")).toBe("pokemon-1-move-2");
    expect(fieldIdForPath("regulation")).toBeNull();
  });

  it("shows wrong-value errors immediately but gates missing ones until attempted", () => {
    const before = collectErrorFieldIds(issues, false);
    expect(before.has("pokemon-1-move-2")).toBe(true); // illegal value: immediate
    expect(before.has("pokemon-0-species")).toBe(false); // missing: gated

    const after = collectErrorFieldIds(issues, true);
    expect(after.has("pokemon-0-species")).toBe(true); // now shown after an attempt
  });

  it("never puts warnings in the error set", () => {
    expect(collectErrorFieldIds(issues, true).has("pokemon-0-item")).toBe(false);
  });

  it("collects warning fields (incl. related) and never overlaps errors", () => {
    const withRelated = [
      ...issues,
      {
        severity: "error",
        code: "STAT_ALIGNMENT_NO_POINTS",
        path: "pokemon.2.statAlignment",
        relatedFields: ["pokemon.2.stats.spe", "pokemon.2.stats.spa"]
      }
    ];
    const errors = collectErrorFieldIds(withRelated, true);
    expect(errors.has("pokemon-2-stat-alignment")).toBe(true); // path
    expect(errors.has("pokemon-2-spe")).toBe(true); // related field
    expect(errors.has("pokemon-2-spa")).toBe(true);

    const warnings = collectWarningFieldIds(withRelated, errors);
    expect(warnings.has("pokemon-0-item")).toBe(true); // mega mismatch warning
    expect(warnings.has("pokemon-2-stat-alignment")).toBe(false); // taken by an error
  });
});
