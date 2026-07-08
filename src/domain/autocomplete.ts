import { normalizeName } from "./normalization";

export type AutocompleteOption = {
  id: string;
  label: string;
  aliases?: string[];
  detail?: string;
};

export const sortOptions = (options: AutocompleteOption[]): AutocompleteOption[] =>
  [...options].sort((left, right) => left.label.localeCompare(right.label));

export const makeOptions = <T extends { id: string; displayName: string; aliases?: string[] }>(
  records: T[],
  detail?: (record: T) => string | undefined
): AutocompleteOption[] =>
  sortOptions(
    records.map((record) => ({
      id: record.id,
      label: record.displayName,
      aliases: record.aliases ?? [],
      detail: detail?.(record)
    }))
  );

export const searchOptions = (options: AutocompleteOption[], query: string): AutocompleteOption[] => {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return sortOptions(options);

  return sortOptions(
    options.filter((option) =>
      [option.label, ...(option.aliases ?? [])].some((candidate) =>
        normalizeName(candidate).startsWith(normalizedQuery)
      )
    )
  );
};
