#!/usr/bin/env node
// Build (or extend) the append-only code-index registry used by the QR carrier.
//
// Every id gets a permanent integer, assigned the first time it is seen and then
// never changed, reordered, or reused. Re-running this after `data:export` keeps
// all existing numbers and only appends numbers for genuinely new ids, so any
// QR printed under an older registry still decodes correctly.
//
// Run standalone (`npm run data:index`) or chained after `data:export`.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dataDir = resolve(dirname(fileURLToPath(import.meta.url)), "../src/data/regulation-mb");
const registryPath = resolve(dataDir, "code-index.json");

const readJson = (file) => JSON.parse(readFileSync(resolve(dataDir, file), "utf8"));

// Ordered list of ids per category, in current data order (order only matters
// for brand-new ids; existing ids keep whatever number they already have).
const species = readJson("species.json");
const categories = {
  species: species.map((record) => record.id),
  forms: [...new Set(species.flatMap((record) => (record.forms ?? []).map((form) => form.id)))],
  abilities: readJson("abilities.json").map((record) => record.id),
  items: readJson("items.json").map((record) => record.id),
  moves: readJson("moves.json").map((record) => record.id),
  statAlignments: readJson("stat-alignments.json").map((record) => record.id)
};

let existing = {};
try {
  existing = JSON.parse(readFileSync(registryPath, "utf8"));
} catch {
  existing = {};
}

const next = {};
let added = 0;
for (const [category, ids] of Object.entries(categories)) {
  const prior = existing[category] ?? {};
  const map = { ...prior };
  // Numbers start at 1 so 0 can mean "empty/none" in the fixed-width payload.
  let max = Object.values(prior).reduce((acc, value) => Math.max(acc, value), 0);
  for (const id of ids) {
    if (map[id] === undefined) {
      max += 1;
      map[id] = max;
      added += 1;
    }
  }
  next[category] = map;
}

// Version stamp: a short hash of the full id->number mapping. A decoder compares
// it to its own registry and warns instead of silently mis-decoding when a sheet
// was produced with a newer registry than the decoder has.
const canonical = JSON.stringify(
  Object.fromEntries(
    Object.entries(next).map(([category, map]) => [
      category,
      Object.entries(map).sort((a, b) => a[1] - b[1])
    ])
  )
);
const version = createHash("sha256").update(canonical).digest("hex").slice(0, 4).toUpperCase();

const output = { version, ...next };
writeFileSync(registryPath, `${JSON.stringify(output, null, 2)}\n`);

const counts = Object.entries(next)
  .map(([category, map]) => `${category}=${Object.keys(map).length}`)
  .join(", ");
console.log(`code-index.json written: version ${version}, ${added} new id(s). Totals: ${counts}`);
