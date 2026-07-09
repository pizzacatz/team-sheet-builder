import { describe, expect, it } from "vitest";
import { normalizePokemonStats } from "../domain/stats";
import { makeValidTeamSheet } from "../tests/fixtures";
import {
  decodeTeamDataFromScan,
  decodeTeamDataFromText,
  encodeTeamDataLines,
  encodeTeamDataPayload,
  encodeTeamDataQrPayload,
  encodeTeamDataQrText,
  TEAM_DATA_COMPRESSED_SENTINEL,
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
        stats
      });
    });
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

  it("decodes the single-line QR text with the shared decoder", () => {
    const teamSheet = makeValidTeamSheet();
    const qrText = encodeTeamDataQrText(teamSheet);
    expect(decodeTeamDataFromText(qrText)).toEqual(decodeTeamDataFromText(encodeTeamDataLines(teamSheet).join("\n")));
  });

  it("round-trips the compressed corner-QR payload and stays smaller than plain", async () => {
    const teamSheet = makeValidTeamSheet();
    const qrPayload = await encodeTeamDataQrPayload(teamSheet);
    expect(qrPayload.startsWith(`${TEAM_DATA_COMPRESSED_SENTINEL}~`)).toBe(true);
    expect(qrPayload.length).toBeLessThan(encodeTeamDataQrText(teamSheet).length);

    const decoded = await decodeTeamDataFromScan(qrPayload);
    expect(decoded).toEqual(decodeTeamDataFromText(encodeTeamDataLines(teamSheet).join("\n")));
  });

  it("decodeTeamDataFromScan still handles the plain transparent-text carrier", async () => {
    const teamSheet = makeValidTeamSheet();
    const fromScan = await decodeTeamDataFromScan(encodeTeamDataLines(teamSheet).join("\n"));
    expect(fromScan).toEqual(decodeTeamDataFromText(encodeTeamDataLines(teamSheet).join("\n")));
  });

  it("returns no pokemon for text without the sentinel", () => {
    expect(decodeTeamDataFromText("nothing to see here")).toEqual([]);
  });
});
