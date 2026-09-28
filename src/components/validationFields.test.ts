import { describe, expect, it } from "vitest";
import {
  collectFieldFlags,
  computeProgress,
  emptyRevealState,
  fieldIdForPath,
  inlineMessage,
  isIssueVisible,
  type RevealState
} from "./validationFields";

const missingSpecies = { severity: "error", code: "MISSING_SPECIES", path: "pokemon.0.speciesId", message: "Pokémon 1 needs a species." };
const illegalMove = { severity: "error", code: "ILLEGAL_MOVE", path: "pokemon.1.moves.2", message: "Pokémon 2's move 3 is not legal." };
const statOutOfRange = { severity: "error", code: "STAT_OUT_OF_RANGE", path: "pokemon.1.stats.hp", message: "Pokémon 2's HP of 1 is outside the expected range." };
const missingName = { severity: "error", code: "MISSING_PLAYER_NAME", path: "player.name", message: "Player Name is required." };

const reveal = (patch: Partial<RevealState> = {}): RevealState => ({ ...emptyRevealState(), ...patch });
const allHaveData = () => true;
const noneHaveData = () => false;

describe("validationFields", () => {
  it("maps issue paths to field ids", () => {
    expect(fieldIdForPath("player.dateOfBirth")).toBe("date-of-birth");
    expect(fieldIdForPath("pokemon.3.stats.spa")).toBe("pokemon-3-spa");
    expect(fieldIdForPath("pokemon.1.moves.2")).toBe("pokemon-1-move-2");
    expect(fieldIdForPath("regulation")).toBeNull();
  });

  it("shows nothing in an empty section until a download attempt", () => {
    expect(isIssueVisible(missingSpecies, reveal(), noneHaveData)).toBe(false);
    expect(isIssueVisible(missingSpecies, reveal({ attemptedSections: new Set(["pokemon-0"]) }), noneHaveData)).toBe(true);
  });

  it("shows wrong dropdown picks at once but waits for blur on typed values", () => {
    expect(isIssueVisible(illegalMove, reveal(), allHaveData)).toBe(true);
    expect(isIssueVisible(statOutOfRange, reveal(), allHaveData)).toBe(false);
    expect(isIssueVisible(statOutOfRange, reveal({ touchedFields: new Set(["pokemon-1-hp"]) }), allHaveData)).toBe(true);
  });

  it("hides a typed field's own issues while it has focus", () => {
    const typing = reveal({ touchedFields: new Set(["pokemon-1-hp"]), focusedField: "pokemon-1-hp" });
    expect(isIssueVisible(statOutOfRange, typing, allHaveData)).toBe(false);
  });

  it("waits on missing fields until they're left or the section is finished", () => {
    expect(isIssueVisible(missingName, reveal(), allHaveData)).toBe(false);
    expect(isIssueVisible(missingName, reveal({ touchedFields: new Set(["player-name"]) }), allHaveData)).toBe(true);
    expect(isIssueVisible(missingName, reveal({ finishedSections: new Set(["player"]) }), allHaveData)).toBe(true);
  });

  it("collects errors, warnings and messages, with related fields and no overlap", () => {
    const flags = collectFieldFlags([
      {
        severity: "error",
        code: "DUPLICATE_ITEM",
        path: "pokemon.2.itemId",
        message: "Pokémon 3 has a duplicate held item.",
        relatedFields: ["pokemon.0.itemId"]
      },
      { severity: "warning", code: "MEGA_ITEM_MISMATCH", path: "pokemon.2.itemId", message: "Pokémon 3 is holding a Mega Stone." }
    ]);
    expect(flags.errors.has("pokemon-2-item")).toBe(true);
    expect(flags.errors.has("pokemon-0-item")).toBe(true); // both halves of a duplicate
    expect(flags.warnings.has("pokemon-2-item")).toBe(false); // error wins
    expect(flags.messages.get("pokemon-2-item")?.[0]).toEqual({ severity: "error", text: "Has a duplicate held item." });
    expect(flags.messages.get("pokemon-0-item")?.[0].text).toBe("Pokémon 3 has a duplicate held item.");
  });

  it("highlights empty required fields without a note", () => {
    const flags = collectFieldFlags([missingSpecies, missingName]);
    expect(flags.errors.has("pokemon-0-species")).toBe(true);
    expect(flags.errors.has("player-name")).toBe(true);
    expect(flags.messages.size).toBe(0);
  });

  it("drops the slot prefix for inline messages", () => {
    expect(inlineMessage("Pokémon 2's HP of 1 is too low.")).toBe("HP of 1 is too low.");
    expect(inlineMessage("Pokémon 6 needs move 1.")).toBe("Needs move 1.");
    expect(inlineMessage("Player Name is required.")).toBe("Player Name is required.");
  });

  it("counts progress from every issue, visible or not", () => {
    expect(computeProgress([missingName, missingSpecies, illegalMove])).toEqual({
      playerDone: 4,
      playerTotal: 5,
      teamDone: 4,
      teamTotal: 6
    });
  });
});
