# Design Coherence Audit

An audit of the Team Sheet Builder against the
[Website Vibecoding Audit Checklist](../../vibecoding-practices/website-vibecoding-audit-checklist.md),
with a prioritized list of suggestions. It reports observable design and usability
problems only. It makes no claim about how the site was built.

- **Date:** 2026-09-28
- **Build audited:** `main` at `166ebcf` (branch `avoid-vibecoded-look`), served locally with Vite.
- **Overall assessment:** **Mostly coherent with isolated gaps.** The product is focused,
  honest and free of decorative excess, and its validation flow shows real attention to
  repeated use. The gaps cluster in four places: keyboard use of the dropdown fields,
  color roles that make errors, warnings and the brand accent look alike, the
  intermediate width band (761 to 1100px), and a type scale that has grown by
  per-label tuning.

## Contents

1. [Scope and coverage](#1-scope-and-coverage)
2. [What works and should be preserved](#2-what-works-and-should-be-preserved)
3. [Prioritized findings and suggestions](#3-prioritized-findings-and-suggestions)
4. [Smaller suggestions](#4-smaller-suggestions)
5. [Completed checklist](#5-completed-checklist)
6. [Root causes and correction plan](#6-root-causes-and-correction-plan)
7. [Minimal design contract](#7-minimal-design-contract)
8. [Follow-up verification](#8-follow-up-verification)

## 1. Scope and coverage

**Product.** A single-page tool for Play! Pokémon Video Game Championship players. It
turns a Showdown paste (or manual entry) plus player details into the official Video
Game Team List PDF, validated against Regulation M-C. Core tasks:

1. Get a team into the form (paste, Replica ID, or manual entry).
2. Fill in the eight Player Info fields.
3. Fix validation problems and download, share or email the sheet.

**Evidence used.**

- Source code: all components, `styles.css`, `index.html`, validation and state modules.
- Headless Chromium (Playwright) against the local dev server, at 1440×900, 1280×800,
  1100×800, 900×900, 768×1000, 390×844 (touch) and 320×640 (touch), plus 1280 in dark mode.
- States inspected: empty, partially imported team (3 Pokémon with a duplicate item, an
  unknown move and a missing spread), blocked download, and dark theme.
- Measurements: horizontal overflow, rendered font sizes, target sizes, Tab order, and
  WCAG contrast ratios computed from the color tokens.

**Not verified.**

- A real phone keyboard.
- Screen readers.
- Browser zoom. The 200% layout was approximated by the 600 to 760px samples.
- The Replica lookup and its network failures. The feature is disabled without `VITE_REPLICA_VIEWER_URL`.
- The Web Share sheet, the mail client handoff, and the downloaded PDF in a browser. PDF output is covered by unit tests.

## 2. What works and should be preserved

These are deliberate, product-specific choices. Revisions should keep them.

- **Product-specific identity (V10, C01, C02).** The in-field labels mirror the official
  paper form. The output is the official template, and the vocabulary (Stat Alignment,
  Paste Export, Replica Team ID, Email to TO) is the audience's own. There is no
  marketing copy, and no placeholder "unlock insights" language.
- **No decorative excess (V01 to V09).** There are no gradients, glass effects, glows, emoji, badges or
  entrance animations. Cards map to real units (Import, Player Info, six slots,
  Validation, Actions). Icons appear only on actions and use one set (lucide, 18px).
- **A validation model built for repeated use (F05, U08).**
  - Problems appear once a field has had a fair chance: on blur, on moving to another section, or after a blocked download.
  - The panel and the fields always agree.
  - Rows jump to the field.
  - Clearing a section resets it.
  - The model is documented in the README.
- **Honest escape hatch (I05, I09).** A blocked download explains why and offers
  "Download anyway" rather than silently refusing. That is a realistic accommodation for
  players whose TO wants the sheet regardless.
- **Proportionate confirmation (I05).** The app asks for confirmation only before an import or
  shared link replaces existing data. Routine edits don't interrupt.
- **Product scars that solve real problems (U01, U04, U08).**
  - Autosave to localStorage.
  - One-tap paste-and-import from the clipboard.
  - Species and item clause filtering in dropdowns.
  - Mega Stone suggestions scoped to the species.
  - Shareable `#t=` links.
  - Dropdowns that keep three rows above the phone keyboard.
  - The mobile tray hiding while a field is being edited.
- **A complete dark theme** with its own token set, not an inverted palette.
- **Resilient layout.** No horizontal overflow at any tested width, no console errors.
- **Contextual accessible names (A06).** Icon buttons name their target ("Clear Pokémon 3",
  "Clear Player Info"), and fields expose `aria-invalid` and `aria-required`.

## 3. Prioritized findings and suggestions

Severity and confidence follow the checklist's definitions. Each finding ends with a
concrete suggestion and an acceptance check.

### F1. Tab key walks into dropdown options and drops focus

- **Checklist:** A01, A02, F08, I06
- **Severity / confidence:** High / High
- **Location:** Every autocomplete field (Pokémon, Stat Alignment, Ability, Held Item, Moves), all widths.
- **Evidence:** Tab order from the top of the page at 1280px:
  `… support-id → Clear Pokémon 1 → pokemon-0-species → option-0 → option-1 → option-2
  → option-3 → option-4 → (focus lost to the page) → pokemon-0-stat-alignment → option-0 …`.
  Suggestion rows are plain `<button>`s, so Tab enters them. The input's blur then closes the list 120ms later,
  removing the focused option.
- **Consequence:**
  - A keyboard user needs 5 or more extra Tab presses per field, about 50 per Pokémon.
  - Focus vanishes mid-form, and a screen reader loses its place.
  - Completing the form by keyboard is effectively impractical.
- **Suggestion:**
  - Follow the ARIA combobox pattern the component already half-implements (it uses `aria-activedescendant`).
  - Give each option `tabIndex={-1}`, so arrow keys move through options and Tab leaves the field.
  - Choose a Tab behavior for an open list with an active option. Either commit it (like a native `<select>`) or close the list without committing. Document the choice.
- **Acceptance check:** From Player Info, 12 Tab presses reach Pokémon 1's Move 4 with no
  option ever focused and `document.activeElement` never becoming `<body>`.

### F2. Errors, warnings and the brand accent share one color family

- **Checklist:** D07, A08, A07, I08
- **Severity / confidence:** High / High
- **Location:** Field states, status pills, issue rows, buttons, focus rings; light theme especially.
- **Evidence (computed contrast):**
  - The error field background `#fff0ec` against the warning background `#ffecd8` is 1.04:1.
  - The error border `#d25345` against the warning border `#d67642` is 1.29:1.
  - The warning border is the same hex as the brand accent `--accent`.
  - The "12 errors" pill uses the *warning* palette.
  - The "Ready" pill uses the accent palette, so a good state and a bad state look alike.
  - The focus ring `#f0a069` is also orange, at 2.02:1 against the panel.
- **Consequence:**
  - Since fields now signal problems by color alone (a deliberate product choice), users can't reliably tell a blocking error from an advisory warning, or either from a focused field.
  - Colorblind users (protan/deutan) will see all three as the same.
- **Suggestion:** give each role its own hue and keep them apart from the brand.
  - **Error:** red, used for field borders, the error pill and error rows.
  - **Warning:** amber-yellow (for example `#b7791f` on `#fff6db`), clearly not orange.
  - **Success / Ready:** green (for example `#2f7d4f` on `#e7f5ec`).
  - **Focus:** a blue or high-contrast outline that no status color uses.
  - **Brand orange:** buttons, links and headings only.
  - Keep the colour-only signalling you chose, but add a second, non-text cue so it
    doesn't rest on hue alone. A thicker border (2px) for errors and a dashed or inset
    left bar for warnings would work. So would a small icon at the field's right edge.
    None of these adds explanatory text.
- **Acceptance check:**
  - Any two status colors differ by at least 3:1 in border luminance.
  - In a grayscale screenshot, an error field, a warning field and a focused field are distinguishable.
  - The error pill is red, and the Ready pill is green.

### F3. The 761 to 1100px band gets the worst of both layouts

- **Checklist:** M09, M01, P02, A07, R02
- **Severity / confidence:** Medium / High
- **Location:** Widths between the phone breakpoint (760px) and the sidebar breakpoint (1080px); Player Info up to about 1280px.
- **Evidence:**
  - At 768px and 900px the sidebar becomes `position: static` and drops to the bottom. Validation and Download sit about 2,430px down a 3,220px page. There's no sticky sidebar and no floating tray.
  - At 761 to 1100px Player Info stays two-column. The Age Division options render at 8.4 to 9px.
  - "YYYY" is clipped at 1100px.
- **Consequence:**
  - Tablet and small-laptop users can't see validation while editing.
  - After fixing a field they must scroll to the bottom to download.
  - The Age Division text falls below readable size.
- **Suggestion:**
  - Extend the floating mobile tray (or a slim sticky bottom bar with the status pill and Download) up to 1080px. Alternatively, keep the sidebar sticky down to about 900px by narrowing it.
  - Switch Player Info to one column below about 1280px. The 190px label column and 16px radios then fit without shrinking. This is option 2's fallback, discussed earlier.
- **Acceptance check:** At 768, 900 and 1100px:
  - The status and Download are visible without scrolling to the page end.
  - Age Division text is at least 14px.
  - Date of Birth shows "YYYY" in full.

### F4. Type scale has grown by per-label tuning

- **Checklist:** D01, D12, A07, F01
- **Severity / confidence:** Medium / High
- **Location:** Labels throughout; `styles.css` label overrides at 760px and 420px.
- **Evidence:**
  - On a 390px phone, 14 distinct rendered font sizes appear: 9.9, 10.6, 10.9, 11.2, 11.5, 11.8, 12.2, 12.5, 13.4, 14.1, 15.2, 16, 18 and 25px.
  - Individual labels are resized by `label[for=…]` selectors (0.62rem, 0.68rem, 0.72rem, 0.76rem, 0.84rem, 0.86rem) so each one fits the label column.
  - Stat labels (HP, Atk …) are 10.6px.
  - "Battle Team Number / Name:" is 9.9px on phones.
- **Consequence:**
  - Labels of equal importance look unequally important.
  - The smallest labels are hard to read, especially for players reading on a phone at a venue.
  - Every new or renamed label needs another hand-tuned override.
- **Suggestion:** adopt a five-step scale and fit labels by layout, not by size.
  - **The scale:** 12, 14, 16, 18 and 24/32px for the title.
  - **Fitting labels:**
    - Allow two-line labels at one size (12 or 14px) in a label column sized for them.
    - Or move long labels above the field on phones only. This is the one place a stacked label beats an in-field one.
    - Or shorten the copy where the official form allows ("Battle Team No./Name").
  - Replace the `label[for=…]` overrides with that single rule.
- **Acceptance check:**
  - At 390px, no text is under 12px, and there are no more than six distinct sizes.
  - No `label[for=…]` font-size overrides remain.

### F5. No undo for the trash buttons

- **Checklist:** I10, I09, U03
- **Severity / confidence:** Medium / High
- **Location:** Clear Player Info, Clear Pokémon 1 to 6, Clear import.
- **Evidence:** One click empties the section. Autosave then writes the empty state to localStorage. There's no confirmation (a deliberate choice) and no undo.
- **Consequence:**
  - A mis-tap next to a card title erases a full Pokémon set or all eight player fields, with no way back.
  - The same icon also clears only the paste box in Import, which is a much smaller consequence.
- **Suggestion:**
  - Keep the one-tap clear, and add a 6 to 8 second "Pokémon 3 cleared. Undo" toast that restores the previous state. This respects the "no Are you sure?" decision and makes the action reversible.
  - Consider "Clear paste" wording (or an eraser icon) for the import trash, since it removes no team data.
- **Acceptance check:** Clear Pokémon 3, tap Undo within the window, and the slot and its
  validation state return exactly. After the window, the toast disappears and the clear stands.

### F6. Blocked-download hierarchy inverts the primary action

- **Checklist:** P02, P03, D04, F07
- **Severity / confidence:** Medium / Medium
- **Location:** Actions panel whenever the sheet is invalid.
- **Evidence:**
  - Download renders at 50% opacity (1.74:1 text contrast) but is still the button you're meant to tap.
  - "Download anyway" sits directly below with a full-strength red dashed border, now the most prominent thing in the panel.
  - The primary button's white-on-orange text is 3.22:1 even when enabled.
- **Consequence:**
  - Users read Download as disabled and "Download anyway" as the main path. That is the opposite of the intent.
  - The primary label fails the 4.5:1 text-contrast guideline.
- **Suggestion:**
  - Keep Download at full strength and show the blocked state another way: an error count badge on the button ("Download · 3 to fix"), or the status pill beside it.
  - Make "Download anyway" a quiet text-style link with a warning icon.
  - Darken the accent for button fills (for example `#b85c2c`, about 4.6:1 with white).
- **Acceptance check:**
  - With errors present, Download is the visually dominant control.
  - Its text is at least 4.5:1.
  - "Download anyway" is secondary in weight.

### F7. Mobile tray occupies too much of small screens

- **Checklist:** M08, M03, M01
- **Severity / confidence:** Medium / High
- **Location:** 390×844 and 320×640, touch.
- **Evidence:**
  - After a blocked download the fixed tray covers about 45% of a 390×844 screen and about 55% of 320×640.
  - At 320px the pills wrap ("12 / errors", "1 / warning") and "Email to TO" wraps to two lines.
  - On first load it already covers Player Info.
- **Consequence:** Little of the form stays visible while the error list is open. At
  320px the tray looks broken.
- **Suggestion:**
  - Cap the expanded list at about three rows on phones.
  - Collapse the list automatically once the user taps a row. They're going to the field anyway.
  - At 320px, keep pill text on one line (`white-space: nowrap`) and let "Email to TO" shorten to an icon with an accessible name.
- **Acceptance check:**
  - At 320×640 with errors expanded, at least half the viewport shows the form.
  - No pill or button label wraps.

### F8. Import messages show internal codes

- **Checklist:** C11, D12, C08
- **Severity / confidence:** Low / High
- **Location:** Showdown Import results.
- **Evidence:**
  - Import issues render `LESS_THAN_SIX_POKEMON` and `UNKNOWN_MOVE` in bold above the message.
  - The Validation panel had its codes removed in the latest rework, so the two lists now look different.
  - The warning tells players that sheets have six slots but not that the rest can be filled manually.
- **Suggestion:**
  - Render import issues with the same row component as the Validation panel, without codes.
  - Make the copy actionable: "Imported 3 of 6 Pokémon. Fill in the rest below." and "Couldn't match the move "Notarealmove". Pick it in Pokémon 3's moves."
- **Acceptance check:** No upper-case code strings are visible anywhere in the UI.

### F9. Clipped and truncated values

- **Checklist:** R02, R03, M10
- **Severity / confidence:** Low / High
- **Location:**
  - Date of Birth month placeholder at all widths ("MM" renders as "MV").
  - "YYYY" at 1100px.
  - Long move names in slot columns ("Stomping Tantr" at 1280px).
- **Evidence:**
  - The month and day inputs are 26px wide, while "MM" needs about 28px.
  - Move inputs cut text with no ellipsis.
- **Suggestion:**
  - Size the date segments in `ch` units (`width: 2.6ch` / `4.6ch`).
  - Give autocomplete inputs `text-overflow: ellipsis` and a `title` holding the full name.
- **Acceptance check:** "MM", "DD" and "YYYY" are fully visible at every tested width, and
  long move names end in an ellipsis with the full name available on hover or focus.

### F10. Stat entry expectations appear only after a mistake

- **Checklist:** F04, C07, U06
- **Severity / confidence:** Low / Medium
- **Location:** The six stat boxes in each slot.
- **Evidence:** Nothing indicates that the boxes want final level-50 stats rather than
  Stat Points. The only explanation is the STAT_OUT_OF_RANGE panel message after the fact.
  Players coming from Showdown EV spreads are the likeliest to guess wrong.
- **Suggestion:**
  - Add one short column heading above the stat boxes, such as "Lv 50 stats".
  - Or add a placeholder showing the species' 0 SP value once a species is chosen. This is a placeholder only, not an auto-fill, so it respects the decision not to prefill stats.
- **Acceptance check:** A first-time user can tell which number to type before entering one.

## 4. Smaller suggestions

These are Low severity or taste suggestions without demonstrated harm. They are listed so they can be batched.

1. **Header eyebrow (V07, C11).** "M-C · M-C+2026-09-09" repeats the regulation and
   reads as a build ID. Show "Regulation M-C" and move the data date to a footer or tooltip.
2. **Purpose line (P01, C12).** Say what the tool produces and where the data lives:
   "Build and download the official team list PDF. Your team is saved on this device
   only." This helps first-time visitors and builds trust at no cost.
3. **Import panel on return visits (P04, M01).** It opens by default and fills the first phone
   screen even when a saved team exists. Start it collapsed when a team is already saved;
   the collapsed header keeps "Paste and import".
4. **Two styles of "Paste and import" (D04, D09).** The collapsed header uses a rounded pill
   in soft accent, and the body uses the rectangular primary button. Use one button style
   for one action.
5. **Theme toggle weight (D04).** It uses font-weight 800, while other buttons use 700.
   Align it with `.secondary-action`.
6. **Field border contrast (A07, WCAG 1.4.11).** `#c6aa90` on `#fffdf8` is 2.16:1. Darken
   it to about `#a68a70` (3:1) so empty fields read as fields.
7. **Focus visibility (A03).** Field focus is a 24%-alpha orange ring. Pair it with the
   new focus color from F2 at full strength.
8. **Reduced motion (A10).** Wrap the tray slide and chevron rotation in
   `@media (prefers-reduced-motion: no-preference)`.
9. **Email draft completeness (I01).** The "Email to TO" body omits Switch Profile Name
   and Support ID, which are now required. Include all eight fields.
10. **Empty-state copy (C09, S03).** "Complete team data will be checked here." could
    point to the first step: "Paste a Showdown export or start with Player Info."
11. **Validation row order (P04).** Within a Pokémon group, rows follow rule order: Ability
    and Item come before Stat Alignment, although the form shows Stat Alignment first.
    Sort rows by field position.
12. **Small targets (M03).** The Date of Birth segments are 26×27px inside a 40px box.
    Make a click anywhere in the box focus the first empty segment.
13. **Issue rows on desktop (I06).** Each row is a full-width bordered button. That's
    fine, but a hover underline on the text would read more like a link than a block.

## 5. Completed checklist

Status: **Pass**, **Concern** (with finding), **N/A**, **Not verified**.

| ID | Status | Evidence / finding |
| --- | --- | --- |
| P01 | Pass | Official form name is the title; audience recognizes it. Smaller suggestion 2 would help newcomers. |
| P02 | Concern | F6 (blocked state inverts hierarchy). |
| P03 | Concern | F6; otherwise priority is sensible. |
| P04 | Concern | Smaller suggestions 3 and 11. |
| P05 | Pass | Sections map to form sections; actions grouped with validation. |
| P06 | Pass | Structure mirrors the paper form. |
| P07 | Pass | Every panel supports a task; no decorative stats. |
| P08 | N/A | Single-page tool, no app shell. |
| P09 | Pass | Import paths share one pipeline; no duplicate features. |
| P10 | Pass | Sensible defaults; age division derives from birth year. |
| L01 | Pass | Six identical slots are the form's real structure. |
| L02 | Pass | Left-aligned form; right-aligned in-field labels mirror the official sheet. |
| L03 | Pass | Main column plus sidebar is a purposeful asymmetry. |
| L04 | Pass | Whitespace is modest and functional. |
| L05 | Pass | Density suits data entry. |
| L06 | Pass | Title is proportionate; no hero. |
| L07 | Pass | Short copy; no long lines. |
| L08 | Concern | F3 (sidebar placement at intermediate widths). |
| L09 | Pass | No template pacing. |
| L10 | Pass | Supporting UI is quiet. |
| D01 | Concern | F4. |
| D02 | Pass | 4/8/12/16px spacing used consistently. |
| D03 | Pass | 6px controls, 8px panels, pills 999px; one exception in smaller suggestion 4. |
| D04 | Concern | F6, smaller suggestions 4 and 5. |
| D05 | Pass | One input family with in-field labels; stat boxes are a justified variant. |
| D06 | N/A | Single page. |
| D07 | Concern | F2. |
| D08 | Pass | Panels share border, radius and shadow. |
| D09 | Concern | Smaller suggestion 4. |
| D10 | Concern | F2 (focus shares status colors); otherwise consistent. |
| D11 | Pass | One icon set and size; the trash icon covers two consequences (F5). |
| D12 | Concern | F8 (import vs validation rows), F4. |
| V01 | Pass | Cards map to real units. |
| V02 | Pass | Rounding is modest and role-based. |
| V03 | Pass | Only a 1px shadow; no gradients or glass. |
| V04 | Pass | Icons on actions only. |
| V05 | Pass | No emoji. |
| V06 | Pass | Status pills carry real state. |
| V07 | Concern | Smaller suggestion 1. |
| V08 | Pass | Only functional motion (chevron, tray). |
| V09 | Pass | Polish is backed by working validation and PDF output. |
| V10 | Pass | Strongly product-specific. |
| C01 | Pass | Concrete. |
| C02 | Pass | Headings name sections. |
| C03 | Pass | No redundant helper text. |
| C04 | Pass | "Stat Alignment", "Pokémon N", "Player Info" are used consistently. |
| C05 | Pass | "Clear", "Download", "Share" and "Import" are distinct. |
| C06 | Pass | "Email to TO" carries an explanatory title. |
| C07 | Concern | F10. |
| C08 | Pass | Validation messages name the field and fix. PDF errors surface the raw message (acceptable). |
| C09 | Concern | Smaller suggestion 10 (Low). |
| C10 | Pass | No over-explaining. |
| C11 | Concern | F8, smaller suggestion 1. |
| C12 | Pass | No claims or statistics. |
| N01 | N/A | Single page. |
| N02 | N/A | Single page. |
| N03 | N/A | No sidebar navigation. |
| N04 | Pass | `#t=` share links reproduce a team. |
| N05 | Pass | Only the shared team lives in the URL, and it is cleared after loading. |
| N06 | Pass | Refresh restores from localStorage; Back is unaffected by the hash cleanup. |
| N07 | Pass | An invalid share hash is ignored (per the code); not exercised in the browser. |
| N08 | N/A | No detail pages. |
| N09 | Pass | Header links reach their sites. |
| I01 | Not verified | Download, Share and Email outcomes not exercised in a browser. PDF covered by unit tests. Email omission in smaller suggestion 9. |
| I02 | Pass | Controls do what they say. |
| I03 | Pass | Inline editing suits the task. |
| I04 | Pass | No stacked dialogs. |
| I05 | Pass | Confirms only before replacing data. |
| I06 | Pass | Smaller suggestion 13 is taste only. |
| I07 | Pass | One setting (theme), clear effect. |
| I08 | Concern | F2 (states hard to tell apart). Pending labels ("Generating...") are good. |
| I09 | Concern | F5. |
| I10 | Concern | F5. |
| I11 | Pass | Buttons disable while generating. |
| I12 | Pass | Autosave, paste-and-import and share links cut repeat effort. |
| F01 | Concern | F4 (labels shrink to about 10px). In-field labels stay visible after typing. |
| F02 | Pass | All eight Player Info fields are required by the product owner's decision. |
| F03 | Pass | Numeric input modes, digit filtering, DOB auto-advance. |
| F04 | Concern | F10. |
| F05 | Pass | Blur-based validation, no mid-keystroke errors. |
| F06 | Pass | Blocked download flags fields and keeps input. |
| F07 | Concern | F6 (muted-but-active Download). |
| F08 | Concern | F1. |
| F09 | Not verified | Download completion feedback not observed in a browser. |
| S01 | Pass | "Generating..." while the PDF module loads. |
| S02 | Pass | No fake progress. |
| S03 | Concern | Smaller suggestion 10 (Low). |
| S04 | Pass | Autocomplete shows no list when nothing matches; low stakes. |
| S05 | Pass | Errors are shown and input is kept (code review). |
| S06 | N/A | No independent panels fetch data. |
| S07 | N/A | No accounts. |
| S08 | N/A | No routes. |
| S09 | Not verified | Replica lookup disabled locally. |
| S10 | Pass | Error states use the same components and spacing. |
| R01 | Pass | Tested with an uneven 3-Pokémon import and a nickname. |
| R02 | Concern | F9. |
| R03 | Concern | F9. |
| R04 | Pass | Empty optional values render blank on the PDF (per the code). |
| R05 | Pass | 0 to 6 Pokémon handled. |
| R06 | N/A | No tables. |
| R07 | N/A | No metrics. |
| R08 | Pass | Placeholder paste is clearly an example. |
| R09 | Pass | MM/DD/YYYY used consistently. |
| R10 | Pass | "Pokémon" and other accented names render correctly; single language, so localization is not required. |
| M01 | Concern | F7, smaller suggestion 3. |
| M02 | Pass | No horizontal overflow from 320 to 1440px. |
| M03 | Concern | F7, smaller suggestion 12. |
| M04 | N/A | No menu. |
| M05 | Pass | The sticky-hover fix removed the hover dependency. |
| M06 | Not verified | The keyboard-room logic exists; no real device tested. |
| M07 | Pass | The tray fits, though it is too tall (F7). |
| M08 | Concern | F7. |
| M09 | Concern | F3. |
| M10 | Not verified | Browser zoom not tested; the 600 to 760px layouts hold. |
| A01 | Concern | F1. |
| A02 | Concern | F1. |
| A03 | Concern | Smaller suggestion 7, F2. |
| A04 | Pass | Only native confirm dialogs; Escape closes suggestions. |
| A05 | Pass | Real buttons, labels, fieldset/legend, sections with headings. |
| A06 | Pass | Contextual names on icon buttons. |
| A07 | Concern | F2, F4, F6 (3.22:1 button text, 9.9px labels, 2.16:1 field borders). |
| A08 | Concern | F2 (color-only field states with near-identical colors). |
| A09 | Not verified | Screen reader not tested; the panel has no live region. |
| A10 | Concern | Smaller suggestion 8 (Low). |
| A11 | N/A | No informative images. |
| A12 | Pass | ARIA backs real behavior, except the option focus in F1. |
| U01 | Pass | Team, player and theme persist. |
| U02 | Pass | Clearing and valid sheets reset the reveal state. |
| U03 | Concern | F5. |
| U04 | Pass | Paste-and-import, share links. |
| U05 | N/A | No large collections. |
| U06 | Concern | F10. |
| U07 | N/A | Not needed for a once-per-event form. |
| U08 | Pass | Duplicates, nicknames, Mega forms, partial imports handled. |
| T01 | Pass | CSS custom-property tokens for color and control height. |
| T02 | Concern | F4 (`label[for=…]` one-offs). |
| T03 | Pass | Handlers are wired to real behavior. |
| T04 | Pass | No fake data. |
| T05 | Pass | No console errors at any tested width. |
| T06 | Concern | F3 (the 1080px breakpoint strands the sidebar). |
| T07 | Pass | Validation, pending and error paths exist for each action. |
| T08 | Pass | The PDF library is lazy-loaded. |

## 6. Root causes and correction plan

The root causes below are inferred from the evidence.

1. **Keyboard path never exercised.** The combobox options are focusable buttons (F1).
   Fixing this is first priority: it blocks a core task for keyboard users.
2. **Color roles grew from one accent.** Brand, warning, focus and "Ready" all derive
   from the same orange, and error sits too close to it (F2, F6 contrast). A role-based
   palette fixes several findings at once.
3. **Breakpoints tuned at the ends, not the middle.** 760px and 1080px were each tuned
   for phones and wide desktops. The band between inherits a static sidebar and a
   squeezed Player Info (F3, F9).
4. **Fit-by-shrinking.** When text didn't fit, the text was shrunk per element (F4,
   radios in F3). A layout rule (wrap, stack or one column) would scale better.
5. **Reversibility treated as confirmation-or-nothing.** Removing confirmations was
   right, but nothing replaced them (F5).

**Order of work.**

| Step | Changes | Findings | Effort | Depends on |
| --- | --- | --- | --- | --- |
| 1 | Combobox option focus fix | F1 | Small | None |
| 2 | Role-based color tokens (error, warning, success, focus, brand) and a darker button fill | F2, F6 (contrast), smaller suggestions 6 and 7 | Medium | None |
| 3 | Undo toast for clears | F5 | Small to medium | None |
| 4 | Intermediate-width layout: sticky status bar to 1080px, Player Info one column below 1280px | F3, F9 (YYYY) | Medium | Step 2 for bar colors |
| 5 | Type scale and label fitting rule | F4 | Medium | Step 4 (label column widths) |
| 6 | Actions panel hierarchy and tray size | F6, F7 | Small to medium | Step 2 |
| 7 | Copy and consistency pass | F8, F10, smaller suggestions 1 to 5 and 8 to 13 | Small | None |

## 7. Minimal design contract

A short rulebook so future changes stay coherent. Most of it already exists implicitly.

- **Type scale:** 12 / 14 / 16 / 18px, plus the title (clamp 24 to 48px). Labels use 12 or
  14px only; body and field values use 16px.
- **Spacing scale:** 4 / 8 / 12 / 16 / 24px. Panels are padded 16px, and gaps are 8 to 16px.
- **Radius:** 6px for controls, 8px for panels and menus, and full pill radius only for status pills.
- **Buttons:**
  - Primary (filled brand).
  - Secondary (outlined).
  - Icon (40px square, outlined).
  - Quiet text action for escape hatches.
  - Every variant is 40px tall and uses weight 700.
- **Inputs:** 40px tall, with the in-field label column shared by every field in a section.
  Values are 16px at weight 400. When a label doesn't fit, it wraps to two lines at the
  label size or moves above the field (phones). It never shrinks below 12px.
- **Colors by role:**
  - Brand (orange): actions and links.
  - Error: red.
  - Warning: amber.
  - Success: green.
  - Focus: its own color, not used for any status.
  - Status never borrows the brand color.
- **States:** error = error border plus a second non-hue cue; warning = warning border plus
  its own cue; focus = full-strength focus outline. Each state must remain
  distinguishable in grayscale.
- **Cards:** one per real unit (a section of the paper form, the validation panel, the actions).
  Never nest cards.
- **Icons:** lucide at 18px, used on actions only, one icon per concept. Trash means
  "remove data"; clearing the paste box uses a different icon or label.
- **Motion:** only to show a change of state (expand, tray in/out), under 200ms, and
  disabled under `prefers-reduced-motion`.
- **Responsive:** every width from 320 to 1440px keeps the status and the primary action
  reachable without scrolling to the end, and no text renders under 12px.

## 8. Follow-up verification

1. **Real-device keyboard (M06):** on an iPhone and an Android phone, tap an error row for
   a Move field and confirm at least three suggestion rows stay above the keyboard.
2. **Screen reader (A09):** with VoiceOver or TalkBack, confirm a blocked download
   announces the problem count and that `aria-invalid` fields are read as invalid.
   Consider an `aria-live="polite"` region on the status pill.
3. **Browser zoom (M10):** at 200% zoom on a 1280px window, check that labels, radios and
   the actions panel stay usable.
4. **Replica lookup (S09):** with the viewer configured, test an invalid ID, a network
   timeout and a slow response.
5. **PDF handoff (I01, F09):** download, share and email a valid sheet on desktop Chrome,
   Safari and a phone. Confirm the file name, the contents and what the user sees after.
6. **Color-vision check (A08):** after F2, run the field states through a protanopia and
   deuteranopia simulator.
