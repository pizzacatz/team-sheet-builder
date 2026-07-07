import Fuse from "fuse.js";

export type AutocompleteOption = {
  id: string;
  label: string;
  aliases?: string[];
  detail?: string;
};

export const makeOptions = <T extends { id: string; displayName: string; aliases?: string[] }>(
  records: T[],
  detail?: (record: T) => string | undefined
): AutocompleteOption[] =>
  records.map((record) => ({
    id: record.id,
    label: record.displayName,
    aliases: record.aliases ?? [],
    detail: detail?.(record)
  }));

export const searchOptions = (options: AutocompleteOption[], query: string, limit = 12): AutocompleteOption[] => {
  if (!query.trim()) return options.slice(0, limit);
  const fuse = new Fuse(options, {
    keys: ["label", "aliases"],
    threshold: 0.28,
    ignoreLocation: true
  });
  return fuse.search(query, { limit }).map((result) => result.item);
};
