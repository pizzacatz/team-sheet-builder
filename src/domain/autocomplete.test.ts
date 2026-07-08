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

  it("matches normalized name, word, and alias prefixes in alphabetical order", () => {
    const options = [
      { id: "soundproof", label: "Soundproof" },
      { id: "big-pecks", label: "Big Pecks" },
      { id: "snow-warning", label: "Snow Warning" },
      { id: "charizardite-x", label: "Charizardite X", aliases: ["Zardite X"] },
      { id: "aguav-berry", label: "Aguav Berry" },
      { id: "berry-juice", label: "Berry Juice" },
      { id: "sitrus-berry", label: "Sitrus Berry" }
    ];

    expect(searchOptions(options, "S").map((option) => option.label)).toEqual([
      "Sitrus Berry",
      "Snow Warning",
      "Soundproof"
    ]);
    expect(searchOptions(options, "berry").map((option) => option.label)).toEqual([
      "Aguav Berry",
      "Berry Juice",
      "Sitrus Berry"
    ]);
    expect(searchOptions(options, "pecks").map((option) => option.label)).toEqual([
      "Big Pecks"
    ]);
    expect(searchOptions(options, "ecks")).toEqual([]);
    expect(searchOptions(options, "zard").map((option) => option.label)).toEqual([
      "Charizardite X"
    ]);
    expect(searchOptions(options, "charizarditex").map((option) => option.label)).toEqual([
      "Charizardite X"
    ]);
  });
});
