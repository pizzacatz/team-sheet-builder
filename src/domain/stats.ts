import type { SpeciesRecord } from "./dataTypes";
import { emptyPokemonStats, type PokemonStats, type StatKey } from "./teamTypes";

export const statRows: Array<{ key: StatKey; label: string }> = [
  { key: "hp", label: "HP" },
  { key: "atk", label: "Atk" },
  { key: "def", label: "Def" },
  { key: "spa", label: "Sp. Atk" },
  { key: "spd", label: "Sp. Def" },
  { key: "spe", label: "Speed" }
];

export const normalizePokemonStats = (stats: Partial<PokemonStats> | undefined): PokemonStats => ({
  ...emptyPokemonStats(),
  ...(stats ?? {})
});

export const statsFromSpecies = (species: SpeciesRecord | null | undefined): PokemonStats => {
  if (!species?.presentedStats) return emptyPokemonStats();
  return {
    hp: String(species.presentedStats.hp),
    atk: String(species.presentedStats.atk),
    def: String(species.presentedStats.def),
    spa: String(species.presentedStats.spa),
    spd: String(species.presentedStats.spd),
    spe: String(species.presentedStats.spe)
  };
};
