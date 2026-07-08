#!/usr/bin/env node
// Decode the PII-free team payload embedded on a Team Sheet Builder staff sheet.
//
// Usage:
//   node scripts/decode_team_data.mjs <staff-sheet.pdf>   # needs `pdftotext` (poppler)
//   node scripts/decode_team_data.mjs <dump.txt>          # pdftotext output / any text
//   pdftotext staff.pdf - | node scripts/decode_team_data.mjs -   # read text from stdin
//
// Prints human-readable team data (IDs expanded via src/data/regulation-mb).
// Player Info is never embedded, so it is never recovered.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SENTINEL = "TSBv1";
const FIELD_SEP = ",";
const MON_SEP = "|";
const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"];
const STAT_LABELS = { hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" };

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(scriptDir, "../src/data/regulation-mb");

const loadById = (file, key = "id") => {
  const records = JSON.parse(readFileSync(resolve(dataDir, file), "utf8"));
  return new Map(records.map((record) => [record[key], record]));
};

const species = loadById("species.json");
const abilities = loadById("abilities.json");
const items = loadById("items.json");
const moves = loadById("moves.json");
const statAlignments = loadById("stat-alignments.json");

const name = (map, id) => (id ? (map.get(id)?.displayName ?? `${id} (unknown)`) : "—");

const readInput = (arg) => {
  if (!arg || arg === "-") return readFileSync(0, "utf8");
  if (arg.toLowerCase().endsWith(".pdf")) {
    try {
      return execFileSync("pdftotext", ["-layout", arg, "-"], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
    } catch (error) {
      if (error.code === "ENOENT") {
        console.error("`pdftotext` not found. Install poppler (e.g. `sudo apt install poppler-utils`),");
        console.error("or run: pdftotext your.pdf - | node scripts/decode_team_data.mjs -");
        process.exit(1);
      }
      throw error;
    }
  }
  return readFileSync(arg, "utf8");
};

const decode = (text) => {
  const pattern = new RegExp(`${SENTINEL}~(\\d+)~(\\d+)~(\\S*)`, "g");
  const segments = new Map();
  let segmentCount = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    segmentCount = Number(match[2]);
    segments.set(Number(match[1]), match[3]);
  }
  if (segmentCount === 0) return [];
  let payload = "";
  for (let index = 0; index < segmentCount; index += 1) payload += segments.get(index) ?? "";
  return payload.split(MON_SEP).map((raw) => raw.split(FIELD_SEP));
};

const mons = decode(readInput(process.argv[2]));
if (mons.length === 0) {
  console.error(`No ${SENTINEL} payload found in input.`);
  process.exit(1);
}

mons.forEach((fields, index) => {
  const speciesId = fields[0];
  if (!speciesId) return; // empty slot
  const form = fields[1] ? ` (${fields[1]})` : "";
  const moveNames = fields.slice(4, 8).filter(Boolean).map((id) => name(moves, id));
  const statLine = STAT_KEYS.map((key, i) => `${STAT_LABELS[key]} ${fields[9 + i] || "—"}`).join(" / ");
  console.log(`Pokémon ${index + 1}: ${name(species, speciesId)}${form}`);
  console.log(`  Ability: ${name(abilities, fields[2])}`);
  console.log(`  Item:    ${name(items, fields[3])}`);
  console.log(`  Align:   ${name(statAlignments, fields[8])}`);
  console.log(`  Moves:   ${moveNames.join(", ") || "—"}`);
  console.log(`  Stats:   ${statLine}`);
  console.log("");
});
