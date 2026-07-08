import { beforeEach, describe, expect, it } from "vitest";
import { loadTeamSheet } from "./localStorage";

describe("localStorage team recovery", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("restores known Player Info fields and normalizes locally stored values", () => {
    window.localStorage.setItem(
      "team-sheet-builder:current",
      JSON.stringify({
        player: {
          name: "Casey Champion",
          division: "Professor",
          playerId: "AB12-34x56",
          supportId: 123,
          extra: "ignored"
        },
        pokemon: []
      })
    );

    expect(loadTeamSheet().player).toMatchObject({
      name: "Casey Champion",
      division: "",
      playerId: "123456",
      supportId: ""
    });
    expect("extra" in loadTeamSheet().player).toBe(false);
  });
});
