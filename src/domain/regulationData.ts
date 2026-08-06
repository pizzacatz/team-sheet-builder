import abilitiesJson from "../data/regulation-mb/abilities.json";
import itemsJson from "../data/regulation-mb/items.json";
import megaEvolutionsJson from "../data/regulation-mb/mega-evolutions.json";
import movesJson from "../data/regulation-mb/moves.json";
import rulesJson from "../data/regulation-mb/rules.json";
import speciesJson from "../data/regulation-mb/species.json";
import statAlignmentsJson from "../data/regulation-mb/stat-alignments.json";
import type {
  AbilityRecord,
  ItemRecord,
  MegaEvolutionRecord,
  MoveRecord,
  RulesRecord,
  SpeciesRecord,
  StatAlignmentRecord
} from "./dataTypes";

// Mega forms aren't separate species in Champions. Registering each mega name
// (e.g. "Venusaur-Mega", "Mega Charizard X") as an alias of its base species
// makes typed and imported mega names default to the non-mega version.
const megaAliasesFor = (record: SpeciesRecord): string[] =>
  (record.allowedMegaForms ?? []).flatMap((mega) => [
    mega.displayName,
    mega.displayName.replace(/^(.+?)-Mega(?:-(.+))?$/, (_match, base: string, suffix?: string) =>
      suffix ? `Mega ${base} ${suffix}` : `Mega ${base}`
    )
  ]);

export const species = (speciesJson as SpeciesRecord[]).map((record) => {
  const megaAliases = megaAliasesFor(record);
  return megaAliases.length ? { ...record, aliases: [...(record.aliases ?? []), ...megaAliases] } : record;
});
export const moves = movesJson as MoveRecord[];
export const abilities = abilitiesJson as AbilityRecord[];
export const items = itemsJson as ItemRecord[];
export const statAlignments = statAlignmentsJson as StatAlignmentRecord[];
export const megaEvolutions = megaEvolutionsJson as MegaEvolutionRecord[];
export const rules = rulesJson as RulesRecord;

export const speciesById = new Map(species.map((record) => [record.id, record]));
export const movesById = new Map(moves.map((record) => [record.id, record]));
export const abilitiesById = new Map(abilities.map((record) => [record.id, record]));
export const itemsById = new Map(items.map((record) => [record.id, record]));
export const statAlignmentsById = new Map(statAlignments.map((record) => [record.id, record]));
export const megaEvolutionsByStone = new Map(
  megaEvolutions.map((record) => [record.megaStoneId, record])
);
