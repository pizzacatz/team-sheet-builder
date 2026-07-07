import type { PokemonEntry } from "../domain/teamTypes";
import { PokemonSlot } from "./PokemonSlot";

type TeamFormProps = {
  pokemon: PokemonEntry[];
  onChange: (index: number, patch: Partial<PokemonEntry>) => void;
};

export function TeamForm({ pokemon, onChange }: TeamFormProps) {
  return (
    <div className="team-form" aria-label="Pokémon team slots">
      {pokemon.map((entry, index) => (
        <PokemonSlot key={index} index={index} entry={entry} onChange={(patch) => onChange(index, patch)} />
      ))}
    </div>
  );
}
