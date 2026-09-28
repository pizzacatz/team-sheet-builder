// Shared mapping from a validation issue's `path` to the DOM id of its field,
// plus the rules for *when* an issue is shown. The validation panel and the
// form fields both read `visibleIssues`, so they always agree.

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

// Errors for empty required fields. These wait until the user has had a fair
// chance to fill the field in (see isIssueVisible).
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
  "MISSING_STAT",
  "MISSING_STAT_ALIGNMENT"
]);

type IssueLike = { severity: string; code: string; path: string; message?: string; relatedFields?: string[] };

// Sections are the unit of "started" / "finished": Player Info and each slot.
export const SECTIONS = ["player", "pokemon-0", "pokemon-1", "pokemon-2", "pokemon-3", "pokemon-4", "pokemon-5"];

export const sectionLabel = (section: string): string =>
  section === "player" ? "Player Info" : `Pokémon ${Number(section.slice("pokemon-".length)) + 1}`;

export const sectionForPath = (path: string): string | null => {
  if (path.startsWith("player.")) return "player";
  const match = path.match(/^pokemon\.(\d+)/);
  return match ? `pokemon-${match[1]}` : null;
};

export const sectionForFieldId = (fieldId: string): string | null => {
  if (/^(player-name|trainer-name|age-division-field|player-id|date-of-birth)$/.test(fieldId)) return "player";
  const match = fieldId.match(/^pokemon-(\d+)-/);
  return match ? `pokemon-${match[1]}` : null;
};

// Free-typed fields. Their wrong-value errors wait for blur, so a half-typed
// "1" on the way to "150" is never flagged. Dropdown and radio picks are
// complete the moment they're made, so those check straight away.
const TEXT_FIELD_ID = /^(player-name|trainer-name|player-id|date-of-birth|pokemon-\d+-(hp|atk|def|spa|spd|spe))$/;

const FIELD_ID =
  /^(player-name|trainer-name|age-division-field|player-id|date-of-birth|pokemon-\d+-(species|ability|item|stat-alignment|move-\d|hp|atk|def|spa|spd|spe))$/;

/** The validation field an element belongs to (DOB parts map to the whole date). */
export const fieldIdForElement = (element: EventTarget | null): string | null => {
  let node = element instanceof Element ? element : null;
  while (node) {
    const id = node.id;
    if (id && FIELD_ID.test(id)) return id;
    node = node.parentElement;
  }
  return null;
};

/** The section an element sits in, from the `data-section` attribute on each panel. */
export const sectionForElement = (element: EventTarget | null): string | null =>
  element instanceof Element ? element.closest<HTMLElement>("[data-section]")?.dataset.section ?? null : null;

export type RevealState = {
  // Fields the user has left at least once.
  touchedFields: Set<string>;
  // Started sections the user has moved on from (or imported): show everything.
  finishedSections: Set<string>;
  // Sections revealed by a blocked download/share: show everything, even empty.
  attemptedSections: Set<string>;
  // The text field being typed in right now; its own issues wait for blur.
  focusedField: string | null;
};

export const emptyRevealState = (): RevealState => ({
  touchedFields: new Set(),
  finishedSections: new Set(),
  attemptedSections: new Set(),
  focusedField: null
});

const fieldIdsFor = (issue: IssueLike): string[] =>
  [issue.path, ...(issue.relatedFields ?? [])].map(fieldIdForPath).filter((id): id is string => Boolean(id));

/**
 * One rule for every issue: show it once the user has had a fair chance to fill
 * the field in.
 * - A blocked download reveals everything (until the sheet is valid).
 * - Nothing in an empty section shows otherwise.
 * - A text field being typed in hides its own issues until blur.
 * - Leaving a field, or moving on from a started section, reveals its issues.
 * - Wrong values in dropdown/radio fields show as soon as they're picked.
 */
export const isIssueVisible = (
  issue: IssueLike,
  reveal: RevealState,
  sectionHasData: (section: string) => boolean
): boolean => {
  const section = sectionForPath(issue.path);
  if (!section) return true;
  if (reveal.attemptedSections.has(section)) return true;
  if (!sectionHasData(section)) return false;

  const primary = fieldIdForPath(issue.path);
  if (primary && primary === reveal.focusedField && TEXT_FIELD_ID.test(primary)) return false;
  if (reveal.finishedSections.has(section)) return true;
  if (fieldIdsFor(issue).some((id) => reveal.touchedFields.has(id))) return true;
  return !MISSING_ERROR_CODES.has(issue.code) && Boolean(primary) && !TEXT_FIELD_ID.test(primary!);
};

// "Pokémon 2's HP of 400 is..." reads as "HP of 400 is..." in the panel, where
// the section is already named.
export const inlineMessage = (message: string): string =>
  message.replace(/^Pokémon \d+(?:'s)? (\S)/, (_, first: string) => first.toUpperCase());

// Fields only change colour; the validation panel carries the explanations.
export type FieldFlags = {
  errors: Set<string>;
  warnings: Set<string>;
};

export const collectFieldFlags = (issues: IssueLike[]): FieldFlags => {
  const errors = new Set<string>();
  const warnings = new Set<string>();
  for (const issue of issues) {
    const target = issue.severity === "error" ? errors : warnings;
    for (const path of [issue.path, ...(issue.relatedFields ?? [])]) {
      const id = fieldIdForPath(path);
      if (id) target.add(id);
    }
  }
  for (const id of errors) warnings.delete(id);
  return { errors, warnings };
};

const PLAYER_REQUIRED_PATHS = ["player.name", "player.trainerName", "player.division", "player.playerId", "player.dateOfBirth"];

/** "Player Info 3/5 · Team 2/6" counts, from all issues (visible or not). */
export const computeProgress = (issues: IssueLike[]) => {
  const errorPaths = new Set(issues.filter((issue) => issue.severity === "error").map((issue) => issue.path));
  const playerDone = PLAYER_REQUIRED_PATHS.filter((path) => !errorPaths.has(path)).length;
  const slotsWithErrors = new Set(
    issues
      .filter((issue) => issue.severity === "error")
      .flatMap((issue) => [issue.path, ...(issue.relatedFields ?? [])])
      .map(sectionForPath)
      .filter((section): section is string => Boolean(section?.startsWith("pokemon-")))
  );
  return {
    playerDone,
    playerTotal: PLAYER_REQUIRED_PATHS.length,
    teamDone: 6 - slotsWithErrors.size,
    teamTotal: 6
  };
};
