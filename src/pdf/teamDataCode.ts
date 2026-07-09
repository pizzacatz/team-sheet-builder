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
// Compressed carrier (used by the crammed corner QR): deflate-raw + base64 of the
// same payload, so the QR needs far fewer modules and stays larger per-module in
// the little corner space available.
export const TEAM_DATA_COMPRESSED_SENTINEL = "TSBz1";
const FIELD_SEP = ",";
const MON_SEP = "|";
const SEGMENT_CHARS = 90;

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

/**
 * Single-line encoding for the QR carrier. It is a one-segment version of the
 * same wire format, so `decodeTeamDataFromText` decodes a scanned QR string with
 * no special-casing.
 */
export const encodeTeamDataQrText = (teamSheet: TeamSheet): string =>
  `${TEAM_DATA_SENTINEL}~0~1~${encodeTeamDataPayload(teamSheet)}`;

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

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

const deflateRaw = async (text: string): Promise<Uint8Array> => {
  const stream = new CompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  void writer.write(new TextEncoder().encode(text));
  void writer.close();
  return new Uint8Array(await new Response(stream.readable).arrayBuffer());
};

const inflateRaw = async (bytes: Uint8Array): Promise<string> => {
  const stream = new DecompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  void writer.write(bytes as BufferSource);
  void writer.close();
  return new TextDecoder().decode(await new Response(stream.readable).arrayBuffer());
};

/** Compressed single-string encoding for the corner QR carrier. */
export const encodeTeamDataQrPayload = async (teamSheet: TeamSheet): Promise<string> => {
  const compressed = await deflateRaw(encodeTeamDataPayload(teamSheet));
  return `${TEAM_DATA_COMPRESSED_SENTINEL}~${bytesToBase64(compressed)}`;
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

const decodePayloadString = (payload: string): DecodedPokemon[] => payload.split(MON_SEP).map(decodeMon);

/**
 * Recover team data from any carrier: the compressed corner QR (`TSBz1~`), or
 * the plain segmented transparent text (`TSBv1~`). Async because the compressed
 * form must be inflated.
 */
export const decodeTeamDataFromScan = async (text: string): Promise<DecodedPokemon[]> => {
  const compressed = new RegExp(`${TEAM_DATA_COMPRESSED_SENTINEL}~([A-Za-z0-9+/=]+)`).exec(text);
  if (compressed) {
    return decodePayloadString(await inflateRaw(base64ToBytes(compressed[1])));
  }
  return decodeTeamDataFromText(text);
};
