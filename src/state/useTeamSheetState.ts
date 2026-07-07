import { useEffect, useMemo, useState } from "react";
import { createEmptyTeamSheet, emptyPokemonEntry, type PlayerInfo, type PokemonEntry, type TeamSheet } from "../domain/teamTypes";
import { validateTeamSheet } from "../domain/validation";
import { clearStoredTeamSheet, loadTeamSheet, saveTeamSheet } from "./localStorage";

export const useTeamSheetState = () => {
  const [teamSheet, setTeamSheet] = useState<TeamSheet>(() =>
    typeof window === "undefined" ? createEmptyTeamSheet() : loadTeamSheet()
  );

  useEffect(() => {
    saveTeamSheet(teamSheet);
  }, [teamSheet]);

  const validation = useMemo(() => validateTeamSheet(teamSheet), [teamSheet]);

  const updatePlayer = (patch: Partial<PlayerInfo>) => {
    setTeamSheet((current) => ({
      ...current,
      player: { ...current.player, ...patch }
    }));
  };

  const updatePokemon = (index: number, patch: Partial<PokemonEntry>) => {
    setTeamSheet((current) => ({
      ...current,
      pokemon: current.pokemon.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry))
    }));
  };

  const replacePokemon = (entries: PokemonEntry[]) => {
    setTeamSheet((current) => ({
      ...current,
      pokemon: Array.from({ length: 6 }, (_, index) => entries[index] ?? emptyPokemonEntry())
    }));
  };

  const reset = () => {
    clearStoredTeamSheet();
    setTeamSheet(createEmptyTeamSheet());
  };

  return {
    teamSheet,
    validation,
    updatePlayer,
    updatePokemon,
    replacePokemon,
    reset,
    setTeamSheet
  };
};
