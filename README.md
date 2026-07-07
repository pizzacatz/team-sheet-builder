# Team Sheet Builder

A client-side team sheet builder for Pokémon Champions Regulation M-B.

## Features

- Showdown paste import
- Regulation M-B legality checks
- Player info save/load as local JSON
- Play! Pokémon PDF team sheet export
- GitHub Pages deployment

## Local Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm test
npm run build
```

## Deployment

Pushes to `main` run the GitHub Actions workflow in `.github/workflows/pages.yml`, which builds the app and deploys `dist/` to GitHub Pages.
