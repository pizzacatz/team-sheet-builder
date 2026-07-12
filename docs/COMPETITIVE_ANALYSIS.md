# Competitive Analysis — teamsheet.gg

Rival to Team Sheet Builder. Assessed 2026-07-12 from the live site (rendered in a
headless browser; marketing copy 403'd bots). Inferences about the generator
having "no validation/autocomplete" are from static renders — not confirmed by
interacting with the form.

## What it actually is

**teamsheet.gg**, by **Freezai Media** (Freezai — a top VGC creator/pro), is
primarily a **team-report content & community platform**, not just a generator.
Its hero pitch is *"Tell Your Story — turn a pokepaste into a beautiful team
report."* Core surfaces:

- **Team reports** — paste a pokepaste URL → a shareable, article-style report
  with a hero image, writeup, the 6-mon team, format tag, and social stats
  (likes/hearts, comments, views). Freezai's own report had 6,330 views.
- **All teams** — a browsable database (**~90 reports** at assessment), filterable
  by **format, archetype, and "has Pokémon,"** sortable by Latest / Most views.
- **Players** — player profiles.
- **Multi-format** — covers *all* competitive Pokémon: every VGC regulation
  (Reg I / F / H / M-B) **and** Smogon singles (Gen 9 OU, National Dex Ubers, …).
- **Accounts**, **anonymous posting** (low friction), Admin, Devlog, Feedback.
- Powered by **pokepast.es** (team import) + **Pokémon Showdown** (battle data).

The **Generator** (`/generator`) is a secondary utility: Showdown-paste → the
"unmodified official Play! Pokémon team list PDF." It targets the same regulation
we do (the paste example uses `32 Atk / 32 Spe` Champions Stat Points).

## SWOT — the rival

### Strengths
- **Content platform + community** — browsable, social team reports with real
  engagement (thousands of views). Content network effects, SEO (indexable
  reports), and stickiness we don't have.
- **Brand & reach** — Freezai's audience is a massive distribution advantage.
- **Multi-format breadth** — all VGC regs + Smogon singles, vs our M-B-only focus.
- **Low-friction sharing** — pokepaste-in, anonymous posting, rich writeups.
- **Established & active** — Devlog/Feedback, growing report count.

### Weaknesses
- **Generator appears to be a "dumb" passthrough** — no visible legality/validation
  and no autocomplete (plain text inputs). Nothing stops an illegal/malformed sheet.
- **Broken mobile generator** — Player Info, the stat row, and DOB overflow/clip
  horizontally on a phone; no responsive reflow.
- **Backend + accounts** — a PII-heavy document (incl. minors' DOB) touches servers.
- Generator is under-invested relative to the surrounding platform.

### Opportunities (for them)
- Add validation/autocomplete or fix mobile — either erases our generator edge.
- Ride the brand + content flywheel to own distribution.

### Threats (to them)
- A markedly better *tool* (us) for actually producing a correct sheet.
- A **TO-analytics** product (our cruncher) — a segment their player-authored
  reports don't serve.
- Regulation-data upkeep; an official Pokémon tool appearing.

## SWOT — Team Sheet Builder (us)

### Strengths
- **Best-in-class generator**: deep legality validation (species/ability/item/move,
  learnsets, clauses, duplicates), **stat-range + Stat-Alignment + 66-point**
  correctness, and autocomplete filtered to legal options.
- **Mobile-first** (single-column flow, floating tray) — the generator actually
  works on a phone at a local.
- **Privacy / no backend** — fully client-side; PII never leaves the device.
- **TO analytics (unique)** — embedded machine-readable text + corner QR →
  bulk-PDF usage dashboards (the cruncher).
- **Fast, free, static, offline-capable**; regulation-accurate M-B data.

### Weaknesses
- **Single-purpose** — no community, content, browsing, or social; nothing to
  return for after generating a sheet.
- **No brand / audience / marketing** — no landing page, no distribution.
- **No sharing / accounts / cloud save** (localStorage only).
- **M-B-only** — narrow vs their multi-format breadth.
- Solo project; ongoing regulation-data maintenance burden.

### Opportunities
- **Own tournament organizers** via the cruncher (bulk extraction → dashboards) —
  unserved by them.
- **Lightweight, static sharing** — a URL-encoded team link (no backend) to blunt
  their "share your team" edge without giving up privacy.
- **A landing/hero page** + trust messaging ("unmodified official PDF; nothing
  uploaded; catches illegal teams").
- PWA/offline; possibly broaden formats later.

### Threats
- They add validation / fix mobile → our tool edge shrinks.
- Freezai's brand + content flywheel dominates distribution regardless of tool quality.
- Regulation changes / data drift; an official first-party tool.

## Feature comparison

| | Team Sheet Builder | teamsheet.gg |
| --- | --- | --- |
| Legality / stat validation | **Yes, deep** | Not visible |
| Autocomplete (legal options) | **Yes** | Not visible (free text) |
| Mobile | **Mobile-first** | Broken/overflowing |
| Privacy | **Client-side, no accounts** | Backend + accounts |
| Official PDF output | Yes | Yes |
| Machine-readable data / QR | **Yes** | No |
| TO usage analytics | **Yes (cruncher)** | No |
| Team sharing / reports | No (planned: URL share) | **Yes, rich** |
| Community / browse / social | No | **Yes** |
| Multi-format | No (M-B) | **Yes** |
| Brand / audience | No | **Yes (Freezai)** |

## Strategy to win

Don't out-platform Freezai — the content/community/brand fight is theirs. **Win as
the unambiguously better *tool*, and own the segment they ignore:**

1. **Lead with correctness + mobile + privacy**: "the team sheet that won't let you
   submit an illegal team — on any phone, nothing uploaded."
2. **Own tournament organizers** via the cruncher (bulk extraction → usage dashboards).
3. **Add lightweight, static sharing** (URL-encoded team link) + a **landing page**
   to blunt their sharing/marketing edge without a backend.
4. Keep the data ruthlessly accurate for the current regulation.
