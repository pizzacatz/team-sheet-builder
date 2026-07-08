# Team Sheet Builder — Product Requirements Document

**Project name:** Team Sheet Builder  
**Target regulation:** Pokémon VGC / Pokémon Champions Regulation M-B  
**Document type:** PRD for spec-driven development  
**Primary implementation agent:** Codex CLI  
**Date:** 2026-07-06  
**Owner:** User  

---

## Current Implementation Note

This document is the original product requirements document. The app has since been implemented and iterated beyond the initial MVP. For the current feature list, local development workflow, data export notes, and GitHub Pages deployment details, see [README.md](./README.md).

---

## 1. Summary

Team Sheet Builder is a static, mobile-responsive single-page webapp for quickly creating Pokémon VGC team sheets for Regulation M-B.

The app must support two team-entry paths:

1. **Manual entry:** Users fill out player information and six Pokémon slots using fast autocomplete fields backed by local dictionaries.
2. **Pokémon Showdown paste import:** Users paste a Pokémon Showdown export, the app parses recognizable fields, pre-fills the editable form, validates the result, and generates a fillable or printed-format PDF team sheet.

The MVP must be hostable on GitHub Pages and require no backend, no accounts, no paid API, and no server-side PDF generation.

---

## 2. Success Criteria

The project is successful when there is a single-page webapp that:

- Is mobile-responsive.
- Runs entirely client-side.
- Can be hosted on GitHub Pages.
- Allows users to manually enter a Regulation M-B team.
- Allows users to paste a Pokémon Showdown team and convert it into editable team-sheet data.
- Provides autocomplete for species, forms, abilities, items, moves, and Stat Alignment.
- Validates required team-sheet fields and major Regulation M-B legality constraints.
- Generates a PDF team sheet in the expected official/open-team-list format.
- Uses local dictionaries and rules files to power autocomplete, parsing, normalization, and validation.

---

## 3. Stop Condition

Stop when either condition is met:

1. **MVP complete:** A working client-side app can generate a team-sheet PDF from either manual entry or a Showdown paste, using autocomplete and local validation.
2. **Time limit reached:** One hour of focused implementation time has passed.

If the time limit is reached before full completion, prioritize producing the smallest end-to-end path:

```txt
Hardcoded or manually entered team data → validation → generated PDF download
```

Showdown paste import should be added after PDF generation works unless it is already trivial to wire in.

---

## 4. Primary User

The primary user is an enfranchised Pokémon VGC player who already understands teams, moves, abilities, held items, open team sheets, Pokémon Showdown exports, and Regulation M-B.

This is not a beginner VGC education app. The product should optimize for speed, accuracy, and low-friction event preparation.

---

## 5. Problem Statement

Creating a correct VGC team sheet is tedious and error-prone. Players often already have their team in Pokémon Showdown paste format, but official team sheets require specific structured fields and correct formatting. Manual transcription creates avoidable mistakes, especially with forms, items, abilities, moves, and Stat Alignment.

Team Sheet Builder reduces that friction by converting structured or semi-structured team data into a validated, editable team sheet and then generating a PDF.

---

## 6. Product Principles

1. **MVP over completeness.** A working PDF generator is more important than perfect data coverage.
2. **Static-first.** The app must work as a GitHub Pages-hosted SPA.
3. **No backend.** No database, accounts, server PDF generation, cloud sync, or authentication in MVP.
4. **Import is not validation.** The Showdown parser extracts data; the validation engine decides whether it is complete and legal.
5. **Manual correction always wins.** Inferred or parsed values must be editable.
6. **No silent risky inference.** Low-confidence inferred fields must be marked for review.
7. **Data lives outside UI components.** Regulation data, aliases, legality, and validation rules must be local data/domain modules, not hardcoded React component logic.
8. **PDF output must be deterministic.** The same team data should generate the same PDF.

---

## 7. Scope

### 7.1 In Scope for MVP

- Static SPA using Vite, React, and TypeScript.
- Manual team-sheet entry form.
- Six Pokémon slots.
- Player/event info fields.
- Local autocomplete for:
  - Pokémon species/forms
  - Abilities
  - Held items
  - Moves
  - Stat Alignment
- Pokémon Showdown paste import.
- Name normalization and aliases for imported data.
- Validation panel with errors and warnings.
- Client-side PDF generation.
- GitHub Pages deployment.
- Local JSON dictionary/rules files.
- Basic mobile-responsive layout.
- Basic tests for parser, validation, and PDF generation smoke path.

### 7.2 Out of Scope for MVP

- User accounts.
- Cloud save/sync.
- Server-side PDF generation.
- Rental code lookup.
- Image/OCR import.
- QR code scanning.
- Damage calculator integration.
- Team analysis or strategy suggestions.
- Meta trend summaries.
- Tournament registration integration.
- Automatic downloading from Pokémon Showdown, Pastebin, Limitless, PokéPaste, or other external sites.
- Perfect full Pokédex coverage before the PDF path works.
- Export back to Pokémon Showdown format.
- Multi-regulation support beyond M-B.

---

## 8. Recommended Tech Stack

```txt
Vite
React
TypeScript
pdf-lib
Fuse.js or equivalent lightweight fuzzy search
Local JSON data files
GitHub Pages
Vitest
```

### 8.1 Rationale

- **Vite:** Simple static app build and fast development loop.
- **React:** Useful for repeated Pokémon slot form components and controlled state.
- **TypeScript:** Reduces errors in data modeling, parser output, validation paths, and PDF rendering.
- **pdf-lib:** Enables client-side PDF generation without a backend.
- **Fuse.js:** Enables local fuzzy search/autocomplete.
- **Vitest:** Lightweight unit testing for parser and validation logic.
- **GitHub Pages:** Free static hosting that matches the project constraints.

### 8.2 Technologies to Avoid for MVP

- Next.js
- Firebase
- Supabase
- Serverless functions
- SQL databases
- User authentication
- External paid APIs
- Browser extensions
- Complex state libraries unless absolutely necessary

---

## 9. System Architecture

The app must use a data-driven architecture:

```txt
Local Dictionaries / Rules
        ↓
Manual Form Input OR Showdown Paste Import
        ↓
Canonical TeamSheet Object
        ↓
Validation Engine
        ↓
Editable Review UI
        ↓
PDF Renderer
        ↓
Downloaded PDF
```

### 9.1 Key Architectural Separation

The app must separate these concerns:

- `importers/`: parse external text formats into partial team data.
- `domain/`: define canonical types, normalization, legality, and validation.
- `data/`: store local JSON dictionaries and rules.
- `components/`: render UI only.
- `pdf/`: generate PDF output from canonical reviewed data.
- `state/`: manage current team state and optional local persistence.

Do not put validation, PDF coordinates, or data normalization directly inside React components.

---

## 10. Proposed Folder Structure

```txt
team-sheet-builder/
  public/
    templates/
      pokemon-vg-team-list.pdf
  src/
    app/
      App.tsx
      main.tsx
    components/
      AutocompleteField.tsx
      ImportPanel.tsx
      PlayerInfoForm.tsx
      PokemonSlot.tsx
      TeamForm.tsx
      ValidationPanel.tsx
      PdfActions.tsx
    data/
      regulation-mb/
        abilities.json
        items.json
        moves.json
        rules.json
        species.json
        stat-alignments.json
        aliases.json
        mega-evolutions.json
    domain/
      autocomplete.ts
      legality.ts
      normalization.ts
      teamTypes.ts
      validation.ts
      validationTypes.ts
    importers/
      showdown/
        parseShowdownPaste.ts
        showdownNormalization.ts
        showdownTypes.ts
        showdownParser.test.ts
    pdf/
      generateTeamSheetPdf.ts
      pdfCoordinates.ts
      pdfTypes.ts
    state/
      localStorage.ts
      useTeamSheetState.ts
    tests/
      validation.test.ts
      pdfGeneration.test.ts
  docs/
    PRD.md
    ARCHITECTURE.md
    DATA_MODEL.md
    VALIDATION.md
    TASKS.md
    ADR/
      0001-static-spa.md
      0002-client-side-pdf-generation.md
      0003-showdown-import-as-adapter.md
```

---

## 11. Canonical Data Model

All manual entry and imported data must be normalized into one canonical model.

```ts
export type TeamSheet = {
  player: PlayerInfo;
  regulation: "M-B";
  pokemon: PokemonEntry[];
};

export type PlayerInfo = {
  name: string;
  playerId?: string;
  eventName?: string;
  date?: string;
  division?: "Junior" | "Senior" | "Master" | "";
  teamName?: string;
};

export type PokemonEntry = {
  speciesId: string | null;
  formId?: string | null;
  displayName: string;
  abilityId: string | null;
  itemId: string | null;
  moves: [string | null, string | null, string | null, string | null];
  statAlignment: StatAlignmentField;
  canMegaEvolve?: boolean;
  notes?: string[];
};

export type StatAlignmentField = {
  value: string | null;
  source:
    | "parsed_from_showdown_nature"
    | "inferred_from_evs"
    | "manual"
    | "unknown";
  confidence: "high" | "medium" | "low" | "none";
  requiresReview: boolean;
};
```

---

## 12. Local Dictionary Data Model

### 12.1 Species

```ts
export type SpeciesRecord = {
  id: string;
  nationalDexNumber: number;
  displayName: string;
  aliases: string[];
  showdownAliases: string[];
  pdfName: string;
  legalIn: string[];
  forms: SpeciesFormRecord[];
  abilities: string[];
  moves: string[];
  allowedMegaForms?: string[];
};

export type SpeciesFormRecord = {
  id: string;
  displayName: string;
  aliases: string[];
  showdownAliases: string[];
  pdfName: string;
  legalIn: string[];
};
```

### 12.2 Moves

```ts
export type MoveRecord = {
  id: string;
  displayName: string;
  aliases: string[];
  showdownAliases: string[];
  type?: string;
  category?: "Physical" | "Special" | "Status";
  legalIn: string[];
};
```

### 12.3 Abilities

```ts
export type AbilityRecord = {
  id: string;
  displayName: string;
  aliases: string[];
  showdownAliases: string[];
  legalIn: string[];
};
```

### 12.4 Items

```ts
export type ItemRecord = {
  id: string;
  displayName: string;
  aliases: string[];
  showdownAliases: string[];
  legalIn: string[];
  itemClauseEligible: boolean;
  enablesMegaFor?: string[];
};
```

### 12.5 Stat Alignments

```ts
export type StatAlignmentRecord = {
  id: string;
  displayName: string;
  aliases: string[];
  showdownNatureAliases: string[];
  isNeutral?: boolean;
};
```

---

## 13. Showdown Paste Import

### 13.1 Purpose

Users can paste a Pokémon Showdown team export and have the app pre-fill the editable team-sheet form.

### 13.2 Parser Responsibilities

The parser must:

1. Split pasted text into Pokémon blocks.
2. Extract recognizable fields:
   - species/form
   - held item
   - ability
   - moves
   - nature, when present
   - EVs, when present, for optional low-confidence suggestions
3. Normalize names against dictionary IDs and aliases.
4. Return partial canonical team data.
5. Return import warnings for missing, unknown, or ambiguous values.

The parser must not perform final team legality validation.

### 13.3 Parser Output

```ts
export type ImportResult = {
  teamSheet: Partial<TeamSheet>;
  issues: ImportIssue[];
};

export type ImportIssue = {
  severity: "error" | "warning";
  pokemonIndex?: number;
  field?: string;
  code: string;
  message: string;
};
```

### 13.4 Supported MVP Showdown Syntax

The parser must support standard blocks such as:

```txt
Incineroar @ Safety Goggles
Ability: Intimidate
EVs: 252 HP / 4 Atk / 252 SpD
Careful Nature
- Fake Out
- Parting Shot
- Flare Blitz
- Knock Off
```

It should also support nicknamed Pokémon syntax:

```txt
Big Dog (Arcanine-Hisui) @ Sitrus Berry
```

The parser should ignore fields not needed for the team sheet, including:

- Tera Type
- Level
- Gender
- Shiny
- Happiness
- Dynamax Level
- IVs, unless later needed

### 13.5 More or Fewer Than Six Pokémon

- 0 parsed Pokémon: show import error.
- 1–5 parsed Pokémon: import and warn.
- 6 parsed Pokémon: normal path.
- 7+ parsed Pokémon: import first six and warn for MVP.

---

## 14. Stat Alignment Policy

Stat Alignment is required for the team sheet.

The app must combine parsing, inference, and manual correction using confidence metadata.

### 14.1 Required Behavior

```txt
If Showdown paste contains a Nature line:
  Convert it to Stat Alignment with high confidence.

If Showdown paste contains an old neutral nature:
  Convert it to the neutral Stat Alignment used by the app dictionary.
  Show a warning that a neutral nature was normalized.

If Showdown paste lacks a Nature line:
  Leave Stat Alignment blank.
  Mark it as required.
  Let the user manually select it.

If Showdown paste has EVs but no Nature:
  Optionally suggest likely Stat Alignments.
  Do not silently auto-fill the value.
```

### 14.2 Confidence Rules

- Explicit nature parsed from paste: `confidence = "high"`, `requiresReview = false`.
- Neutral nature normalized: `confidence = "high"`, `requiresReview = true`, warning shown.
- EV-based guess: `confidence = "low"`, `requiresReview = true`, warning shown.
- Manual selection: `confidence = "high"`, `requiresReview = false`, source becomes `manual`.

### 14.3 Manual Override

Manual user selection always wins over parsed or inferred values.

If the user changes a parsed/inferred Stat Alignment, update the source to `manual`.

---

## 15. Validation Requirements

Validation must operate on the canonical `TeamSheet` object.

### 15.1 Validation Result Shape

```ts
export type ValidationResult = {
  isValid: boolean;
  issues: ValidationIssue[];
};

export type ValidationIssue = {
  severity: "error" | "warning";
  path: string;
  code: string;
  message: string;
};
```

### 15.2 Errors

Errors block PDF generation.

Required MVP error codes:

```txt
MISSING_PLAYER_NAME
MISSING_SPECIES
MISSING_ABILITY
MISSING_MOVE
MISSING_STAT_ALIGNMENT
DUPLICATE_SPECIES
DUPLICATE_ITEM
ILLEGAL_SPECIES
ILLEGAL_FORM
ILLEGAL_ABILITY
ILLEGAL_ITEM
ILLEGAL_MOVE
MOVE_NOT_LEARNABLE
ABILITY_NOT_AVAILABLE
MEGA_ITEM_MISMATCH
```

### 15.3 Warnings

Warnings do not block PDF generation, but must be visible before download.

Required MVP warning codes:

```txt
STAT_ALIGNMENT_REQUIRES_REVIEW
NEUTRAL_NATURE_NORMALIZED
LOW_CONFIDENCE_STAT_ALIGNMENT_SUGGESTION
UNKNOWN_SHOWDOWN_FIELD_IGNORED
LESS_THAN_SIX_POKEMON
MORE_THAN_SIX_POKEMON_TRUNCATED
AMBIGUOUS_ALIAS_RESOLVED
```

### 15.4 Rules to Validate

- Player name is present.
- Each Pokémon has species/form.
- Each Pokémon has ability.
- Each Pokémon has held item if required by the selected PDF/team-sheet format.
- Each Pokémon has at least one move; ideally four moves if required by format.
- Each Pokémon has Stat Alignment.
- No duplicate held items, unless the item is explicitly exempt in rules data.
- No duplicate species by National Dex number.
- Species/form is legal in Regulation M-B.
- Ability is legal and available to selected species/form.
- Held item is legal in Regulation M-B.
- Moves are legal and learnable by selected species/form.
- Mega Evolution item and species pairing is valid when relevant.

---

## 16. PDF Generation Requirements

### 16.1 Strategy

Use `pdf-lib` to generate a PDF client-side.

Preferred strategy:

1. Load a team-list PDF template from `public/templates/`.
2. If the PDF has form fields, fill fields by field name.
3. If no usable form fields exist, draw text at fixed coordinates.
4. Generate a downloadable PDF blob.

### 16.2 PDF Renderer Contract

React should call one function:

```ts
export async function generateTeamSheetPdf(teamSheet: TeamSheet): Promise<Blob>;
```

The PDF module must not read directly from React state or localStorage.

### 16.3 PDF Output Requirements

The generated PDF must include:

- Player name.
- Event/player metadata where supported by template.
- Six Pokémon slots.
- Species/form names.
- Abilities.
- Held items.
- All moves.
- Stat Alignment.

### 16.4 PDF Acceptance Criteria

- A hardcoded valid team generates a downloadable PDF.
- A manually entered valid team generates a downloadable PDF.
- An imported and corrected Showdown team generates a downloadable PDF.
- The generated PDF opens in common PDF viewers.
- Text does not overflow the expected team-sheet cells for common long names.
- Missing required fields block PDF generation.

---

## 17. UI/UX Requirements

### 17.1 Layout

Mobile-first layout:

```txt
Header
Import Showdown Paste panel
Player Info section
Pokémon Slot 1
Pokémon Slot 2
Pokémon Slot 3
Pokémon Slot 4
Pokémon Slot 5
Pokémon Slot 6
Validation Panel
Generate PDF button
Clear Team button
```

Desktop may use a wider layout, but mobile usability is more important.

### 17.2 Form Behavior

- Each Pokémon slot should be collapsible after MVP if easy, but not required.
- Autocomplete fields should support keyboard and touch input.
- Manual text that does not resolve to a known ID should be marked invalid.
- Imported values should be editable.
- Import warnings should remain visible until the user edits or dismisses them.
- Validation should update after every meaningful edit.

### 17.3 Autocomplete Behavior

Species autocomplete:

- Search legal Regulation M-B species/forms.
- Match aliases and Showdown names.

Ability autocomplete:

- If species is selected, prefer abilities available to that species/form.
- If species is not selected, allow global search but warn that ability cannot yet be validated.

Move autocomplete:

- If species is selected, prefer moves learnable by that species/form.
- If species is not selected, allow global search but warn that move cannot yet be validated.

Item autocomplete:

- Search legal Regulation M-B items.
- Warn on duplicate item.

Stat Alignment autocomplete/dropdown:

- Prefer dropdown/select because the option set is small.
- Allow autocomplete only if it improves mobile speed.

---

## 18. Accessibility Requirements

- All form fields must have labels.
- Error/warning text must be readable without relying only on color.
- Buttons must have clear text labels.
- The app must be usable on mobile browsers.
- Autocomplete should remain usable with keyboard navigation where practical.
- Text contrast must be sufficient in default theme.

---

## 19. Local Persistence

MVP may save current form state to `localStorage` to prevent accidental loss, but this is optional.

If implemented:

- Save only the current team state.
- Provide a clear/reset button.
- Do not require accounts.
- Do not sync externally.

---

## 20. Testing Requirements

### 20.1 Parser Tests

Create tests for:

- Standard Showdown paste with six Pokémon.
- Nicknamed Pokémon.
- Pokémon with form aliases.
- Pokémon with item.
- Pokémon without item.
- Pokémon with nature.
- Pokémon without nature.
- Neutral nature normalization.
- More than six Pokémon.
- Less than six Pokémon.
- Unknown species/item/ability/move.

### 20.2 Validation Tests

Create tests for:

- Valid team.
- Missing required fields.
- Duplicate species.
- Duplicate item.
- Illegal species.
- Illegal move.
- Move not learnable by selected Pokémon.
- Ability not available to selected Pokémon.
- Missing Stat Alignment.
- Stat Alignment requiring review.
- Mega item mismatch.

### 20.3 PDF Tests

At minimum:

- `generateTeamSheetPdf(validTeam)` returns a non-empty Blob.
- Generated PDF can be saved/downloaded.
- Function does not throw for long common Pokémon/move/item names.

Manual validation required:

- Open generated PDF and visually compare it against the expected team-sheet format.

---

## 21. Implementation Order

Follow this order. Do not start with the full complete Regulation M-B dataset.

```txt
1. Create Vite + React + TypeScript project.
2. Add minimal sample data for 3 Pokémon, 10 moves, 5 abilities, 5 items, and Stat Alignments.
3. Define canonical TeamSheet types.
4. Build PDF generator from a hardcoded TeamSheet object.
5. Add downloadable PDF button.
6. Build manual Player Info form.
7. Build one Pokémon slot form.
8. Expand to six Pokémon slots.
9. Add validation engine.
10. Wire validation to the UI.
11. Add Showdown paste parser.
12. Import Showdown paste into editable TeamSheet state.
13. Add Stat Alignment parse/infer/review behavior.
14. Add autocomplete against local data.
15. Replace sample data with Regulation M-B data.
16. Add parser and validation tests.
17. Polish mobile layout.
18. Deploy to GitHub Pages.
```

### Critical First Milestone

The first real milestone is:

```txt
Hardcoded valid TeamSheet object → generated PDF download
```

Do not spend significant time perfecting the data dictionary before this works.

---

## 22. Acceptance Criteria

### 22.1 MVP Acceptance Criteria

- User can open app locally.
- User can enter player info.
- User can manually fill six Pokémon.
- User can paste a Showdown team.
- Showdown paste fills the editable form where possible.
- Stat Alignment is parsed from Showdown nature where possible.
- Missing Stat Alignment requires manual entry.
- User can manually correct imported values.
- Validation catches missing required fields.
- Validation catches duplicate species and duplicate held items.
- Validation catches obviously illegal Regulation M-B data when represented in dictionary/rules files.
- User can generate and download a PDF.
- App can be deployed to GitHub Pages.

### 22.2 Non-Acceptance Conditions

The MVP is not acceptable if:

- PDF generation requires a backend.
- Showdown import directly mutates PDF output without editable review.
- Low-confidence Stat Alignment guesses silently populate final PDF fields.
- Validation logic is embedded in React components.
- The app requires accounts or external APIs.
- The app cannot run from a static host.

---

## 23. Known Risks and Blind Spots

### 23.1 PDF Layout Risk

The official/team-list PDF may not have fillable form fields, requiring coordinate-based text drawing. This is the highest implementation risk.

Mitigation:

- Test PDF generation before building the full UI.
- Store coordinates in a dedicated `pdfCoordinates.ts` file.

### 23.2 Data Accuracy Risk

Regulation M-B legality data, forms, learnsets, ability availability, and Mega Evolution legality may be incomplete or inconsistent across sources.

Mitigation:

- Keep data isolated in JSON.
- Add source notes to data files.
- Start with a small test dictionary.
- Add full data only after app flow works.

### 23.3 Showdown Name Normalization Risk

Showdown names, official names, aliases, forms, and PDF display names may differ.

Mitigation:

- Maintain explicit aliases.
- Normalize to internal IDs.
- Never rely on display names as unique keys.

### 23.4 Stat Alignment Risk

Nature-to-Stat-Alignment mapping may not always be directly available from pasted data.

Mitigation:

- Parse explicit natures confidently.
- Suggest from EVs only when useful.
- Require manual review for inferred values.

### 23.5 Scope Creep Risk

This project can easily drift into a full VGC database, team analyzer, or tournament management system.

Mitigation:

- Keep MVP focused on: paste/manual entry → validation → PDF.
- Defer all team analysis and cloud features.

---

## 24. Source Notes to Verify Before Final Production Use

Before using this app for real event submission, verify against the current official Play! Pokémon documents and team-list PDF.

Known public reference points as of 2026-07-06:

- The official VGC Tournament Handbook is published through Pokémon official rules/document resources.
- Victory Road summarizes Pokémon Champions VGC rules, including the distinction between battle rules, team rules, and regulation sets.
- Victory Road lists Regulation Set M-B as running from 17 June to 2 September 2026 and states that open team lists include species/forms, abilities, held items, moves, and Stat Alignment.

Use these only as implementation guidance; official tournament use should be checked against the latest official Play! Pokémon documents.

---

## 25. Codex CLI Implementation Prompt

Use this prompt with Codex CLI after placing this PRD in the repository:

```txt
You are implementing the MVP described in `Team_Sheet_Builder_PRD.md` for Team Sheet Builder.

Build a Vite + React + TypeScript static SPA that can run on GitHub Pages. Follow the architecture in the PRD. Do not add a backend, auth, database, external API dependency, or cloud storage.

Implementation priority:
1. Create the canonical TeamSheet types.
2. Add a tiny sample Regulation M-B dictionary.
3. Generate a PDF from a hardcoded TeamSheet object using pdf-lib.
4. Build the manual form.
5. Add validation.
6. Add Showdown paste import.
7. Add Stat Alignment parse/infer/review metadata.
8. Add autocomplete.
9. Add tests.

Keep validation, import parsing, normalization, and PDF rendering separate from React components.

Stop after the smallest working end-to-end MVP is complete. Do not expand into accounts, cloud sync, rental code lookup, data scraping, team analysis, or multi-regulation support.
```
