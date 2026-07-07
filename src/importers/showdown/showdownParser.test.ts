import { describe, expect, it } from "vitest";
import { parseShowdownPaste } from "./parseShowdownPaste";

describe("parseShowdownPaste", () => {
  it("parses a standard Showdown block into canonical ids", () => {
    const result = parseShowdownPaste(`
Garchomp @ Life Orb
Ability: Rough Skin
EVs: 6 HP / 28 Atk / 32 Spe
Jolly Nature
- Stomping Tantrum
- Dragon Claw
- Rock Slide
- Protect
`);

    expect(result.issues.some((issue) => issue.severity === "error")).toBe(false);
    const entry = result.teamSheet.pokemon?.[0];
    expect(entry?.speciesId).toBe("garchomp");
    expect(entry?.itemId).toBe("life-orb");
    expect(entry?.abilityId).toBe("rough-skin");
    expect(entry?.statAlignment.value).toBe("Jolly");
    expect(entry?.moves).toEqual(["stomping-tantrum", "dragon-claw", "rock-slide", "protect"]);
  });

  it("uses the species inside nicknamed parentheses", () => {
    const result = parseShowdownPaste(`
Big Dog (Arcanine-Hisui) @ Sitrus Berry
Ability: Intimidate
Jolly Nature
- Protect
`);

    expect(result.teamSheet.pokemon?.[0]?.speciesId).toBe("arcaninehisui");
  });

  it("silently ignores Level lines", () => {
    const result = parseShowdownPaste(`
Garchomp @ Life Orb
Ability: Rough Skin
Level 50
Level: 50
Jolly Nature
- Protect
`);

    expect(result.teamSheet.pokemon?.[0]?.speciesId).toBe("garchomp");
    expect(result.issues.some((issue) => issue.message.includes("Level"))).toBe(false);
    expect(result.issues.some((issue) => issue.code === "UNKNOWN_SHOWDOWN_FIELD_IGNORED")).toBe(false);
  });

  it("normalizes removed neutral natures to Serious for review", () => {
    const result = parseShowdownPaste(`
Garchomp @ Life Orb
Ability: Rough Skin
Hardy Nature
- Protect
`);

    expect(result.teamSheet.pokemon?.[0]?.statAlignment.value).toBe("Serious");
    expect(result.teamSheet.pokemon?.[0]?.statAlignment.requiresReview).toBe(true);
    expect(result.issues.some((issue) => issue.code === "NEUTRAL_NATURE_NORMALIZED")).toBe(true);
  });

  it("keeps Serious as the only neutral alignment without review", () => {
    const result = parseShowdownPaste(`
Garchomp @ Life Orb
Ability: Rough Skin
Serious Nature
- Protect
`);

    expect(result.teamSheet.pokemon?.[0]?.statAlignment.value).toBe("Serious");
    expect(result.teamSheet.pokemon?.[0]?.statAlignment.requiresReview).toBe(false);
    expect(result.issues.some((issue) => issue.code === "NEUTRAL_NATURE_NORMALIZED")).toBe(false);
  });
});
