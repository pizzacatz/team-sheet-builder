# Technical Vocabulary — this project, three ways

The same story told three times: (1) in full industry jargon, (2) in plain
language with the matching technical term after each phrase, (3) as a
glossary table anchoring every term to the moment it appeared in this
project. Read 1 to test yourself, 2 to decode it, 3 to make it stick.

---

## 1. The jargon-dense version

### What the system is

Team Sheet Builder is a **static, client-side** React application — a
**single-page app (SPA)** with no backend, accounts, or database — that
generates official Pokémon VGC tournament paperwork entirely in the browser.
It is built with **Vite** and **TypeScript**, **type-checked** by `tsc -b`
before every build, and deployed as a **GitHub Pages** static site via a
**CI/CD workflow** (`.github/workflows/pages.yml`) that runs on every push to
`main`: install, test, build, then upload `dist/` as the deployed artifact.

The domain is governed by an external **rules engine** — a separate
"Champions Logic" project — whose SQLite database is the **source of truth**.
A **build-time ETL script** (`scripts/export_champions_data.py`) queries that
database and emits compact **JSON dictionaries** under
`src/data/regulation-mb/` (species, moves, abilities, items, stat
alignments). The app never calls a live API for this data; it **bundles** a
frozen **snapshot**, so correctness depends on periodically re-running the
export and committing the regenerated files.

### Data modeling and normalization

Each domain record (`SpeciesRecord`, `MoveRecord`, `AbilityRecord`,
`ItemRecord`, `StatAlignmentRecord` in `src/domain/dataTypes.ts`) carries a
stable **slug id**, a `displayName`, and an `aliases`/`showdownAliases`
array. The species list is also **augmented at module load**
(`src/domain/regulationData.ts`): each species' Mega form names (from its
`allowedMegaForms`, e.g. `Venusaur-Mega`, `Mega Charizard X`) are appended as
aliases of the base species, so a typed or imported mega name resolves to the
non-mega record — megas are not separate species in Champions. A **normalization** function (`normalizeName` in
`src/domain/normalization.ts`) folds Unicode **diacritics** via
`.normalize("NFKD")` and strips non-alphanumerics, so lookups are
**case-insensitive** and **accent-insensitive**. An **inverted index** (`Map<
normalizedAlias, record[] >`, built once at module load by `buildIndex`) lets
`resolveSpecies`/`resolveMove`/etc. do O(1) alias lookup instead of scanning
every record per keystroke; a lookup that maps to more than one record is
flagged `ambiguous` and resolves to the first match.

**Autocomplete** (`src/domain/autocomplete.ts`, `AutocompleteField.tsx`) is
deliberately **deterministic prefix matching**, not **fuzzy search** or
relevance scoring — results are bucketed into ordered **match tiers**
(label-prefix, later-word-prefix, alias-prefix, later-alias-word-prefix) and
sorted alphabetically within each tier, so the same query always produces the
same order.

### Domain rules and validation

`src/domain/legality.ts` and `src/domain/validation.ts` implement the
regulation's **business rules** as a pure, synchronous **validation pass**
(`validateTeamSheet`) that walks the whole `TeamSheet` and returns a flat
list of `ValidationIssue`s tagged `error` or `warning`, each carrying a
**field path** (e.g. `pokemon.2.stats.spe`) so the UI can scroll to and focus
the offending control. Checks include **Species Clause** (no duplicate
national-dex numbers, keyed by `nationalDexNumber` not by form) and **Item
Clause** (no duplicate held items, gated per-item by an
`itemClauseEligible` flag), plus per-Pokémon ability/move/item **legality**
against the bundled dictionaries and species-specific **availability**
(`isAbilityAvailable`, `isMoveLearnable` check membership in the species'
own `abilities`/`moves` arrays — i.e., real **learnsets**, not a global
legal-move list).

Stats use a **reverse-engineering** validator: rather than storing a
Stat-Point spread directly, the form stores the *final displayed stat*, and
`impliedStatPoints`/`achievableStatValues` (`src/domain/stats.ts`) invert the
game's own formula — `floor((presented + points) * alignmentMultiplier)`,
0–32 points per stat, ≤66 total — to find which spread (if any) could
produce that value, flagging **unreachable** values, over-budget totals, and
a same-value/neutral-alignment combo that's probably an unedited field.

### The Showdown import pipeline

`src/importers/showdown/parseShowdownPaste.ts` is a hand-written **line-based
parser** (not a full grammar/AST) for the community-standard Pokémon
Showdown **export/paste format**: it splits on blank lines into per-Pokémon
**blocks**, then pattern-matches each line (`Ability:`, `- movename`,
`Adamant Nature`, `EVs: 4 HP / 252 Atk`) against **regex** rules, accumulating
a parallel `ImportIssue[]` list (`UNKNOWN_SPECIES`, `AMBIGUOUS_ALIAS_RESOLVED`,
etc.) rather than throwing — a **permissive/best-effort parse** that always
returns a partial result plus diagnostics instead of failing the whole
import. A key domain **translation layer**: Showdown's numeric `EVs:`
(0–252 per stat, out of 508 total) has no meaning in this app's ruleset, so
the parser reinterprets that same field as Champions' **Stat Points**
(0–32/stat, 66 total) and Showdown's four retired **neutral natures**
(Hardy/Docile/Bashful/Quirky) are silently remapped to `Serious`, flagged
`requiresReview` for a human sanity check.

### PDF generation and the embedded data carriers

PDF generation (`src/pdf/generateTeamSheetPdf.ts`) uses `pdf-lib` to
**overlay text onto a fixed template** (`public/templates/pokemon-vg-team-list.pdf`)
at hardcoded **coordinate tables** (`src/pdf/pdfCoordinates.ts`) rather than
flowing a layout — every field's `(x, y)` and max width is measured against
the official form once and hardcoded. The PDF module is **lazy-loaded**
(`await import(...)`) only when a user actually downloads/shares, keeping the
initial **bundle** smaller. The two output pages, a private **Staff sheet**
(with stats) and a public **Open sheet** (no private fields), are generated
from the same `drawSlot`/`drawPlayerInfo` calls with an `includePrivateFields`
**capability flag** controlling which fields render.

The Staff sheet carries the team a second time as **machine-readable,
PII-free** data, through two independent **carriers** decoded by one shared
function (`decodeTeamDataFromScan`):

- A **digital carrier** (`TSBv1`): plain text drawn with `opacity: 0` —
  invisible on screen/print but extractable via `pdftotext`/pdf.js — using
  **self-describing slug ids**, split into fixed-length **segments** each
  tagged with an index/count so `pdftotext`'s line reordering can be undone.
- A **paper carrier** (`TSBI1`): a **QR code** rendered via the `qrcode`
  library into the one open corner of the template. Because QR **capacity**
  is the binding constraint at that physical size, this carrier swaps slugs
  for 2-character **base36**-encoded numbers from an **append-only lookup
  registry** (`src/data/regulation-mb/code-index.json`, built by
  `scripts/build_code_index.mjs`) — an *id → permanent number* mapping where
  numbers are assigned once and never reordered or reused, so a QR **printed
  under an older registry version still decodes correctly** against a newer
  one (**forward/backward compatibility** via a `version` **stamp**, a
  truncated SHA-256 hash of the full mapping, embedded in every QR for
  **drift detection**).

### Sharing and persistence

`src/domain/teamShare.ts` implements **shareable links**: the whole team
(and optionally player info) is JSON-**serialized**, compressed with the
browser's native `CompressionStream("deflate-raw")`, and **base64url**-encoded
into the URL's `#` **fragment** — never uploaded anywhere, so the link itself
*is* the storage. Decoding runs the inverse pipeline and is wrapped in a
`try/catch` that treats any malformed input as "no link" rather than
crashing. Day-to-day, the in-progress form **auto-persists** to
`localStorage` on every change (`useTeamSheetState.ts`) as a lightweight
**crash/reload recovery** mechanism, distinct from the deliberate,
explicit share/QR encodings.

### Testing and CI

The project uses `vitest` with a `jsdom` **environment** for DOM-dependent
**unit** and **component tests** (`*.test.ts(x)` files sit next to the code
they test) covering the validator, the Showdown parser, the code-index
round-trip, and PDF coordinate math. `npm run build` runs `tsc -b`
(**type-checking** as a build gate, catching type errors even though Vite
itself would transpile invalid TypeScript) before bundling. Both `npm test`
and `npm run build` run in the GitHub Actions **pipeline** on every push,
and are the two commands the README asks contributors to run manually before
any push.

---

## 2. The plain-language version

This app builds official Pokémon tournament paperwork — a two-page PDF —
completely inside your web browser. There's no server it talks to while
you're using it (**static, client-side app**): everything happens on your
device, and the finished site is just files hosted on GitHub's free static
hosting (**GitHub Pages**), automatically rebuilt and republished every time
new code is pushed (**CI/CD pipeline**). It's written in a stricter,
self-checking version of JavaScript (**TypeScript**) using a fast dev/build
tool (**Vite**).

The rules of what Pokémon/moves/items are actually allowed come from a
separate project that tracks the tournament ruleset. Rather than asking that
project live every time, a one-off script reads its database and writes out
plain data files (**a build-time export**) that get bundled straight into
the app — so the app always ships with its own frozen copy of the rulebook
data (**a snapshot**), and that copy has to be manually refreshed and
re-committed when the rules or Pokédex change.

Every Pokémon, move, ability, and item is stored as a short, stable
computer-friendly name (an **id**, like `charizard`), plus a human-friendly
display name and a list of alternate spellings it should also match (an
**alias list**). Mega names like "Venusaur-Mega" are added to the regular
Pokémon's alternate-spelling list when the app starts, so typing or pasting a
mega lands on the normal, non-mega Pokémon (megas aren't their own entries in
this ruleset). Typed text gets stripped down to bare lowercase letters and
numbers before comparing (**normalizing**), which is also how accented
letters get matched to their plain equivalents. To make typing fast, the app
pre-builds a lookup table from every possible spelling to its Pokémon/move/etc.
once, up front (**an index**) instead of re-scanning the whole list on every
keystroke.

When you type in a search box, the suggestions aren't "smartly" guessed
(**fuzzy matching**) — they follow a fixed, predictable set of rules: exact
name matches first, then a later word in the name, then alternate spellings,
each group sorted alphabetically. Same input always gives the same order.

The rulebook logic itself — is this ability legal, are two Pokémon
duplicating the same species, does this item conflict with another — lives
in one function that checks the whole form at once and returns a flat list
of problems, each one tagged with exactly which field it's about (**field
path**), so clicking an error can jump straight to the broken box. Species
Clause (no two Pokémon from the same Pokédex entry) and Item Clause (no two
Pokémon holding the same item) are both implemented this way, and each
Pokémon's ability/moves are checked against records for its specific
species, not just "is this a real ability" — meaning the app actually
enforces which moves each species can really learn (its **learnset**).

Stats work backwards from how you'd expect: instead of typing "I put 20
points into Speed," you type the *final* stat number you see in-game, and
the app works out whether *any* legal point spread could produce that exact
number — flagging it if it's impossible, or if your total investment goes
over the cap, or if you seem to have forgotten to enter a spread at all.

If you paste a team from Pokémon Showdown (a popular team-building website
with its own text format), a parser reads it block by block, line by line,
using pattern matching rather than a strict grammar, and — instead of
rejecting anything it doesn't recognize — just skips unknown lines and keeps
a running list of warnings, so you always get *something* back plus a
report of what it couldn't understand. Along the way it translates
Showdown's own point system (out of 508, standard for the mainline games)
into this tournament's very different one (out of 66), and quietly fixes up
four retired "neutral" nature names that Showdown still allows but this
game doesn't, flagging them for you to double check.

To make the PDF, the app doesn't lay out a page from scratch — it opens a
pre-made official PDF template and draws each field's text at exact pixel
coordinates that were measured once by hand and hardcoded. That PDF-drawing
code is only downloaded into your browser the moment you actually click
Download/Share (**lazy loading**), so people who never generate a PDF don't
pay that download cost. Two versions come out of the same drawing code: a
private "Staff" sheet (with your stats visible) and a public "Open" sheet
(without them), controlled by a simple on/off flag passed into the drawing
functions.

The Staff sheet secretly carries a second, computer-readable copy of the
whole team, hidden two different ways: as literally invisible text (zero
opacity — there but unseen, and printers/screen-readers/text-extraction
tools still see it) using the same readable ids as everywhere else, and as a
tiny QR code squeezed into the one blank corner of the template. Because a
QR code that small can't fit the friendly names, that version swaps every id
for a short 2-character number, looked up in a permanent numbering table
that the project maintains by hand-off-limits rule: numbers are only ever
added, never changed or reused, so a QR code printed today will still scan
correctly even after the rulebook data is updated next year (**forward
compatibility**) — and every QR carries a short fingerprint of exactly which
version of that numbering table made it, so a decoder can tell if it's
looking at an outdated table.

Sharing a team as a link works by squashing the whole team into JSON text,
shrinking it with the browser's built-in compression, and stuffing the
result into the part of the URL after the `#` — which browsers never send to
a server, so the entire "database" for that link is the link itself; nothing
is uploaded anywhere. Separately, whatever you're currently working on
autosaves to the browser's local storage on every change, purely so a
refresh or crash doesn't lose your in-progress form — a completely different
mechanism from the deliberate share links and QR codes.

Tests run in a fake-browser environment (**jsdom**) so DOM-dependent code
can be tested without a real browser, and live right next to the code they
cover. Before every production build, the TypeScript compiler is run purely
as a type-checking gate — it would otherwise be skipped, since the bundler
doesn't actually need type-correct code to produce output. Both the tests
and the build run automatically in the cloud on every push, and the README
asks contributors to run the same two commands by hand before pushing
anything meaningful.

---

## 3. Glossary — term → meaning → where it happened here

### Architecture & build

| Term | Plain meaning | In this project |
|---|---|---|
| **static, client-side app** | runs entirely in the browser, no backend/database | the whole app; README: "no backend, accounts, database, or external runtime API" |
| **SPA (single-page app)** | one HTML page whose content is swapped by JS | React root mounted in `src/app/main.tsx` into `index.html` |
| **bundler / build tool** | compiles and packages source into deployable files | Vite (`vite.config.ts`), `npm run build` |
| **type-checking as a build gate** | fail the build on type errors, not just at edit time | `"build": "tsc -b && vite build"` |
| **CI/CD pipeline** | automated test/build/deploy on code changes | `.github/workflows/pages.yml`: install → `npm test` → build → deploy |
| **lazy loading** | deferring a module's download until it's actually needed | `await import("../pdf/generateTeamSheetPdf")` and `await import("qrcode")`, only on Download/Share |
| **ETL script (extract/transform/load)** | pulls data from one system, reshapes it, writes it for another | `scripts/export_champions_data.py` reads the Champions Logic SQLite DB, writes `src/data/regulation-mb/*.json` |
| **snapshot / bundled data** | a frozen copy shipped with the app, not fetched live | the regulation JSON dictionaries; refreshed only by re-running `npm run data:export` |
| **unit test / component test** | an automated check of one function or component in isolation | `vitest` files like `stats.test.ts`, `AutocompleteField.test.tsx` |
| **test environment (jsdom)** | a fake DOM so browser-shaped code can run under Node | `vitest.config.ts`: `environment: "jsdom"` |

### Data modeling & lookup

| Term | Plain meaning | In this project |
|---|---|---|
| **slug id** | a short, stable, machine-friendly identifier | `species.id` like `"charizard"`, used as the join key everywhere |
| **normalization** | reducing text to a canonical comparable form | `normalizeName` in `src/domain/normalization.ts`: NFKD-fold accents, lowercase, strip non-alphanumerics |
| **inverted index** | a map from every searchable term back to its record(s) | `buildIndex` builds `Map<normalizedAlias, Record[]>` for species/moves/items/abilities/alignments |
| **alias** | an alternate name that should resolve to the same record | `aliases`/`showdownAliases` arrays on every data record; mega form names ("Venusaur-Mega") are appended to their base species' aliases at load, so megas resolve to the non-mega species |
| **ambiguous match** | a lookup whose normalized key maps to more than one record | `Resolution.ambiguous`, surfaced as `AMBIGUOUS_ALIAS_RESOLVED` on import |
| **deterministic prefix matching** | consistent, rule-based text matching, not relevance scoring | `searchOptions` in `src/domain/autocomplete.ts`; explicitly not fuzzy search |
| **match tier** | a priority bucket results are grouped into before sorting | label-prefix → later-word-prefix → alias-prefix → later-alias-word-prefix in `optionMatchTier` |
| **append-only registry** | a lookup table that may only ever gain entries, never mutate existing ones | `src/data/regulation-mb/code-index.json`, contract documented in `docs/CODE_INDEX.md` |
| **tombstone** | a retired entry kept in place (not deleted) to preserve numbering | a removed Pokémon/move's row stays in `code-index.json` forever |

### Domain rules & validation

| Term | Plain meaning | In this project |
|---|---|---|
| **validation pass** | a full sweep producing a list of problems, not a single true/false | `validateTeamSheet` in `src/domain/validation.ts` |
| **field path** | a string address of exactly which input an issue belongs to | `ValidationIssue.path`, e.g. `pokemon.2.stats.spe`, used to scroll/focus |
| **Species Clause** | rule: no two team members share a species | keyed on `nationalDexNumber` in `validateTeamSheet`, so different forms of one dex number still clash |
| **Item Clause** | rule: no two team members hold the same item | gated by `itemClauseEligible` per item, tracked via `itemBySlot` map |
| **learnset** | the specific set of moves a species can actually learn | `isMoveLearnable` checks `species.moves.includes(moveId)`, not a global move list |
| **legality / availability** | whether a choice is allowed at all vs. allowed *for this species* | `getMoveRecord` (exists in ruleset) vs. `isMoveLearnable` (this species can use it) |
| **reverse-engineering (validation)** | inferring hidden inputs (a stat spread) from an observed output (final stat) | `impliedStatPoints`/`achievableStatValues` in `src/domain/stats.ts` |
| **Stat Points** | this ruleset's investment currency (0–32/stat, 66 total) | replaces Showdown's 252/508 EV system; `STAT_POINT_MAX`, `STAT_POINT_TOTAL_MAX` |
| **Stat Alignment** | this ruleset's nature-like +10%/-10% stat multiplier | `alignmentMultiplier` in `src/domain/stats.ts` |

### Import pipeline

| Term | Plain meaning | In this project |
|---|---|---|
| **line-based / pattern-matching parser** | reads text line by line against regex rules, not a formal grammar | `parseShowdownPaste.ts`, matching `Ability:`, `- Move`, `X Nature`, etc. |
| **permissive / best-effort parse** | keep going on unrecognized input instead of failing outright | unmatched lines become `UNKNOWN_SHOWDOWN_FIELD_IGNORED` warnings, not thrown errors |
| **block** | one Pokémon's worth of pasted text, separated by blank lines | `paste.split(/\n\s*\n/g)` in `parseShowdownPaste` |
| **translation layer** | reinterpreting one system's field as a different system's concept | Showdown `EVs:` (0–252/508) is read as Champions Stat Points (0–32/66) |
| **domain migration handling** | accounting for a value that used to mean something different | the four retired neutral natures (Hardy/Docile/Bashful/Quirky) normalized to `Serious`, flagged `requiresReview` |

### PDF generation & data carriers

| Term | Plain meaning | In this project |
|---|---|---|
| **template overlay** | drawing onto a fixed pre-made document instead of building a layout | `pdf-lib` draws onto `public/templates/pokemon-vg-team-list.pdf` |
| **coordinate table** | hand-measured `(x, y)` positions for each field on the template | `src/pdf/pdfCoordinates.ts` |
| **capability flag** | a boolean that toggles which fields a shared function renders | `includePrivateFields` param on `drawPlayerInfo` (Staff vs. Open sheet) |
| **carrier (data encoding)** | one independent channel embedding the same underlying data | the digital (`TSBv1`) and paper/QR (`TSBI1`) team-data carriers |
| **self-describing encoding** | decodable with no external lookup table | the `TSBv1` slug-id carrier — needs no registry to read |
| **compact/dense encoding** | trading readability for smaller size under a hard capacity limit | `TSBI1`'s 2-char base36 code-index numbers, sized for the QR's tiny corner |
| **segmentation** | splitting one logical payload into multiple bounded chunks | `encodeTeamDataLines` splits the payload into `SEGMENT_CHARS`-wide, index-tagged lines |
| **version stamp / drift detection** | a fingerprint that lets a decoder notice it's out of date | `CODE_INDEX_VERSION` (SHA-256 prefix of the registry), embedded in every QR |
| **forward/backward compatibility** | old data still works with new code, and vice versa | append-only numbering means an old QR always decodes under a newer registry |
| **QR code / capacity limit** | a 2D barcode with a hard ceiling on how much data it can hold at a given physical size | `STAFF_QR` sizing in `generateTeamSheetPdf.ts`; the whole reason `TSBI1` compresses ids to numbers |

### Sharing & persistence

| Term | Plain meaning | In this project |
|---|---|---|
| **serialization** | converting in-memory data into a storable/transmittable string | `JSON.stringify(payload)` in `encodeTeamShare` |
| **compression stream** | the browser's built-in streaming compressor/decompressor | `CompressionStream("deflate-raw")` / `DecompressionStream("deflate-raw")` in `teamShare.ts` |
| **base64url encoding** | base64 text safe for use inside a URL | `toBase64Url`/`fromBase64Url` in `teamShare.ts` |
| **URL fragment (`#...`)** | the part of a URL after `#`, never sent to a server | the whole team link is stored in `#t=<encoded>`, so nothing is uploaded |
| **fail-soft decoding** | treating malformed input as "absent" instead of throwing | `decodeTeamShare`'s `try/catch` returns `null` on any parse failure |
| **client-side persistence (localStorage)** | saving state in the browser between visits | `saveTeamSheet`/`loadTeamSheet` in `src/state/localStorage.ts`, autosaved on every change |
