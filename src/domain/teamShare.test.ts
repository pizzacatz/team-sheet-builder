import { describe, expect, it } from "vitest";
import { normalizePokemonStats } from "./stats";
import { decodeTeamShare, encodeTeamShare } from "./teamShare";
import { makeValidTeamSheet } from "../tests/fixtures";

describe("teamShare", () => {
  it("round-trips the team without player info by default", async () => {
    const team = makeValidTeamSheet();
    const decoded = await decodeTeamShare(await encodeTeamShare(team, false));

    expect(decoded).not.toBeNull();
    expect(decoded!.player).toBeUndefined();
    team.pokemon.forEach((entry, index) => {
      const restored = decoded!.pokemon[index];
      expect(restored.speciesId).toBe(entry.speciesId);
      expect(restored.abilityId).toBe(entry.abilityId);
      expect(restored.itemId).toBe(entry.itemId);
      expect(restored.moves).toEqual(entry.moves);
      expect(restored.statAlignment.value).toBe(entry.statAlignment.value);
      expect(restored.stats).toEqual(normalizePokemonStats(entry.stats));
    });
  });

  it("includes player info only when opted in", async () => {
    const team = makeValidTeamSheet();
    const decoded = await decodeTeamShare(await encodeTeamShare(team, true));
    expect(decoded!.player?.name).toBe(team.player.name);
    expect(decoded!.player?.playerId).toBe(team.player.playerId);
  });

  it("compresses (the encoded link is shorter than the raw JSON)", async () => {
    const team = makeValidTeamSheet();
    const encoded = await encodeTeamShare(team, true);
    expect(encoded.length).toBeLessThan(JSON.stringify(team).length);
    expect(encoded).toMatch(/^[A-Za-z0-9\-_]+$/); // url-safe
  });

  it("returns null for a malformed link", async () => {
    expect(await decodeTeamShare("not-a-real-link")).toBeNull();
  });
});
