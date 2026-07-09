import { describe, expect, it } from "vitest";
import { collectErrorFieldIds, fieldIdForPath } from "./validationFields";

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

  it("never highlights warnings", () => {
    expect(collectErrorFieldIds(issues, true).has("pokemon-0-item")).toBe(false);
  });
});
