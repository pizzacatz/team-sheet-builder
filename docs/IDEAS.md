# Ideas / Deferred Work

Parking lot for larger changes we've discussed but not committed to.

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
