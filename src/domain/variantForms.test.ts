import { describe, expect, it } from "vitest";
import speciesJson from "../data/regulation-mc/species.json";
import { GENDER_FEMALE_FORM } from "../importers/showdown/parseShowdownPaste";
import type { SpeciesRecord } from "./dataTypes";
import { displayOverrides, unlabelledBaseForms } from "./regulationData";

// Guards regulation updates: every Pokédex number with more than one form
// record needs a decision about its base form's label. See the rule above
// displayOverrides in regulationData.ts and docs/REGULATION_UPDATE.md.

const rawSpecies = speciesJson as SpeciesRecord[];

const formGroups = (): SpeciesRecord[][] => {
  const byDex = new Map<number, SpeciesRecord[]>();
  rawSpecies.forEach((record) => byDex.set(record.nationalDexNumber, [...(byDex.get(record.nationalDexNumber) ?? []), record]));
  return [...byDex.values()].filter((group) => group.length > 1);
};

// The base form is the record with the bare name, which has the shortest id.
const baseOf = (group: SpeciesRecord[]): SpeciesRecord =>
  [...group].sort((a, b) => a.id.length - b.id.length)[0];

describe("variant forms", () => {
  it("decides the label for every base form that has sibling forms", () => {
    const undecided = formGroups()
      .map(baseOf)
      .filter((base) => !(base.id in displayOverrides) && !(base.id in unlabelledBaseForms))
      .map((base) => base.id);

    expect(
      undecided,
      `New form group(s) need a decision in src/domain/regulationData.ts. Add each base id to ` +
        `displayOverrides (label it, e.g. "Lycanroc-Midday", when its forms are equally valid ` +
        `alternatives: gender, time of day, plumage, Amped/Low-Key) or to unlabelledBaseForms ` +
        `(regional, size, or a bare name that is already the form's own name).`
    ).toEqual([]);
  });

  it("decides each base form only once", () => {
    const both = Object.keys(displayOverrides).filter((id) => id in unlabelledBaseForms);
    expect(both).toEqual([]);
  });

  it("lists only species that exist in the current data", () => {
    const ids = new Set(rawSpecies.map((record) => record.id));
    const stale = [...Object.keys(displayOverrides), ...Object.keys(unlabelledBaseForms)].filter((id) => !ids.has(id));
    expect(stale, "Remove ids that are no longer in the regulation data.").toEqual([]);
  });

  it("routes every female (-F) form from its base for Gender: F imports", () => {
    const femaleForms = rawSpecies.filter((record) => record.displayName.endsWith("-F")).map((record) => record.id);
    const routed = new Set(Object.values(GENDER_FEMALE_FORM));
    const missing = femaleForms.filter((id) => !routed.has(id));
    expect(
      missing,
      "Add each -F record to GENDER_FEMALE_FORM in src/importers/showdown/parseShowdownPaste.ts, " +
        "and label its base form -M in displayOverrides."
    ).toEqual([]);
  });
});
