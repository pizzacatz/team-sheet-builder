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

// Manual per-species display overrides, keyed by species id (slug). The
// generated data uses bare names for default forms; these relabel the sheet
// (pdfName) and the UI (displayName) to distinguish them from their regional or
// gender counterparts, which are separate records. The original name stays an
// alias (below) so pastes/imports still resolve here, and showdownAliases are
// left untouched so import matching and any future Showdown export keep the
// real names. Add more "slug": "Label" entries as needed.
const displayOverrides: Record<string, string> = {
  // Regional base forms (paired with an Alola/Galar/Hisui/Paldea variant),
  // labelled by the base form's origin region.
  raichu: "Raichu-Kanto",
  ninetales: "Ninetales-Kanto",
  arcanine: "Arcanine-Kanto",
  slowbro: "Slowbro-Kanto",
  tauros: "Tauros-Kanto",
  typhlosion: "Typhlosion-Johto",
  slowking: "Slowking-Johto",
  samurott: "Samurott-Unova",
  zoroark: "Zoroark-Unova",
  stunfisk: "Stunfisk-Unova",
  goodra: "Goodra-Kalos",
  avalugg: "Avalugg-Kalos",
  decidueye: "Decidueye-Alola",
  // Gender base forms (paired with an -F variant).
  meowstic: "Meowstic-M",
  basculegion: "Basculegion-M",
  // Other multi-form base forms.
  gourgeist: "Gourgeist-Average",
  lycanroc: "Lycanroc-Midday",
  // Base Rotom has no regional/gender qualifier; its variants are appliance
  // forms (Heat/Wash/…), so the bare name is already unambiguous. Listed for
  // completeness — remove if you don't want it relabelled.
  rotom: "Rotom"
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
