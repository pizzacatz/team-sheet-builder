import { itemsById, speciesById } from "../domain/regulationData";
import type { PokemonEntry } from "../domain/teamTypes";
import { PokemonSlot } from "./PokemonSlot";

type TeamFormProps = {
  pokemon: PokemonEntry[];
  onChange: (index: number, patch: Partial<PokemonEntry>) => void;
  onClear: (index: number) => void;
  errorFieldIds?: Set<string>;
};

export function TeamForm({ pokemon, onChange, onClear, errorFieldIds }: TeamFormProps) {
  return (
    <div className="team-form" aria-label="Pokémon team slots">
      {pokemon.map((entry, index) => {
        // Species Clause / Item Clause: options already taken by *other* slots are
        // hidden from this slot's dropdowns (manual entry can still create dupes,
        // which validation flags).
        const usedSpeciesDex = new Set<number>();
        const usedItemIds = new Set<string>();
        pokemon.forEach((other, otherIndex) => {
          if (otherIndex === index) return;
          const otherSpecies = speciesById.get(other.speciesId ?? "");
          if (otherSpecies) usedSpeciesDex.add(otherSpecies.nationalDexNumber);
          const otherItem = other.itemId ? itemsById.get(other.itemId) : undefined;
          if (otherItem?.itemClauseEligible) usedItemIds.add(otherItem.id);
        });
        return (
          <PokemonSlot
            key={index}
            index={index}
            entry={entry}
            usedSpeciesDex={usedSpeciesDex}
            usedItemIds={usedItemIds}
            errorFieldIds={errorFieldIds}
            onChange={(patch) => onChange(index, patch)}
            onClear={() => onClear(index)}
          />
        );
      })}
    </div>
  );
}
