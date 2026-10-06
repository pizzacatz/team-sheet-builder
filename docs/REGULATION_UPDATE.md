# Regulation Update Checklist

Follow this whenever the app moves to a new regulation or the regulation data is refreshed.

1. **Regenerate the data.** Run `npm run data:export`. It rewrites `src/data/regulation-mc/` from the Champions Logic database and refreshes `code-index.json` (append-only; never hand-edit it). See [Data Export](../README.md#data-export).
2. **Run the tests.** `npm test`. Failures in `src/domain/variantForms.test.ts` mean the new data has form groups that need a decision (step 3).
3. **Decide variant form labels.** Every Pokédex number with more than one form record needs its base form listed in exactly one place in `src/domain/regulationData.ts`:
   - `displayOverrides`: **label it** when the sibling forms are equally valid alternatives and the bare name doesn't say which one is meant. Gender (`Indeedee-M`), time of day (`Lycanroc-Midday`), plumage (`Squawkabilly-Green`), `Toxtricity-Amped`, and the like.
   - `unlabelledBaseForms`: **leave it bare** for regional variants (`Raichu` next to `Raichu-Alola`), size variants (`Gourgeist`), and bases whose bare name is already the form's own name (`Rotom`).
   - The bare name always stays an alias, so typing and Showdown imports keep working.
4. **Gender-difference species.** For every new `-F` record, add `base: "basef"` to `GENDER_FEMALE_FORM` in `src/importers/showdown/parseShowdownPaste.ts` so `Gender: F` pastes import the female form, and label the base `-M` (step 3). The variant-forms test checks this too.
5. **Regulation name.** Check that `rules.json` carries the new regulation. Update the `Regulation` type in `src/domain/dataTypes.ts`, the default in `createEmptyTeamSheet` (`src/domain/teamTypes.ts`), and the README mentions.
6. **Verify.** `npm test` and `npm run build` both pass. Spot-check a few new species in the dropdown and on a generated PDF.
7. **Commit and push.** Pushing to main deploys the builder.
