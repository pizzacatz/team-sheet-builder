import { describe, expect, it } from "vitest";
import { items, moves, species } from "../domain/regulationData";
import { validateTeamSheet } from "../domain/validation";
import { makeValidTeamSheet } from "./fixtures";

const codes = (team = makeValidTeamSheet()) => validateTeamSheet(team).issues.map((issue) => issue.code);

describe("validateTeamSheet", () => {
  it("accepts a generated complete legal team", () => {
    const result = validateTeamSheet(makeValidTeamSheet());
    expect(result.isValid).toBe(true);
    expect(result.issues.filter((issue) => issue.severity === "error")).toHaveLength(0);
  });

  it("requires player name and required slot fields", () => {
    const team = makeValidTeamSheet();
    team.player.name = "";
    team.pokemon[0].abilityId = null;
    team.pokemon[0].moves[0] = null;
    team.pokemon[0].statAlignment.value = null;
    expect(codes(team)).toEqual(expect.arrayContaining(["MISSING_PLAYER_NAME", "MISSING_ABILITY", "MISSING_MOVE", "MISSING_STAT_ALIGNMENT"]));
  });

  it("catches duplicate species by national dex number", () => {
    const team = makeValidTeamSheet();
    team.pokemon[1].speciesId = team.pokemon[0].speciesId;
    team.pokemon[1].displayName = team.pokemon[0].displayName;
    expect(codes(team)).toContain("DUPLICATE_SPECIES");
  });

  it("catches duplicate items", () => {
    const team = makeValidTeamSheet();
    team.pokemon[1].itemId = team.pokemon[0].itemId;
    expect(codes(team)).toContain("DUPLICATE_ITEM");
  });

  it("catches illegal and unlearnable moves", () => {
    const team = makeValidTeamSheet();
    const firstSpecies = species.find((record) => record.id === team.pokemon[0].speciesId)!;
    const unlearnableMove = moves.find((move) => !firstSpecies.moves.includes(move.id))!;
    team.pokemon[0].moves[0] = unlearnableMove.id;
    expect(codes(team)).toContain("MOVE_NOT_LEARNABLE");

    team.pokemon[0].moves[0] = "not-a-real-move";
    expect(codes(team)).toContain("ILLEGAL_MOVE");
  });

  it("catches unavailable abilities and warns on Mega Stone mismatch", () => {
    const team = makeValidTeamSheet();
    const firstSpecies = species.find((record) => record.id === team.pokemon[0].speciesId)!;
    const differentAbility = species.flatMap((record) => record.abilities).find((abilityId) => !firstSpecies.abilities.includes(abilityId))!;
    team.pokemon[0].abilityId = differentAbility;
    expect(codes(team)).toContain("ABILITY_NOT_AVAILABLE");

    const mismatchedMegaStone = items.find(
      (item) => item.enablesMegaFor?.length && !item.enablesMegaFor.includes(team.pokemon[0].speciesId!)
    )!;
    team.pokemon[0].abilityId = firstSpecies.abilities[0];
    team.pokemon[0].itemId = mismatchedMegaStone.id;
    const result = validateTeamSheet(team);
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "MEGA_ITEM_MISMATCH", severity: "warning" })]));
    expect(result.isValid).toBe(true);
  });
});
