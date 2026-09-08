const GENDER_PATTERN = /\s+\((M|F)\)\s*$/i;

export const extractSpeciesTextFromHeader = (
  headerLine: string
): { speciesText: string; itemText: string | null; gender: "M" | "F" | null } => {
  const itemMatch = headerLine.match(/^(.*?)\s+@\s+(.+)$/);
  const withoutItem = (itemMatch?.[1] ?? headerLine).trim();
  const itemText = itemMatch?.[2]?.trim() ?? null;
  const genderMatch = withoutItem.match(GENDER_PATTERN);
  const gender = genderMatch ? (genderMatch[1].toUpperCase() as "M" | "F") : null;
  const withoutGender = withoutItem.replace(GENDER_PATTERN, "").trim();
  const parenthesized = [...withoutGender.matchAll(/\(([^)]+)\)/g)]
    .map((match) => match[1].trim())
    .filter((value) => !/^(M|F)$/i.test(value));

  if (parenthesized.length) {
    return { speciesText: parenthesized[parenthesized.length - 1], itemText, gender };
  }

  return { speciesText: withoutGender, itemText, gender };
};
