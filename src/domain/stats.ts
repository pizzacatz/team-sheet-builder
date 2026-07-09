import type { SpeciesRecord, StatAlignmentRecord } from "./dataTypes";
import { emptyPokemonStats, type PokemonStats, type StatKey } from "./teamTypes";

export const statRows: Array<{ key: StatKey; label: string }> = [
  { key: "hp", label: "HP" },
  { key: "atk", label: "Atk" },
  { key: "def", label: "Def" },
  { key: "spa", label: "Sp. Atk" },
  { key: "spd", label: "Sp. Def" },
  { key: "spe", label: "Speed" }
];

export type PokemonStatPoints = Record<StatKey, number>;

export const normalizePokemonStats = (stats: Partial<PokemonStats> | undefined): PokemonStats => ({
  ...emptyPokemonStats(),
  ...(stats ?? {})
});

export const emptyPokemonStatPoints = (): PokemonStatPoints => ({
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0
});

const statValue = (species: SpeciesRecord, stat: StatKey): number => {
  const presented = species.presentedStats?.[stat];
  if (presented !== undefined) return presented;
  const base = species.baseStats?.[stat];
  if (base === undefined) return 0;
  return stat === "hp" ? base + 75 : base + 20;
};

const alignmentMultiplier = (stat: StatKey, alignment: Pick<StatAlignmentRecord, "raises" | "lowers"> | null | undefined): number => {
  if (stat === "hp" || !alignment) return 1;
  if (alignment.raises === stat) return 1.1;
  if (alignment.lowers === stat) return 0.9;
  return 1;
};

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

export const STAT_POINT_MAX = 32;

export type StatBound = { min: number; max: number };

// Legal range for a final displayed stat, matching the engine: a stat is the
// presented value (base+20, or base+75 for HP) plus 0..32 Stat Points, then
// floored after the raised (x1.1) / lowered (x0.9) alignment. HP takes no
// alignment. Used to catch Stat-Point spreads typed into a stat field.
export const statBounds = (species: SpeciesRecord, stat: StatKey): StatBound => {
  const presented = statValue(species, stat);
  if (stat === "hp") {
    return { min: presented, max: presented + STAT_POINT_MAX };
  }
  return {
    min: Math.floor(presented * 0.9),
    max: Math.floor((presented + STAT_POINT_MAX) * 1.1)
  };
};

export const statsFromSpeciesWithPoints = (
  species: SpeciesRecord | null | undefined,
  points: Partial<PokemonStatPoints> | undefined,
  alignment?: Pick<StatAlignmentRecord, "raises" | "lowers"> | null
): PokemonStats => {
  if (!species) return emptyPokemonStats();
  const statPoints = { ...emptyPokemonStatPoints(), ...(points ?? {}) };
  return statRows.reduce((nextStats, stat) => {
    const rawValue = statValue(species, stat.key) + statPoints[stat.key];
    const finalValue = stat.key === "hp" ? rawValue : Math.floor(rawValue * alignmentMultiplier(stat.key, alignment));
    nextStats[stat.key] = String(finalValue);
    return nextStats;
  }, emptyPokemonStats());
};
