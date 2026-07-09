import codeIndexJson from "../data/regulation-mb/code-index.json";

// Append-only registry mapping every id to a permanent number (see
// scripts/build_code_index.mjs). Numbers are never changed, reordered, or
// reused, so a compact numeric payload printed under an older registry still
// decodes correctly. Used only by the QR carrier; the transparent-text carrier
// stays on self-describing slug ids.

export type CodeIndexCategory = "species" | "forms" | "abilities" | "items" | "moves" | "statAlignments";

type CodeIndexFile = { version: string } & Record<CodeIndexCategory, Record<string, number>>;

const registry = codeIndexJson as CodeIndexFile;

export const CODE_INDEX_VERSION = registry.version;

export const CODE_INDEX_CATEGORIES: CodeIndexCategory[] = [
  "species",
  "forms",
  "abilities",
  "items",
  "moves",
  "statAlignments"
];

export const idToNumber: Record<CodeIndexCategory, Record<string, number>> = {
  species: registry.species,
  forms: registry.forms,
  abilities: registry.abilities,
  items: registry.items,
  moves: registry.moves,
  statAlignments: registry.statAlignments
};

const reverse = (map: Record<string, number>): Map<number, string> =>
  new Map(Object.entries(map).map(([id, number]) => [number, id]));

export const numberToId: Record<CodeIndexCategory, Map<number, string>> = {
  species: reverse(registry.species),
  forms: reverse(registry.forms),
  abilities: reverse(registry.abilities),
  items: reverse(registry.items),
  moves: reverse(registry.moves),
  statAlignments: reverse(registry.statAlignments)
};

/** id -> permanent number (0 means "none/empty"). */
export const numberFor = (category: CodeIndexCategory, id: string | null | undefined): number =>
  (id && idToNumber[category][id]) || 0;

/** permanent number -> id ("" means "none/empty"). */
export const idFor = (category: CodeIndexCategory, number: number): string =>
  (number && numberToId[category].get(number)) || "";
