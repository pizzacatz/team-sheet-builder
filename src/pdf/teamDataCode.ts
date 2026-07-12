import { CODE_INDEX_VERSION, idFor, numberFor } from "./codeIndex";
import { normalizePokemonStats, statRows } from "../domain/stats";
import type { StatKey, TeamSheet } from "../domain/teamTypes";

// Machine-readable, PII-free team payload embedded as (transparent) text on the
// staff sheet. The same payload is intended to feed a future QR code, so the
// format is carrier-agnostic: a versioned sentinel plus positional, ID-based
// fields. Player Info is deliberately excluded.
//
// Wire format (one logical payload, split across N physical lines so it always
// fits the page width and survives text extraction):
//
//   TSBv1~<segmentIndex>~<segmentCount>~<chunk>
//
// Reassembled payload:
//
//   <mon>|<mon>|... (always six slots, positional)
//   <mon> = species,form,ability,item,move1,move2,move3,move4,statAlign,hp,atk,def,spa,spd,spe
//
// Empty fields are empty tokens. All values are stable internal IDs, except the
// six stat cells which are the final displayed stat values (as drawn on the
// sheet).

export const TEAM_DATA_SENTINEL = "TSBv1";
// Index carrier (used by the crammed corner QR): a fixed-width, separator-free
// payload of base36 code-index numbers plus a data-version stamp. Far fewer
// characters than the slug form, and all-uppercase so the QR uses the denser
// alphanumeric mode — both shrink the module count so the code fits and scans in
// the tiny corner. See scripts/build_code_index.mjs for the numbering contract.
export const TEAM_DATA_INDEX_SENTINEL = "TSBI1";
const FIELD_SEP = ",";
const MON_SEP = "|";
const SEGMENT_CHARS = 90;

// Fixed field widths (base36 chars) for the index payload. 2 chars = up to 1295,
// comfortably above current category sizes; 1 char for the 21 stat alignments.
const IDX_ID = 2;
const IDX_ALIGN = 1;
const IDX_STAT = 2;
const IDX_RECORD = IDX_ID * 4 + IDX_ID * 4 + IDX_ALIGN + IDX_STAT * 6; // species/form/ability/item + 4 moves + align + 6 stats
const VERSION_WIDTH = 4;

export const STAT_KEY_ORDER: StatKey[] = statRows.map((stat) => stat.key);

export type DecodedPokemon = {
  speciesId: string;
  formId: string;
  abilityId: string;
  itemId: string;
  moves: [string, string, string, string];
  statAlignmentId: string;
  stats: Record<StatKey, string>;
};

const cell = (value: string | null | undefined): string => (value ?? "").trim();

const encodeMon = (fields: string[]): string => fields.join(FIELD_SEP);

/** Build the reassembled (single-string) payload without segmentation. */
export const encodeTeamDataPayload = (teamSheet: TeamSheet): string =>
  teamSheet.pokemon
    .map((entry) => {
      const stats = normalizePokemonStats(entry.stats);
      return encodeMon([
        cell(entry.speciesId),
        cell(entry.formId),
        cell(entry.abilityId),
        cell(entry.itemId),
        cell(entry.moves[0]),
        cell(entry.moves[1]),
        cell(entry.moves[2]),
        cell(entry.moves[3]),
        cell(entry.statAlignment.value),
        ...STAT_KEY_ORDER.map((key) => cell(stats[key]))
      ]);
    })
    .join(MON_SEP);

/** Split the payload into sentinel-prefixed lines for drawing/extraction. */
export const encodeTeamDataLines = (teamSheet: TeamSheet): string[] => {
  const payload = encodeTeamDataPayload(teamSheet);
  const segmentCount = Math.max(1, Math.ceil(payload.length / SEGMENT_CHARS));
  const lines: string[] = [];
  for (let index = 0; index < segmentCount; index += 1) {
    const chunk = payload.slice(index * SEGMENT_CHARS, (index + 1) * SEGMENT_CHARS);
    lines.push(`${TEAM_DATA_SENTINEL}~${index}~${segmentCount}~${chunk}`);
  }
  return lines;
};

const b36 = (value: number, width: number): string => value.toString(36).toUpperCase().padStart(width, "0");
const fromB36 = (chunk: string): number => parseInt(chunk, 36) || 0;
const statNumber = (value: string): number => Number.parseInt(value, 10) || 0;

/**
 * Fixed-width, separator-free index encoding for the corner QR:
 *   TSBI1 <version:4> <record x6>
 *   record = species form ability item move1..4 (2 each) statAlign (1) hp..spe (2 each)
 * ids are code-index numbers (0 = empty); stats are the displayed values.
 */
export const encodeTeamDataIndexPayload = (teamSheet: TeamSheet): string => {
  const records = teamSheet.pokemon
    .map((entry) => {
      const stats = normalizePokemonStats(entry.stats);
      return [
        b36(numberFor("species", entry.speciesId), IDX_ID),
        b36(numberFor("forms", entry.formId), IDX_ID),
        b36(numberFor("abilities", entry.abilityId), IDX_ID),
        b36(numberFor("items", entry.itemId), IDX_ID),
        ...entry.moves.map((moveId) => b36(numberFor("moves", moveId), IDX_ID)),
        b36(numberFor("statAlignments", entry.statAlignment.value), IDX_ALIGN),
        ...STAT_KEY_ORDER.map((key) => b36(statNumber(stats[key]), IDX_STAT))
      ].join("");
    })
    .join("");
  return `${TEAM_DATA_INDEX_SENTINEL}${CODE_INDEX_VERSION}${records}`;
};

const decodeIndexRecord = (record: string): DecodedPokemon => {
  let cursor = 0;
  const take = (width: number): number => {
    const value = fromB36(record.slice(cursor, cursor + width));
    cursor += width;
    return value;
  };
  const speciesId = idFor("species", take(IDX_ID));
  const formId = idFor("forms", take(IDX_ID));
  const abilityId = idFor("abilities", take(IDX_ID));
  const itemId = idFor("items", take(IDX_ID));
  const moves: [string, string, string, string] = [
    idFor("moves", take(IDX_ID)),
    idFor("moves", take(IDX_ID)),
    idFor("moves", take(IDX_ID)),
    idFor("moves", take(IDX_ID))
  ];
  const statAlignmentId = idFor("statAlignments", take(IDX_ALIGN));
  const stats = STAT_KEY_ORDER.reduce((acc, key) => {
    const value = take(IDX_STAT);
    acc[key] = value ? String(value) : "";
    return acc;
  }, {} as Record<StatKey, string>);
  return { speciesId, formId, abilityId, itemId, moves, statAlignmentId, stats };
};

/** Decode a raw `<mon>|<mon>|...` slug payload (as produced by encodeTeamDataPayload). */
export const decodeTeamDataPayload = (payload: string): DecodedPokemon[] => payload.split(MON_SEP).map(decodeMon);

const decodeIndexPayload = (payload: string): DecodedPokemon[] => {
  const body = payload.slice(TEAM_DATA_INDEX_SENTINEL.length + VERSION_WIDTH);
  const records: DecodedPokemon[] = [];
  for (let start = 0; start + IDX_RECORD <= body.length; start += IDX_RECORD) {
    records.push(decodeIndexRecord(body.slice(start, start + IDX_RECORD)));
  }
  return records;
};

const decodeMon = (raw: string): DecodedPokemon => {
  const fields = raw.split(FIELD_SEP);
  const at = (index: number): string => fields[index] ?? "";
  return {
    speciesId: at(0),
    formId: at(1),
    abilityId: at(2),
    itemId: at(3),
    moves: [at(4), at(5), at(6), at(7)],
    statAlignmentId: at(8),
    stats: STAT_KEY_ORDER.reduce((acc, key, index) => {
      acc[key] = at(9 + index);
      return acc;
    }, {} as Record<StatKey, string>)
  };
};

/**
 * Recover the team payload from arbitrary extracted text (e.g. `pdftotext`
 * output). Tolerates reordered or interleaved lines by sorting on the segment
 * index and concatenating.
 */
export const decodeTeamDataFromText = (text: string): DecodedPokemon[] => {
  const pattern = new RegExp(`${TEAM_DATA_SENTINEL}~(\\d+)~(\\d+)~(\\S*)`, "g");
  const segments = new Map<number, string>();
  let segmentCount = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    segmentCount = Number(match[2]);
    segments.set(Number(match[1]), match[3]);
  }
  if (segmentCount === 0) return [];
  let payload = "";
  for (let index = 0; index < segmentCount; index += 1) {
    payload += segments.get(index) ?? "";
  }
  return payload.split(MON_SEP).map(decodeMon);
};

/** The data-version stamp carried by an index (`TSBI1`) payload, or null. */
export const indexPayloadVersion = (text: string): string | null => {
  const match = new RegExp(`${TEAM_DATA_INDEX_SENTINEL}([0-9A-Z]{${VERSION_WIDTH}})`).exec(text);
  return match ? match[1] : null;
};

/**
 * Recover team data from any carrier: the index corner QR (`TSBI1`) or the plain
 * segmented transparent text (`TSBv1`).
 */
export const decodeTeamDataFromScan = (text: string): DecodedPokemon[] => {
  const index = new RegExp(`${TEAM_DATA_INDEX_SENTINEL}[0-9A-Z]+`).exec(text);
  if (index) {
    return decodeIndexPayload(index[0]);
  }
  return decodeTeamDataFromText(text);
};
