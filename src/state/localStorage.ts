import { createEmptyTeamSheet, emptyPokemonStats, type TeamSheet } from "../domain/teamTypes";
import { normalizePlayerInfo } from "../domain/playerInfoFile";

const STORAGE_KEY = "team-sheet-builder:current";

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
