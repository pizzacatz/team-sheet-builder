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

const normalizeSearchPhrase = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const matchesWordPrefix = (candidate: string, query: string, compactQuery: string): boolean => {
  const normalizedCandidate = normalizeSearchPhrase(candidate);
  return (
    normalizedCandidate.startsWith(query) ||
    normalizedCandidate.includes(` ${query}`) ||
    normalizeName(candidate).startsWith(compactQuery)
  );
};

export const searchOptions = (options: AutocompleteOption[], query: string): AutocompleteOption[] => {
  const normalizedQuery = normalizeSearchPhrase(query);
  const compactQuery = normalizeName(query);
  if (!normalizedQuery || !compactQuery) return sortOptions(options);

  return sortOptions(
    options.filter((option) =>
      [option.label, ...(option.aliases ?? [])].some((candidate) =>
        matchesWordPrefix(candidate, normalizedQuery, compactQuery)
      )
    )
  );
};
