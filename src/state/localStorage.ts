import { createEmptyTeamSheet, emptyPokemonStats, type PlayerInfo, type TeamSheet } from "../domain/teamTypes";

const STORAGE_KEY = "team-sheet-builder:current";
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

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const normalizePlayerInfo = (value: unknown): PlayerInfo => {
  const source = asRecord(value);
  const player = { ...createEmptyTeamSheet().player };
  if (!source) return player;

  playerInfoKeys.forEach((key) => {
    const rawValue = source[key];
    if (typeof rawValue === "string") {
      player[key] = rawValue as never;
    }
  });

  if (!divisions.includes(player.division)) player.division = "";
  player.playerId = (player.playerId ?? "").replace(/\D/g, "");
  return player;
};

export const loadTeamSheet = (): TeamSheet => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyTeamSheet();
    const parsed = JSON.parse(raw) as TeamSheet;
    return {
      ...createEmptyTeamSheet(),
      ...parsed,
      player: normalizePlayerInfo(parsed.player),
      pokemon: createEmptyTeamSheet().pokemon.map((emptyEntry, index) => ({
        ...emptyEntry,
        ...(parsed.pokemon?.[index] ?? {}),
        stats: {
          ...emptyPokemonStats(),
          ...(parsed.pokemon?.[index]?.stats ?? {})
        },
        moves: [
          parsed.pokemon?.[index]?.moves?.[0] ?? null,
          parsed.pokemon?.[index]?.moves?.[1] ?? null,
          parsed.pokemon?.[index]?.moves?.[2] ?? null,
          parsed.pokemon?.[index]?.moves?.[3] ?? null
        ]
      }))
    };
  } catch {
    return createEmptyTeamSheet();
  }
};

export const saveTeamSheet = (teamSheet: TeamSheet) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(teamSheet));
};

export const clearStoredTeamSheet = () => {
  window.localStorage.removeItem(STORAGE_KEY);
};
