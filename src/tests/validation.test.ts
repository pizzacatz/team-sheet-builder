import { describe, expect, it } from "vitest";
import { items, moves, species, statAlignmentsById } from "../domain/regulationData";
import { presentedStat, statBounds, statsFromSpecies, statsFromSpeciesWithPoints } from "../domain/stats";
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
    team.player.trainerName = "";
    team.player.division = "";
    team.player.playerId = "";
    team.pokemon[0].abilityId = null;
    team.pokemon[0].moves[0] = null;
    team.pokemon[0].statAlignment.value = null;
    expect(codes(team)).toEqual(
      expect.arrayContaining([
        "MISSING_PLAYER_NAME",
        "MISSING_TRAINER_NAME",
        "MISSING_AGE_DIVISION",
        "MISSING_PLAYER_ID",
        "MISSING_ABILITY",
        "MISSING_MOVE",
        "MISSING_STAT_ALIGNMENT"
      ])
    );
  });

  it("allows Pokémon to have only one move", () => {
    const team = makeValidTeamSheet();
    team.pokemon[0].moves[1] = null;
    team.pokemon[0].moves[2] = null;
    team.pokemon[0].moves[3] = null;

    const result = validateTeamSheet(team);
    expect(result.issues.filter((issue) => issue.code === "MISSING_MOVE")).toHaveLength(0);
    expect(result.isValid).toBe(true);
  });

  it("requires a valid Date of Birth, accepting 2- or 4-digit years", () => {
    const team = makeValidTeamSheet();

    team.player.dateOfBirth = "";
    expect(codes(team)).toContain("MISSING_DATE_OF_BIRTH");

    team.player.dateOfBirth = "02-27"; // incomplete
    expect(codes(team)).toContain("INVALID_DATE_OF_BIRTH");

    team.player.dateOfBirth = "13-40-1996"; // impossible month/day
    expect(codes(team)).toContain("INVALID_DATE_OF_BIRTH");

    team.player.dateOfBirth = "02-27-96"; // 2-digit year is fine
    expect(codes(team)).not.toContain("INVALID_DATE_OF_BIRTH");
    expect(codes(team)).not.toContain("MISSING_DATE_OF_BIRTH");
  });

  it("flags a missing held item", () => {
    const team = makeValidTeamSheet();
    team.pokemon[0].itemId = null;
    expect(codes(team)).toContain("MISSING_ITEM");
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

  it("flags a move listed twice on the same Pokémon but allows it across Pokémon", () => {
    const sameSlot = makeValidTeamSheet();
    sameSlot.pokemon[0].moves[1] = sameSlot.pokemon[0].moves[0];
    expect(codes(sameSlot)).toContain("DUPLICATE_MOVE");

    const crossTeam = makeValidTeamSheet();
    crossTeam.pokemon[1].moves[0] = crossTeam.pokemon[0].moves[0];
    expect(codes(crossTeam)).not.toContain("DUPLICATE_MOVE");
  });

  it("flags stats outside the legal range and ignores blanks", () => {
    const team = makeValidTeamSheet();
    const first = species.find((record) => record.id === team.pokemon[0].speciesId)!;
    const spa = statBounds(first, "spa");

    team.pokemon[0].stats.spa = String(spa.max + 1); // over max
    team.pokemon[1].stats.hp = "32"; // a Stat-Point value, far below HP's minimum
    const result = validateTeamSheet(team);
    expect(result.issues.filter((issue) => issue.code === "STAT_OUT_OF_RANGE")).toHaveLength(2);
    expect(result.isValid).toBe(false);
  });

  it("accepts an alignment-consistent spread and requires every stat", () => {
    const team = makeValidTeamSheet();
    const list = codes(team);
    expect(list).not.toContain("STAT_OUT_OF_RANGE");
    expect(list).not.toContain("STAT_ALIGNMENT_MISMATCH");
    expect(list).not.toContain("STAT_POINTS_OVER_BUDGET");
    expect(list).not.toContain("STATS_LOOK_UNTOUCHED");
    expect(list).not.toContain("MISSING_STAT");

    team.pokemon[0].stats.hp = "";
    expect(codes(team)).toContain("MISSING_STAT");
  });

  it("errors when stats can't come from the chosen Stat Alignment", () => {
    const team = makeValidTeamSheet();
    const first = species.find((record) => record.id === team.pokemon[0].speciesId)!;
    // Neutral (presented) stats under Jolly: Spe should be raised but sits at its
    // default, which no Stat Point allocation can produce.
    team.pokemon[0].stats = statsFromSpecies(first);
    expect(codes(team)).toContain("STAT_ALIGNMENT_MISMATCH");
  });

  it("errors when the spread exceeds the 66 Stat Point budget", () => {
    const team = makeValidTeamSheet();
    const first = species.find((record) => record.id === team.pokemon[0].speciesId)!;
    for (const key of ["hp", "atk", "def"] as const) {
      team.pokemon[0].stats[key] = String(presentedStat(first, key) + 32); // 96+ implied points
    }
    expect(codes(team)).toContain("STAT_POINTS_OVER_BUDGET");
  });

  it("warns (not errors) when a Pokémon has no Stat Points invested", () => {
    const team = makeValidTeamSheet();
    const first = species.find((record) => record.id === team.pokemon[0].speciesId)!;
    team.pokemon[0].statAlignment = { value: "Serious", source: "manual", confidence: "high", requiresReview: false };
    team.pokemon[0].stats = statsFromSpecies(first);
    const result = validateTeamSheet(team);
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "STATS_LOOK_UNTOUCHED", severity: "warning" })])
    );
    expect(result.issues.some((issue) => issue.code === "STAT_ALIGNMENT_MISMATCH")).toBe(false);
  });

  it("does not warn 'untouched' when a non-neutral alignment has zero points", () => {
    const team = makeValidTeamSheet();
    const first = species.find((record) => record.id === team.pokemon[0].speciesId)!;
    // 0-SP line under the fixture's Jolly alignment: consistent, but not "default".
    team.pokemon[0].stats = statsFromSpeciesWithPoints(first, {}, statAlignmentsById.get("Jolly"));
    const result = validateTeamSheet(team);
    expect(result.issues.some((issue) => issue.code === "STATS_LOOK_UNTOUCHED")).toBe(false);
    expect(result.issues.some((issue) => issue.code === "STAT_ALIGNMENT_MISMATCH")).toBe(false);
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
