import { decodeTeamDataPayload, encodeTeamDataPayload, type DecodedPokemon } from "../pdf/teamDataCode";
import { speciesById } from "./regulationData";
import { emptyPokemonEntry, type PlayerInfo, type PokemonEntry, type TeamSheet } from "./teamTypes";

// Shareable-team link payload: the PII-free team (slug encoding, so it decodes
// even after data updates), optionally the player info (opt-in). deflate-raw +
// base64url keeps the URL short and hash-safe. Lives entirely in the URL — no
// backend, no upload.

const SHARE_VERSION = 1;

type SharePayload = {
  v: number;
  team: string;
  player?: PlayerInfo;
};

export type DecodedShare = {
  pokemon: PokemonEntry[];
  player?: PlayerInfo;
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

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

const entryFromDecoded = (decoded: DecodedPokemon | undefined): PokemonEntry => {
  if (!decoded || !decoded.speciesId) return emptyPokemonEntry();
  const species = speciesById.get(decoded.speciesId);
  return {
    speciesId: decoded.speciesId || null,
    formId: decoded.formId || null,
    displayName: species?.displayName ?? "",
    abilityId: decoded.abilityId || null,
    itemId: decoded.itemId || null,
    moves: [decoded.moves[0] || null, decoded.moves[1] || null, decoded.moves[2] || null, decoded.moves[3] || null],
    stats: decoded.stats,
    statAlignment: {
      value: decoded.statAlignmentId || null,
      source: "manual",
      confidence: decoded.statAlignmentId ? "high" : "none",
      requiresReview: false
    },
    canMegaEvolve: Boolean(species?.allowedMegaForms?.length),
    notes: []
  };
};

export const encodeTeamShare = async (teamSheet: TeamSheet, includePlayer: boolean): Promise<string> => {
  const payload: SharePayload = { v: SHARE_VERSION, team: encodeTeamDataPayload(teamSheet) };
  if (includePlayer) payload.player = teamSheet.player;
  return toBase64Url(await deflateRaw(JSON.stringify(payload)));
};

export const decodeTeamShare = async (encoded: string): Promise<DecodedShare | null> => {
  try {
    const payload = JSON.parse(await inflateRaw(fromBase64Url(encoded))) as SharePayload;
    if (!payload || typeof payload.team !== "string") return null;
    const decoded = decodeTeamDataPayload(payload.team);
    const pokemon = Array.from({ length: 6 }, (_, index) => entryFromDecoded(decoded[index]));
    return payload.player ? { pokemon, player: payload.player } : { pokemon };
  } catch {
    return null;
  }
};
