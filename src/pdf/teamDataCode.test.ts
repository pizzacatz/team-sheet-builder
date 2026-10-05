import { describe, expect, it } from "vitest";
import { normalizePokemonStats } from "../domain/stats";
import { makeValidTeamSheet } from "../tests/fixtures";
import { CODE_INDEX_VERSION } from "./codeIndex";
import {
  decodeTeamDataFromScan,
  decodeTeamDataFromText,
  encodeTeamDataIndexPayload,
  encodeTeamDataLines,
  encodeTeamDataPayload,
  indexPayloadVersion,
  TEAM_DATA_INDEX_SENTINEL,
  TEAM_DATA_SENTINEL
} from "./teamDataCode";

describe("teamDataCode", () => {
  it("round-trips a full team through segmented lines", () => {
    const teamSheet = makeValidTeamSheet();
    const extracted = encodeTeamDataLines(teamSheet).join("\n");
    const decoded = decodeTeamDataFromText(extracted);

    expect(decoded).toHaveLength(6);
    teamSheet.pokemon.forEach((entry, index) => {
      const stats = normalizePokemonStats(entry.stats);
      expect(decoded[index]).toEqual({
        speciesId: entry.speciesId,
        formId: "",
        abilityId: entry.abilityId,
        itemId: entry.itemId,
        moves: entry.moves,
        statAlignmentId: entry.statAlignment.value,
        stats,
        speciesText: "",
        abilityText: "",
        itemText: "",
        moveTexts: ["", "", "", ""],
        statAlignmentText: ""
      });
    });
  });

  it("round-trips unrecognised entries as free text, separators and spaces included", () => {
    const teamSheet = makeValidTeamSheet();
    const entry = teamSheet.pokemon[0];
    teamSheet.pokemon[0] = {
      ...entry,
      speciesId: null,
      displayName: "Lycanroc-Dusk, maybe|~50%",
      itemId: null,
      itemText: "Choice Spoon",
      moves: [entry.moves[0], null, entry.moves[2], entry.moves[3]],
      moveTexts: ["", "Thunderbolt Punch", "", ""],
      statAlignment: { ...entry.statAlignment, value: null, text: "Grumpy" }
    };
    const extracted = encodeTeamDataLines(teamSheet).join("\n");
    const [decoded] = decodeTeamDataFromText(extracted);

    expect(decoded.speciesId).toBe("");
    expect(decoded.speciesText).toBe("Lycanroc-Dusk, maybe|~50%");
    expect(decoded.itemText).toBe("Choice Spoon");
    expect(decoded.moves[1]).toBe("");
    expect(decoded.moveTexts[1]).toBe("Thunderbolt Punch");
    expect(decoded.moves[0]).toBe(entry.moves[0]);
    expect(decoded.statAlignmentText).toBe("Grumpy");
    expect(decoded.abilityId).toBe(entry.abilityId);
  });

  it("omits Player Info from the payload", () => {
    const teamSheet = makeValidTeamSheet();
    const payload = encodeTeamDataPayload(teamSheet);
    expect(payload).not.toContain(teamSheet.player.name);
    expect(payload).not.toContain(teamSheet.player.playerId);
    expect(payload).not.toContain(teamSheet.player.trainerName);
  });

  it("recovers the payload even when lines are reordered and interleaved with noise", () => {
    const teamSheet = makeValidTeamSheet();
    const lines = encodeTeamDataLines(teamSheet);
    const shuffled = [...lines].reverse();
    const noisy = ["Ability: Intimidate", ...shuffled, "teamsheet.georgiaplayevents.com"].join("\n");

    expect(decodeTeamDataFromText(noisy)).toEqual(decodeTeamDataFromText(lines.join("\n")));
  });

  it("segments every line with the versioned sentinel", () => {
    const lines = encodeTeamDataLines(makeValidTeamSheet());
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach((line) => expect(line.startsWith(`${TEAM_DATA_SENTINEL}~`)).toBe(true));
  });

  it("round-trips the indexed corner-QR payload and stays smaller than the slug text", () => {
    const teamSheet = makeValidTeamSheet();
    const qrPayload = encodeTeamDataIndexPayload(teamSheet);
    expect(qrPayload.startsWith(`${TEAM_DATA_INDEX_SENTINEL}${CODE_INDEX_VERSION}`)).toBe(true);
    expect(qrPayload.length).toBeLessThan(encodeTeamDataPayload(teamSheet).length);
    expect(indexPayloadVersion(qrPayload)).toBe(CODE_INDEX_VERSION);

    const decoded = decodeTeamDataFromScan(qrPayload);
    expect(decoded).toEqual(decodeTeamDataFromText(encodeTeamDataLines(teamSheet).join("\n")));
  });

  it("uses only alphanumeric-mode QR characters in the indexed payload", () => {
    const qrPayload = encodeTeamDataIndexPayload(makeValidTeamSheet());
    expect(qrPayload).toMatch(/^[0-9A-Z]+$/);
  });

  it("decodeTeamDataFromScan still handles the plain transparent-text carrier", () => {
    const teamSheet = makeValidTeamSheet();
    const fromScan = decodeTeamDataFromScan(encodeTeamDataLines(teamSheet).join("\n"));
    expect(fromScan).toEqual(decodeTeamDataFromText(encodeTeamDataLines(teamSheet).join("\n")));
  });

  it("returns no pokemon for text without the sentinel", () => {
    expect(decodeTeamDataFromText("nothing to see here")).toEqual([]);
  });
});
