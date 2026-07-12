# Ideas / Deferred Work

Parking lot for larger changes we've discussed but not committed to.

## UI consolidation — the output/share cluster has sprawled

The *features* are mostly invisible intelligence (validation, autocomplete, etc.),
but the visible **output/share buttons** have grown: Paste & Import, Team Sheets,
Preview, Open, Staff, Clear, "Share Team Sheets" (Web Share the PDF), "Copy team
link" (its own panel), plus a proposed "Mail to TO". There are **three separate
"share" concepts** as separate controls.

**Plan:** consolidate all sharing into **one "Share ▾" control** (menu: Copy team
link · Email to TO · Share PDF file). Drop the standalone Copy-team-link panel;
absorb "Share Team Sheets"; make any email option a menu item, not a new button.
Result: the output area reads as three intents — **Import · Download · Share**.
Do this consolidation *before* adding more buttons.

## Email team to TO (mailto) — fold into the Share menu

Feasible (unlike attaching the PDF): the team-share URL is text in the `mailto:`
**body**, not an attachment. The player enters the TO's email; the app opens a
pre-filled **draft** (it doesn't send — no backend). Body = readable player info
+ the team link. Deliverable is the **link + info** (the TO opens it and downloads
the PDF themselves) — decided sufficient. Caveats: mailto body is **plain text**
(no custom-text hyperlink; clients auto-linkify the raw long URL); `mailto:` needs
a configured mail app (webmail users may get nothing — keep Copy-link as the
fallback); ~2000-char body limit on some clients (keep the body lean). Build it as
a **menu item inside the consolidated Share**, not a standalone button.

## TO-only sister site — extend the cruncher

The sister site is basically the [team-sheet-cruncher](https://github.com/pizzacatz/team-sheet-cruncher)
spec, broadened. Pipeline: player builds team → "Mail to TO" (sends a `#t=` link)
→ TO drops the collected links into the TO site → it **batch-generates every
official PDF (one zip), flags illegal teams, and shows a usage dashboard**, instead
of the TO opening each link and downloading PDFs one by one. Extend the cruncher to
(a) decode `#t=` team links, not just PDFs, and (b) batch-generate PDFs.

Two build flavors (the whole decision):
- **Client-side, no backend (recommended, fits the ethos):** the TO gathers links
  (paste emails / the site regex-extracts every `#t=`), everything processes in the
  browser; PII stays on the TO's device. Friction: no place for players to submit
  *to* — the TO has to gather the links.
- **Backend submission platform:** players submit directly; short/pretty links fall
  out for free — but PII on a server, auth/hosting/moderation, closer to
  teamsheet.gg. Weigh against the PII cost (see the shortened-URL note).

## Three-column stat input (Default / +SP / Total) — deferred (mobile)

Replace the single "final stat" input with three columns per stat:

- **Default** (read-only) — the 0-SP baseline from the species, adjusted by the
  chosen alignment (×1.1 / ×0.9).
- **+SP** (the only input) — the Stat Point investment the player actually knows
  from their EV spread. Validated simply: ≤32 per stat, ≤66 total.
- **Total** (read-only, computed) — `floor((default + SP) × multiplier)`; this is
  what prints on the sheet.

### Why it's attractive
- Matches how players think (they know their SP investment, not the final number).
- Makes stats **correct-by-construction**: Total is computed, so it can never be
  out of range, inconsistent with the alignment, or over-budget. The whole
  reverse-engineering validation (STAT_ALIGNMENT_MISMATCH / STAT_OUT_OF_RANGE)
  collapses into two trivial SP checks.
- Educational for new players (shows default → +points → total) instead of
  hiding the math — resolves the auto-prefill confusion worry without prefilling.
- Showdown import maps EVs straight into the +SP column.

### Why it's deferred
- **Mobile: three number columns per stat (plus a label) is unusable on a phone**
  — the single stat column is already tight. This is the blocker.
- It's a real refactor: source of truth moves from final stats to Stat Points;
  touches the data model, slot UI, PDF (compute totals), the Showdown importer,
  and localStorage (migrate old teams by backing SP out of stored totals — reuse
  `impliedStatPoints`). It would also largely replace the current stat validation.

### If revisited
Prototype the **mobile** layout first. A likely compromise: show only **+SP** and
**Total** on mobile (Default as reference on desktop / tap-to-reveal), or fall
back to a single Total input with a small read-only "default: 155" hint.

Related: see the `no-stat-autoprefill` note — plain auto-prefill of totals was
declined; this columnar model is the better answer to that same time-save goal.
