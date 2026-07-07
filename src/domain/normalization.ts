import {
  abilities,
  abilitiesById,
  items,
  itemsById,
  moves,
  movesById,
  species,
  speciesById,
  statAlignments,
  statAlignmentsById
} from "./regulationData";
import type {
  AbilityRecord,
  ItemRecord,
  MoveRecord,
  SpeciesRecord,
  StatAlignmentRecord
} from "./dataTypes";

export type Resolution<T> = {
  record: T;
  ambiguous: boolean;
};

export const normalizeName = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const buildIndex = <T extends { id: string; displayName: string; aliases?: string[]; showdownAliases?: string[] }>(
  records: T[]
): Map<string, T[]> => {
  const index = new Map<string, T[]>();
  for (const record of records) {
    const aliases = new Set([
      record.id,
      record.displayName,
      ...(record.aliases ?? []),
      ...(record.showdownAliases ?? [])
    ]);
    for (const alias of aliases) {
      const key = normalizeName(alias);
      if (!key) continue;
      const existing = index.get(key) ?? [];
      if (!existing.some((candidate) => candidate.id === record.id)) {
        existing.push(record);
      }
      index.set(key, existing);
    }
  }
  return index;
};

const speciesIndex = buildIndex(species);
const moveIndex = buildIndex(moves);
const itemIndex = buildIndex(items);
const abilityIndex = buildIndex(abilities);
const statAlignmentIndex = buildIndex(statAlignments);

const resolve = <T extends { id: string }>(
  value: string | null | undefined,
  byId: Map<string, T>,
  index: Map<string, T[]>
): Resolution<T> | null => {
  if (!value?.trim()) return null;
  if (byId.has(value)) {
    return { record: byId.get(value)!, ambiguous: false };
  }
  const matches = index.get(normalizeName(value)) ?? [];
  if (!matches.length) return null;
  return { record: matches[0], ambiguous: matches.length > 1 };
};

export const resolveSpecies = (value: string | null | undefined): Resolution<SpeciesRecord> | null =>
  resolve(value, speciesById, speciesIndex);

export const resolveMove = (value: string | null | undefined): Resolution<MoveRecord> | null =>
  resolve(value, movesById, moveIndex);

export const resolveItem = (value: string | null | undefined): Resolution<ItemRecord> | null =>
  resolve(value, itemsById, itemIndex);

export const resolveAbility = (value: string | null | undefined): Resolution<AbilityRecord> | null =>
  resolve(value, abilitiesById, abilityIndex);

export const resolveStatAlignment = (
  value: string | null | undefined
): Resolution<StatAlignmentRecord> | null => resolve(value, statAlignmentsById, statAlignmentIndex);

export const displayForId = (
  id: string | null | undefined,
  records: Map<string, { displayName: string }>
): string => (id ? records.get(id)?.displayName ?? id : "");

export const formatSlotLabel = (index: number): string => `Pokémon ${index + 1}`;
