import { describe, expect, it } from "vitest";
import { normalizePlayerInfo, parsePlayerInfoFile, playerInfoFilename, serializePlayerInfoFile } from "./playerInfoFile";
import type { PlayerInfo } from "./teamTypes";

const player: PlayerInfo = {
  name: "Casey Champion",
  division: "Master",
  trainerName: "Casey",
  teamName: "Team A",
  switchProfileName: "Switch Casey",
  playerId: "123456",
  dateOfBirth: "01-02-03",
  supportId: "SUPPORT"
};

describe("player info file helpers", () => {
  it("round-trips exported player info", () => {
    expect(parsePlayerInfoFile(serializePlayerInfoFile(player))).toMatchObject(player);
  });

  it("accepts a direct player info object", () => {
    expect(parsePlayerInfoFile(JSON.stringify(player))).toMatchObject(player);
  });

  it("keeps only known string fields and valid divisions", () => {
    const normalized = normalizePlayerInfo({
      ...player,
      division: "Professor",
      supportId: 123,
      extra: "ignored"
    });

    expect(normalized.division).toBe("");
    expect(normalized.supportId).toBe("");
    expect("extra" in normalized).toBe(false);
  });

  it("rejects files exported for a different purpose", () => {
    expect(() => parsePlayerInfoFile(JSON.stringify({ kind: "other-file", player }))).toThrow(
      "Choose a player info file exported from this app."
    );
  });

  it("uses a stable local filename", () => {
    expect(playerInfoFilename(player)).toBe("casey-champion.json");
    expect(playerInfoFilename({ name: "" })).toBe("player-info.json");
  });
});
