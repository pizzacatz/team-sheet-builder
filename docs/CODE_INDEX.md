# Code-Index Registry (the QR "dictionary")

This document is the maintenance contract for `src/data/regulation-mb/code-index.json`,
the append-only dictionary that maps every Regulation M-B id to a permanent number.
Read it in full before touching that file or the script that builds it.

> **Scope note.** "Dictionary" here means the **code-index registry** — the
> `id → number` map used by the QR carrier. It is *not* the regulation data files
> (`species.json`, `moves.json`, etc.), which are regenerated wholesale from the
> Champions Logic database and are documented under
> [Data Export](../README.md#data-export). The registry is derived *from* those
> files but obeys a much stricter rule: it may only ever grow.

---

## 1. What it is and why it exists

The Staff Team Sheet embeds the team twice (see
[Embedded Team Data](../README.md#embedded-team-data)):

- The **digital** carrier (`TSBv1`, transparent text) uses self-describing slug
  ids like `aura-sphere`. It needs no dictionary to decode.
- The **paper** carrier (`TSBI1`, corner QR) has almost no room. To stay small
  enough to scan, it cannot afford slugs, so every id is replaced by a short
  **number** — and those numbers live here.

A number is meaningless on its own; it only means something *relative to this
registry*. That is the entire reason the registry must be stable: a QR printed
last month says move `25`, and `25` must still mean Aura Sphere forever.

The registry is just a way to give each slug a **shorter permanent name**. The
slug was already a permanent id; the number is a 2-character version of it.

---

## 2. File shape

```json
{
  "version": "A94F",
  "species":        { "venusaur": 1, "charizard": 2, ... },
  "forms":          { ... },
  "abilities":      { "overgrow": 1, ... },
  "items":          { "aspear-berry": 1, ... },
  "moves":          { "tackle": 1, "aura-sphere": 25, ... },
  "statAlignments": { "Hardy": 1, "Jolly": 9, ... }
}
```

- Six categories: `species`, `forms`, `abilities`, `items`, `moves`,
  `statAlignments`. Keys are the exact `id` values from the regulation data files.
- Numbers **start at 1**. `0` is reserved to mean "empty/none" in the QR payload,
  so it is never assigned to an id.
- `version` is a **derived** 4-character stamp (see §6). Never set it by hand.

Consumers:
- App (encoder + in-app decode): `src/pdf/codeIndex.ts`
- Offline decoder: `scripts/decode_team_data.mjs`
- Builder: `scripts/build_code_index.mjs`

---

## 3. The core contract

Three rules. Everything else follows from them.

1. **Assign once.** The first time an id appears, it gets the next unused number
   in its category.
2. **Never reassign.** Once an id has a number, that pairing is immutable for life.
3. **Never reuse.** If an id is removed from the regulation, its number is retired
   (left in place as a tombstone). It is never handed to a different id.

The file is **append-only**: it may gain rows forever, but existing rows are never
edited, reordered, or deleted.

---

## 4. How to maintain and append

You almost never touch this file by hand. It is rebuilt by a script that already
enforces the contract.

### Normal flow (with a data re-export)

```bash
npm run data:export      # regenerates the regulation JSON, then runs data:index
```

`data:export` chains `data:index` automatically, so the registry is refreshed in
lockstep with the data.

### Registry only (no data change)

```bash
npm run data:index       # = node scripts/build_code_index.mjs
```

### What the builder does

- Loads the existing `code-index.json` (if present) and **keeps every number**.
- Scans the current data files for ids. Any id **not** already in the registry is
  appended with the next unused number in its category.
- Recomputes the `version` stamp from the full mapping.
- Writes the file back.

Because it only ever appends, running it is safe and idempotent: with no new ids,
the only thing that can change is nothing.

### After running

1. Review the diff. It must be **additions only** — new keys with new numbers, plus
   possibly a changed `version`. See §7 for what a valid diff looks like.
2. Commit `code-index.json` **together with** the regenerated data files.
3. Run `npm test` and `npm run build`.

---

## 5. What happens to new and removed content

- **New Pokémon / move / ability / item / form:** gets the next number in its
  category, appended at the end. Existing numbers are untouched, so every
  previously printed QR still decodes. This is the normal, safe case.
- **Something becomes illegal / is removed from the data:** its id simply stops
  appearing in the data files. **Leave its row in the registry** as a tombstone —
  do not delete it. Old QRs that reference its number still resolve to the correct
  id, and the builder never reuses the number.
- **A slug changes upstream** (e.g. the export renames `foo` to `foo-bar`): the
  builder treats the new slug as a brand-new id and appends a new number; the old
  slug's row remains as a tombstone. This is why slugs must be stable — see the
  DON'T list.

---

## 6. The version stamp

`version` is the first 4 hex characters (uppercase) of a SHA-256 hash of the full
id→number mapping. It is computed by the builder — treat it as read-only output.

Its job is drift detection, not correctness of any single number:

- Every QR embeds the stamp of the registry that produced it.
- A decoder compares the QR's stamp to its own registry's `version`.
- **Old QR → newer decoder:** always correct (old numbers never moved).
- **Newer QR → older decoder:** may reference a number the old registry lacks. The
  decoder prints a warning (`sheet data-version X != local Y ...`) instead of
  silently showing wrong data. Fix by updating the decoder's data to current.

A version change on its own is normal and expected whenever ids are appended.

---

## 7. Guard rails — what a valid change looks like

**DO**

- ✅ Regenerate the registry with `npm run data:index` (or `npm run data:export`),
  never by editing JSON directly.
- ✅ Expect diffs that are **purely additive**: new keys appended, existing
  keys/numbers unchanged, `version` possibly updated.
- ✅ Keep tombstones: leave rows for ids that are no longer legal.
- ✅ Commit `code-index.json` in the same commit as the data files it was built from.
- ✅ Run `npm test` after regenerating — the round-trip tests in
  `src/pdf/teamDataCode.test.ts` will catch an encode/decode mismatch.
- ✅ If you must inspect it, treat the file as an audit log: read-only history.

**A safe diff looks like this** (additions only):

```diff
   "moves": {
     ...
-    "zen-headbutt": 499
+    "zen-headbutt": 499,
+    "bloodmoon": 501
   }
```

**An unsafe diff looks like this** (a number moved — reject it):

```diff
-    "aura-sphere": 25,
+    "aura-sphere": 26,
```

---

## 8. DON'T list

Every item here can silently corrupt already-printed QR codes. There is no
recovery once sheets are in the wild — the number is the only handle they carry.

- ❌ **Don't reorder** entries. Number ↔ id order is meaningless to the format but
  reordering tempts renumbering; keep it append-only.
- ❌ **Don't renumber** an existing id, ever — not to "tidy up gaps," not to sort.
- ❌ **Don't reuse** a retired number for a different id.
- ❌ **Don't delete** rows, even for removed/banned content. Tombstone instead.
- ❌ **Don't hand-edit** numbers or `version`. Use the builder.
- ❌ **Don't rename existing slug ids** in the data export. Slugs are stable keys;
  a rename orphans the old number and the old printed QRs that used it. If a rename
  is truly unavoidable, treat it as a format-version bump (§9), not an edit.
- ❌ **Don't let a category exceed its field width** (§9) without bumping the format.
- ❌ **Don't** commit the data files without the freshly rebuilt `code-index.json`,
  or vice versa — they must move together.

---

## 9. Capacity limits (field widths)

The QR payload is fixed-width. Each field has a hard ceiling; exceeding it breaks
the format, so these are guard rails, not soft targets. Widths live in
`src/pdf/teamDataCode.ts` (`IDX_ID`, `IDX_ALIGN`, `IDX_STAT`).

| Field | Width (base36) | Max value | Current size | Headroom |
| --- | --- | --- | --- | --- |
| species / forms / abilities / items / moves | 2 chars | **1295** | moves 500 (largest) | large |
| statAlignments | 1 char | **35** | 21 | fixed set (≤25 natures) |
| each stat value | 2 chars | 1295 | ≤ ~400 | large |

If any id category ever approaches **1295** total registered numbers (including
tombstones — the ceiling is on the *number*, not the live count), you cannot just
widen the field in place: existing QRs assume 2 chars. Instead:

1. Bump the QR format sentinel (`TSBI1` → `TSBI2`) in `teamDataCode.ts`.
2. Widen the field for the new format.
3. Teach the decoder to handle both `TSBI1` and `TSBI2`.

Old sheets keep decoding under `TSBI1`; new sheets use `TSBI2`.

---

## 10. Verifying integrity

- **Round-trip tests:** `npm test` exercises encode → decode against the current
  registry (`src/pdf/teamDataCode.test.ts`).
- **Spot-check a live sheet:** generate a Staff/Both PDF, then
  `node scripts/decode_team_data.mjs your-staff-sheet.pdf` (needs poppler's
  `pdftotext` for the digital text) or scan the corner QR and pipe the string:
  `echo 'TSBI1...' | node scripts/decode_team_data.mjs -`.
- **Confirm append-only after a rebuild:** `git diff src/data/regulation-mb/code-index.json`
  should show only added keys and possibly a changed `version`. Any modified or
  removed existing key is a red flag — do not commit it.

---

## 11. Relationship to the two carriers

| | Digital (`TSBv1`) | Paper QR (`TSBI1`) |
| --- | --- | --- |
| Encoding | slug ids | code-index numbers |
| Needs this registry? | No | Yes |
| Robust to registry drift? | N/A (self-describing) | Yes, via append-only + version stamp |

The digital carrier is deliberately kept on slugs so it is decodable with zero
external state. The registry exists solely to make the paper QR small. If you ever
need a fully self-describing fallback for a scanned code, the digital text on the
same sheet is the source of truth.
