import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { species } from "../domain/regulationData";
import { emptyPokemonEntry, type PokemonEntry } from "../domain/teamTypes";
import { PokemonSlot } from "./PokemonSlot";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("PokemonSlot", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("clears every dependent field without auto-populating stats when the species changes", () => {
    const currentSpecies = species[0]!;
    const nextSpecies = species.find((record) => record.id !== currentSpecies.id)!;
    const entry: PokemonEntry = {
      ...emptyPokemonEntry(),
      speciesId: currentSpecies.id,
      displayName: currentSpecies.displayName,
      abilityId: "old-ability",
      itemId: "old-item",
      moves: ["old-move-1", "old-move-2", "old-move-3", "old-move-4"],
      stats: { hp: "200", atk: "150", def: "120", spa: "90", spd: "110", spe: "130" },
      statAlignment: {
        value: "adamant",
        source: "manual",
        confidence: "high",
        requiresReview: false
      },
      formId: "old-form",
      notes: ["old note"]
    };
    const onChange = vi.fn();

    act(() => {
      root.render(<PokemonSlot index={0} entry={entry} onChange={onChange} onClear={vi.fn()} />);
    });

    const input = container.querySelector<HTMLInputElement>("#pokemon-0-species")!;
    act(() => input.focus());

    const option = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="option"]')).find(
      (candidate) => candidate.querySelector("span")?.textContent === nextSpecies.displayName
    )!;
    act(() => {
      option.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    expect(onChange).toHaveBeenLastCalledWith({
      ...emptyPokemonEntry(),
      speciesId: nextSpecies.id,
      displayName: nextSpecies.displayName,
      canMegaEvolve: Boolean(nextSpecies.allowedMegaForms?.length)
    });
  });
});
