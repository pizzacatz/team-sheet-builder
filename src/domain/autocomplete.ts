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

const wordPrefixPosition = (candidate: string, query: string, compactQuery: string): number | null => {
  const normalizedCandidate = normalizeSearchPhrase(candidate);
  if (normalizedCandidate.startsWith(query) || normalizeName(candidate).startsWith(compactQuery)) {
    return 0;
  }
  return normalizedCandidate.includes(` ${query}`) ? 1 : null;
};

const optionMatchTier = (option: AutocompleteOption, query: string, compactQuery: string): number | null => {
  const labelPosition = wordPrefixPosition(option.label, query, compactQuery);
  if (labelPosition !== null) return labelPosition;

  const aliasPositions = (option.aliases ?? [])
    .map((alias) => wordPrefixPosition(alias, query, compactQuery))
    .filter((position): position is number => position !== null);
  if (!aliasPositions.length) return null;
  return 2 + Math.min(...aliasPositions);
};

export const searchOptions = (options: AutocompleteOption[], query: string): AutocompleteOption[] => {
  const normalizedQuery = normalizeSearchPhrase(query);
  const compactQuery = normalizeName(query);
  if (!normalizedQuery || !compactQuery) return sortOptions(options);

  return options
    .map((option) => ({
      option,
      tier: optionMatchTier(option, normalizedQuery, compactQuery)
    }))
    .filter((match): match is { option: AutocompleteOption; tier: number } => match.tier !== null)
    .sort(
      (left, right) =>
        left.tier - right.tier ||
        left.option.label.localeCompare(right.option.label) ||
        left.option.id.localeCompare(right.option.id)
    )
    .map((match) => match.option);
};
