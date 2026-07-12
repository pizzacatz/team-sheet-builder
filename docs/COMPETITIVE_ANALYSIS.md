# Competitive Analysis — teamsheet.gg

Rival to Team Sheet Builder. Assessed 2026-07-12 from the live site (rendered in a
headless browser; the marketing copy 403'd bots). Inferences about "no validation/
autocomplete" are from static renders — not confirmed by interacting with the form.

## What it is

**teamsheet.gg/generator** — "Official VGC Team List Generator," by **Freezai Media**
(Freezai, a top VGC creator/pro). The generator is one feature of a larger
**community platform**: public team database ("All teams"), player profiles,
team "reports/stories," user accounts, an Admin panel, Devlog, and Feedback.
Targets the **same regulation we do** (the paste example uses `32 Atk / 32 Spe`
Stat Points → Pokémon Champions Reg M-B). Data from pokepast.es + Pokémon Showdown.

The generator: a big Showdown-paste box + "Autofill from paste," Player Info
(incl. Date of Birth as **MM / DD / YYYY**, which we now match), six Pokémon cards
(name, ability, item, 4 moves, Nature, 6 manual stats), and Download onto the
"unmodified official Play! Pokémon team list PDF."

## SWOT (of the rival)

### Strengths
- **Brand & audience.** Freezai's name = instant reach and credibility. Not something we can out-code.
- **Platform, not just a tool.** Accounts, cloud-saved teams, browsable public team database, player profiles, team writeups → stickiness and network effects.
- **Official-PDF passthrough** with clear "unmodified official PDF" trust messaging.
- **Established product** — Devlog, Feedback, About; ongoing development.

### Weaknesses
- **Appears to be a "dumb" form → PDF passthrough** — no visible legality/validation and no autocomplete (plain text inputs). Nothing stops an illegal or malformed sheet.
- **Broken mobile.** The generator overflows horizontally on a phone (Player Info, stat row, and DOB are clipped); no responsive reflow. People fill sheets on phones at locals.
- **Backend + accounts** → a document full of PII (incl. minors' DOB) touches their servers.
- Generator is basic relative to the surrounding platform investment.

### Opportunities (for them)
- Add real validation/autocomplete; fix mobile — either would erase our edge.
- Leverage the brand + platform to dominate distribution.

### Threats (to them)
- A more **accurate, private, mobile-first** tool (us) that also serves **tournament organizers** (our cruncher) — a segment they don't address.
- Regulation-data maintenance burden (shared by both).

## Our advantages (our moat)

1. **Correctness/legality.** We validate species/ability/item/move legality, learnsets, species/item clauses, duplicates, **stat ranges, Stat-Alignment consistency, and the 66-point budget**. We stop illegal/rejected sheets; they (apparently) don't.
2. **Autocomplete filtered to legal options** vs their free-text fields — faster and fewer errors.
3. **Mobile-first** (single-column flow, floating tray) vs their broken mobile.
4. **Privacy / no backend** — fully client-side; PII never leaves the device.
5. **Machine-readable data + TO cruncher** — embedded transparent-text/QR payload → bulk-PDF usage dashboards for organizers. A niche they don't serve.

## What to adopt from them

- **Make Paste & Import the hero action** (they put the paste box at the very top).
- **"Fills the unmodified official Play! Pokémon PDF"** trust line.
- **A real landing/hero page** — they market; we don't.
- **Shareable team link** — counter their "share your team" *statically* via a URL-encoded, PII-free team link (no backend).
- Match official wording (they use plural **Juniors/Seniors/Masters**).

## Strategy to win

Don't out-platform Freezai (brand/community fight we'd lose). Win as the
unambiguously better **tool** and own the segment they ignore:

- **Lead with correctness + mobile + privacy**: "won't let you submit an illegal team — on any phone, nothing uploaded."
- **Own tournament organizers** via the cruncher (bulk extraction → usage dashboards).
- Add the **shareable link** and a **landing page** to blunt their sharing/marketing edge.
