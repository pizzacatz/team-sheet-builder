import type { PokemonEntry } from "./teamTypes";
import { abilitiesById, itemsById, movesById, speciesById } from "./regulationData";
import { normalizePokemonStats } from "./stats";

export const getSpeciesRecord = (speciesId: string | null | undefined) =>
  speciesId ? speciesById.get(speciesId) ?? null : null;

export const getAbilityRecord = (abilityId: string | null | undefined) =>
  abilityId ? abilitiesById.get(abilityId) ?? null : null;

export const getItemRecord = (itemId: string | null | undefined) =>
  itemId ? itemsById.get(itemId) ?? null : null;

export const getMoveRecord = (moveId: string | null | undefined) =>
  moveId ? movesById.get(moveId) ?? null : null;

export const isAbilityAvailable = (entry: PokemonEntry): boolean => {
  const species = getSpeciesRecord(entry.speciesId);
  if (!species || !entry.abilityId) return false;
  return species.abilities.includes(entry.abilityId);
};

export const isMoveLearnable = (entry: PokemonEntry, moveId: string): boolean => {
  const species = getSpeciesRecord(entry.speciesId);
  if (!species) return false;
  return species.moves.includes(moveId);
};

export const isMegaItemMatched = (entry: PokemonEntry): boolean => {
  const item = getItemRecord(entry.itemId);
  if (!item?.enablesMegaFor?.length || !entry.speciesId) return true;
  return item.enablesMegaFor.includes(entry.speciesId);
};

export const entryHasAnyData = (entry: PokemonEntry): boolean =>
  Boolean(
    entry.speciesId ||
      entry.displayName.trim() ||
      entry.abilityId ||
      entry.itemId ||
      entry.statAlignment.value ||
      entry.moves.some(Boolean) ||
      Object.values(normalizePokemonStats(entry.stats)).some(Boolean)
  );
