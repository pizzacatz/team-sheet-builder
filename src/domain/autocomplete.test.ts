import { describe, expect, it } from "vitest";
import { makeOptions, searchOptions } from "./autocomplete";

const records = Array.from({ length: 24 }, (_, index) => ({
  id: `option-${index}`,
  displayName: `Option ${String(24 - index).padStart(2, "0")}`,
  aliases: []
}));

describe("autocomplete options", () => {
  it("sorts complete option lists alphabetically", () => {
    const options = makeOptions(records);

    expect(options).toHaveLength(24);
    expect(options[0].label).toBe("Option 01");
    expect(options.at(-1)?.label).toBe("Option 24");
  });

  it("does not truncate an unfiltered list", () => {
    expect(searchOptions(makeOptions(records), "")).toHaveLength(24);
  });

  it("does not truncate matching search results", () => {
    expect(searchOptions(makeOptions(records), "Option")).toHaveLength(24);
  });

  it("matches normalized name and alias prefixes in alphabetical order", () => {
    const options = [
      { id: "soundproof", label: "Soundproof" },
      { id: "big-pecks", label: "Big Pecks" },
      { id: "snow-warning", label: "Snow Warning" },
      { id: "charizardite-x", label: "Charizardite X", aliases: ["Zardite X"] }
    ];

    expect(searchOptions(options, "S").map((option) => option.label)).toEqual([
      "Snow Warning",
      "Soundproof"
    ]);
    expect(searchOptions(options, "pecks")).toEqual([]);
    expect(searchOptions(options, "zard").map((option) => option.label)).toEqual([
      "Charizardite X"
    ]);
  });
});
