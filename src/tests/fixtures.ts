import { items, species, statAlignmentsById } from "../domain/regulationData";
import { statsFromSpeciesWithPoints } from "../domain/stats";
import type { TeamSheet } from "../domain/teamTypes";

export const makeValidTeamSheet = (): TeamSheet => {
  // Jolly raises Spe / lowers SpA; stats are computed with a legal spread under
  // that alignment so the team is internally consistent (64 Stat Points).
  const jolly = statAlignmentsById.get("Jolly");
  const points = { hp: 20, def: 12, spe: 32 };
  const itemIds = items.filter((item) => !item.enablesMegaFor?.length).slice(0, 6).map((item) => item.id);
  const selectedSpecies = species
    .filter((record) => record.abilities.length > 0 && record.moves.length >= 4)
    .filter((record, index, records) => records.findIndex((candidate) => candidate.nationalDexNumber === record.nationalDexNumber) === index)
    .slice(0, 6);

  return {
    player: {
      name: "Test Player",
      division: "Master",
      trainerName: "Tester",
      teamName: "M-B Test",
      switchProfileName: "Switch",
      playerId: "123456",
      dateOfBirth: "01-01-2000",
      supportId: "SUPPORT"
    },
    regulation: "M-B",
    pokemon: selectedSpecies.map((record, index) => ({
      speciesId: record.id,
      formId: null,
      displayName: record.displayName,
      abilityId: record.abilities[0],
      itemId: itemIds[index],
      moves: [record.moves[0], record.moves[1], record.moves[2], record.moves[3]],
      stats: statsFromSpeciesWithPoints(record, points, jolly),
      statAlignment: {
        value: "Jolly",
        source: "manual",
        confidence: "high",
        requiresReview: false
      },
      canMegaEvolve: Boolean(record.allowedMegaForms?.length),
      notes: []
    }))
  };
};
