// Shared mapping from a validation issue's `path` to the DOM id of its field,
// plus the rules for *when* an issue is shown. The validation panel and the
// form fields both read `visibleIssues`, so they always agree.

export const fieldIdForPath = (path: string): string | null => {
  if (path === "player.name") return "player-name";
  if (path === "player.trainerName") return "trainer-name";
  if (path === "player.division") return "age-division-field";
  if (path === "player.playerId") return "player-id";
  if (path === "player.dateOfBirth") return "date-of-birth";
  if (path === "player.teamName") return "team-name";
  if (path === "player.switchProfileName") return "switch-profile";
  if (path === "player.supportId") return "support-id";

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

// Rows of dropdown to keep visible between a field and the on-screen keyboard.
const KEYBOARD_ROOM_ROWS = 3;

/**
 * On touch screens, once the keyboard has opened, scroll so the field sits at
 * least three dropdown rows above it. The keyboard animates in after focus, so
 * this re-checks each time the visible area shrinks, for about a second.
 */
export const keepRoomAboveKeyboard = (element: HTMLElement) => {
  const viewport = window.visualViewport;
  if (!viewport || !window.matchMedia?.("(pointer: coarse)").matches) return;

  const adjust = () => {
    if (document.activeElement !== element && !element.contains(document.activeElement)) return;
    const rowHeight = document.querySelector<HTMLElement>(".suggestion")?.offsetHeight || 40;
    const rect = element.getBoundingClientRect();
    const visibleTop = viewport.offsetTop + 8;
    const visibleBottom = viewport.offsetTop + viewport.height;
    const overlap = rect.bottom + KEYBOARD_ROOM_ROWS * rowHeight + 8 - visibleBottom;
    // Never push the field itself off the top of the visible area.
    const shift = Math.min(overlap, rect.top - visibleTop);
    if (shift > 0) window.scrollBy({ top: shift });
  };

  let debounce = 0;
  const onResize = () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(adjust, 80);
  };
  viewport.addEventListener("resize", onResize);
  window.setTimeout(adjust, 350);
  window.setTimeout(() => viewport.removeEventListener("resize", onResize), 1200);
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
      keepRoomAboveKeyboard(element);
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
  "MISSING_TEAM_NAME",
  "MISSING_SWITCH_PROFILE_NAME",
  "MISSING_SUPPORT_ID",
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
  if (/^(player-name|trainer-name|team-name|switch-profile|age-division-field|player-id|date-of-birth|support-id)$/.test(fieldId)) return "player";
  const match = fieldId.match(/^pokemon-(\d+)-/);
  return match ? `pokemon-${match[1]}` : null;
};

// Free-typed fields. Their wrong-value errors wait for blur, so a half-typed
// "1" on the way to "150" is never flagged. Dropdown and radio picks are
// complete the moment they're made, so those check straight away.
const TEXT_FIELD_ID = /^(player-name|trainer-name|team-name|switch-profile|player-id|date-of-birth|support-id|pokemon-\d+-(hp|atk|def|spa|spd|spe))$/;

const FIELD_ID =
  /^(player-name|trainer-name|team-name|switch-profile|age-division-field|player-id|date-of-birth|support-id|pokemon-\d+-(species|ability|item|stat-alignment|move-\d|hp|atk|def|spa|spd|spe))$/;

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
