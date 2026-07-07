import { createEmptyTeamSheet, type PlayerInfo } from "./teamTypes";

const PLAYER_INFO_FILE_KIND = "team-sheet-builder-player-info";
const PLAYER_INFO_FILE_VERSION = 1;

type PlayerInfoFile = {
  kind: typeof PLAYER_INFO_FILE_KIND;
  version: typeof PLAYER_INFO_FILE_VERSION;
  player: PlayerInfo;
};

const playerInfoKeys = [
  "name",
  "playerId",
  "eventName",
  "date",
  "division",
  "teamName",
  "trainerName",
  "switchProfileName",
  "supportId",
  "dateOfBirth"
] as const;

const divisions: Array<PlayerInfo["division"]> = ["Junior", "Senior", "Master", ""];
const digitsOnly = (value: string): string => value.replace(/\D/g, "");

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

export const normalizePlayerInfo = (value: unknown): PlayerInfo => {
  const source = asRecord(value);
  const player = { ...createEmptyTeamSheet().player };
  if (!source) return player;

  playerInfoKeys.forEach((key) => {
    const rawValue = source[key];
    if (typeof rawValue === "string") {
      player[key] = rawValue as never;
    }
  });

  if (!divisions.includes(player.division)) {
    player.division = "";
  }
  player.playerId = digitsOnly(player.playerId ?? "");

  return player;
};

export const serializePlayerInfoFile = (player: PlayerInfo): string => {
  const file: PlayerInfoFile = {
    kind: PLAYER_INFO_FILE_KIND,
    version: PLAYER_INFO_FILE_VERSION,
    player: normalizePlayerInfo(player)
  };

  return `${JSON.stringify(file, null, 2)}\n`;
};

export const parsePlayerInfoFile = (contents: string): PlayerInfo => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("Choose a valid player info JSON file.");
  }

  const root = asRecord(parsed);
  if (!root) {
    throw new Error("Choose a valid player info JSON file.");
  }

  if ("kind" in root && root.kind !== PLAYER_INFO_FILE_KIND) {
    throw new Error("Choose a player info file exported from this app.");
  }

  return normalizePlayerInfo(root.player ?? root);
};

export const playerInfoFilename = (player: PlayerInfo): string => {
  const name = player.name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${name || "player-info"}.json`;
};
