// Shared mapping from a validation issue's `path` to the DOM id of its field,
// used both by the validation list (click-to-focus) and by the form fields
// (error highlighting).

export const fieldIdForPath = (path: string): string | null => {
  if (path === "player.name") return "player-name";
  if (path === "player.trainerName") return "trainer-name";
  if (path === "player.division") return "age-division-field";
  if (path === "player.playerId") return "player-id";
  if (path === "player.dateOfBirth") return "date-of-birth";

  const pokemonMatch = path.match(/^pokemon\.(\d+)\.([^.]+)(?:\.([^.]+))?/);
  if (!pokemonMatch) return null;

  const [, pokemonIndex, field, childKey] = pokemonMatch;
  if (field === "speciesId") return `pokemon-${pokemonIndex}-species`;
  if (field === "abilityId") return `pokemon-${pokemonIndex}-ability`;
  if (field === "itemId") return `pokemon-${pokemonIndex}-item`;
  if (field === "statAlignment") return `pokemon-${pokemonIndex}-stat-alignment`;
  if (field === "moves" && childKey !== undefined) return `pokemon-${pokemonIndex}-move-${childKey}`;
  if (field === "stats" && childKey !== undefined) return `pokemon-${pokemonIndex}-${childKey}`;

  return null;
};

export const scrollToIssueField = (path: string) => {
  const fieldId = fieldIdForPath(path);
  if (!fieldId) return;

  const element = document.getElementById(fieldId);
  if (!element) return;

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    if (element instanceof HTMLElement) {
      element.focus({ preventScroll: true });
    }
  }, 250);
};

// Errors for empty required fields — highlighted on the field only after a
// download/share attempt, so a fresh empty form is not a wall of red. Every
// other error (a wrong value that was actually entered) highlights immediately.
export const MISSING_ERROR_CODES = new Set<string>([
  "MISSING_PLAYER_NAME",
  "MISSING_TRAINER_NAME",
  "MISSING_AGE_DIVISION",
  "MISSING_PLAYER_ID",
  "MISSING_DATE_OF_BIRTH",
  "MISSING_SPECIES",
  "MISSING_ABILITY",
  "MISSING_ITEM",
  "MISSING_MOVE",
  "MISSING_STAT_ALIGNMENT"
]);

/**
 * DOM ids of fields with an active error. Missing-required errors are included
 * only once `attempted` is true (i.e. the user tried to download/share).
 */
export const collectErrorFieldIds = (
  issues: Array<{ severity: string; code: string; path: string }>,
  attempted: boolean
): Set<string> => {
  const ids = new Set<string>();
  for (const issue of issues) {
    if (issue.severity !== "error") continue;
    if (!attempted && MISSING_ERROR_CODES.has(issue.code)) continue;
    const fieldId = fieldIdForPath(issue.path);
    if (fieldId) ids.add(fieldId);
  }
  return ids;
};
