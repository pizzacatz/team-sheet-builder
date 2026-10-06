import abilitiesJson from "../data/regulation-mc/abilities.json";
import itemsJson from "../data/regulation-mc/items.json";
import megaEvolutionsJson from "../data/regulation-mc/mega-evolutions.json";
import movesJson from "../data/regulation-mc/moves.json";
import rulesJson from "../data/regulation-mc/rules.json";
import speciesJson from "../data/regulation-mc/species.json";
import statAlignmentsJson from "../data/regulation-mc/stat-alignments.json";
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

// Base-form labels, keyed by species id (slug). When a Pokédex number has
// several form records, the generated data gives the base form the bare name
// (e.g. "Lycanroc"). Every such base form must be decided in exactly one of the
// two lists below; src/domain/variantForms.test.ts fails until it is, so a new
// regulation can't add a form group without someone choosing.
//
// The rule:
// - LABEL the base form when its sibling forms are equally valid alternatives
//   and the bare name doesn't say which one is meant: gender (-M), time of day,
//   plumage colour, Amped vs Low-Key, and the like.
// - LEAVE IT BARE for regional variants, size variants, and bases whose bare
//   name is already the form's own name (Rotom).
//
// A label replaces displayName and pdfName. The bare name stays an alias so
// typing and imports still resolve, and showdownAliases are left untouched.
export const displayOverrides: Record<string, string> = {
  // Gender base forms (paired with an -F record). A female import is routed to
  // the -F record (GENDER_FEMALE_FORM in parseShowdownPaste), so the base is -M.
  meowstic: "Meowstic-M",
  basculegion: "Basculegion-M",
  indeedee: "Indeedee-M",
  // Equally common alternative forms.
  lycanroc: "Lycanroc-Midday",
  toxtricity: "Toxtricity-Amped",
  squawkabilly: "Squawkabilly-Green"
};

// Base forms deliberately left with their bare name, with the reason.
export const unlabelledBaseForms: Record<string, "regional" | "size" | "canonical name"> = {
  raichu: "regional",
  ninetales: "regional",
  persian: "regional",
  arcanine: "regional",
  slowbro: "regional",
  tauros: "regional",
  typhlosion: "regional",
  slowking: "regional",
  samurott: "regional",
  zoroark: "regional",
  stunfisk: "regional",
  goodra: "regional",
  avalugg: "regional",
  decidueye: "regional",
  gourgeist: "size",
  rotom: "canonical name"
};

export const species = (speciesJson as SpeciesRecord[]).map((record) => {
  const override = displayOverrides[record.id];
  const extraAliases = [...megaAliasesFor(record), ...(override ? [override] : [])];
  if (!override && extraAliases.length === 0) return record;
  const next: SpeciesRecord = { ...record };
  if (override) {
    next.displayName = override;
    next.pdfName = override;
  }
  if (extraAliases.length) {
    next.aliases = [...(record.aliases ?? []), ...extraAliases];
  }
  return next;
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
