# Team Sheet Builder

A static, client-side team sheet builder for Pokémon Champions Regulation M-B.

Live app: <https://teamsheet.georgiaplayevents.com/>

## What It Does

- Builds Regulation M-B team sheets from manual entry or a Pokémon Showdown paste.
- Validates required player/team fields, species clause, item clause, legal species/items/abilities/moves, ability availability, and move learnsets; non-functional Mega Stone pairings produce a warning.
- Uses local Regulation M-B dictionaries exported from Champions Logic data.
- Generates Play! Pokémon team-list PDFs entirely in the browser.
- Supports Open Team Sheet, Staff Team Sheet, Both Team Sheets, and PDF preview before download.
- Saves the active form in localStorage to reduce accidental data loss.
- Lets Player Info be downloaded/uploaded as a local JSON file.
- Runs as a static GitHub Pages app with no backend, accounts, database, or external runtime API.

## Current UI Features

- Desktop layout follows the official team-sheet shape: player info in two columns and Pokémon in a 2x3 grid.
- Mobile layout uses a single-column Pokémon flow with validation/download controls floating at the bottom.
- Validation details are collapsed by default on desktop and mobile. Selecting the summary expands the list; selecting an issue scrolls to and focuses the associated field.
- The mobile floating tray hides while a field is being edited so it does not compete with the keyboard.
- The compact mobile tray exposes `Both Team Sheets`; its expansion exposes the separate Open and Staff downloads. PDF preview and whole-team clearing remain desktop-only.
- Each Pokémon card has a trash button for clearing that slot.
- Persistent, right-aligned in-field labels keep completed fields identifiable without relying on placeholders.
- Light and dark themes are available from the header toggle.
- PDF output includes the footer watermark `teamsheet.georgiaplayevents.com`.

## Autocomplete Behavior

Autocomplete uses deterministic normalized prefix matching, not fuzzy or relevance-based search.

- Clicking a blank Pokémon, Held Item, or Stat Alignment field opens its complete scrollable list.
- After a Pokémon is selected, blank Ability and Move fields open complete alphabetical lists containing only legal options for that species.
- Without a selected Pokémon, blank Ability and Move fields remain quiet; typing searches the complete global dictionary.
- Matching ignores capitalization, accents, punctuation, and spacing differences.
- A query can match the beginning of the complete name or any individual word. For example, `berry` finds all Berry items.
- Results use stable match tiers:
  1. displayed name begins with the query.
  2. a later displayed-name word begins with the query.
  3. an alias begins with the query.
  4. a later alias word begins with the query.
- Results are alphabetical within each tier. For example, `wave` places `Wave Crash` before `Heat Wave`.
- Arrow keys navigate results, Enter selects, and Escape closes the menu.
- Clicking a completed field again opens its complete relevant list.

## Showdown Import Notes

- `Level 50` lines are ignored silently.
- `EVs:` are treated as Champions Stat Points, not standard Showdown EVs.
- Imported Stat Points are added to presented stats and then modified by Stat Alignment:
  - raised stat: `1.1x`
  - lowered stat: `0.9x`
- Old neutral natures import as `Serious`; the visible neutral list only includes `Serious`.
- Pokémon only require Move 1 for legality in this app; Moves 2-4 may be blank.
- Mega Stones:
  - the relevant Mega Stone for a selected species is always available in item suggestions.
  - non-relevant Mega Stones are hidden by default but can be found when typing at least five matching characters.

## Player Info Rules

Required fields:

- Player Name
- Trainer Name in Game
- Age Division
- Player ID

Player ID accepts digits only and preserves leading zeros.

Date of Birth:

- Uses `02-27-1996` as its format example.
- Autoformats six digits as `MM-DD-YY` and eight digits as `MM-DD-YYYY`.
- Does not infer a century for two-digit years.
- Provides a calendar picker on desktop; the picker is hidden on mobile because of inconsistent Chrome mobile behavior.

Player Info can be downloaded as JSON and uploaded later. Team form state is also saved automatically in browser localStorage.

## PDF Output

PDF generation uses `pdf-lib` in the browser. The PDF code is lazy-loaded only when a user previews or downloads a sheet, keeping the initial app bundle smaller.

Available PDF actions:

- `Open Team Sheet`: opponent-facing sheet without private stats.
- `Staff Team Sheet`: staff-facing sheet with stats.
- `Both Team Sheets`: combined PDF.
- `Preview PDF`: opens a desktop preview modal for the combined PDF before downloading.

PDF actions remain disabled while validation contains errors. Mobile omits preview because Chrome mobile does not reliably display the generated object-URL PDF.

## Local Development

Prerequisites:

- Node.js 22
- npm

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build production assets:

```bash
npm run build
```

Preview a production build locally:

```bash
npm run preview
```

## Data Export

Regulation data lives under `src/data/regulation-mb/` and is generated from a local Champions Logic SQLite export.

```bash
npm run data:export
```

The export script currently expects the Champions Logic database at:

```txt
/home/nuc1/Documents/Coding Projects/champions_logic/data/champions_logic.db
```

After regenerating data, run tests and a production build before committing.

## Project Structure

```txt
src/
  app/                 React app shell, styling, mobile tray helpers
  components/          Form panels, autocomplete, validation, PDF actions
  data/regulation-mb/  Local Regulation M-B JSON dictionaries
  domain/              Team types, validation, legality, stats, normalization
  importers/showdown/  Showdown paste parser
  pdf/                 PDF generation and coordinate mapping
  state/               localStorage-backed team sheet state
  tests/               Shared fixtures and domain/PDF tests
public/templates/      PDF team-list template
.github/workflows/     GitHub Pages deployment workflow
```

## GitHub Pages Deployment

Pushes to `main` run `.github/workflows/pages.yml`.

The workflow:

1. Checks out the repo.
2. Installs dependencies with `npm ci`.
3. Runs `npm test`.
4. Runs `npm run build`.
5. Uploads `dist/` to GitHub Pages.

Manual deployment is also available from the `Deploy GitHub Pages` workflow dispatch in GitHub Actions.

## Verification Checklist

Before pushing meaningful changes:

```bash
npm test
npm run build
```

For UI changes, also check:

- desktop layout around player info and the 2x3 Pokémon grid.
- mobile layout around the floating validation/download tray.
- PDF preview/download for a known-valid team.
- Showdown paste import with Stat Points and Stat Alignment.

## Product Spec

The original planning document is [Team_Sheet_Builder_PRD.md](./Team_Sheet_Builder_PRD.md). It remains useful for design intent and constraints, but the README reflects the current implemented behavior.
