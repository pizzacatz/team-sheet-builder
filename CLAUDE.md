# Team Sheet Builder

- Before regenerating regulation data or moving to a new regulation, follow `docs/REGULATION_UPDATE.md`. In particular, decide every new variant form group's label (the rule is above `displayOverrides` in `src/domain/regulationData.ts`); `src/domain/variantForms.test.ts` fails until each one is decided.
- Pushing to main deploys the builder to GitHub Pages.
