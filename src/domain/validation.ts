import {
  entryHasAnyData,
  getAbilityRecord,
  getItemRecord,
  getMoveRecord,
  getSpeciesRecord,
  isAbilityAvailable,
  isMegaItemMatched,
  isMoveLearnable
} from "./legality";
import type { TeamSheet } from "./teamTypes";
import type { ValidationIssue, ValidationResult } from "./validationTypes";

const issue = (
  issues: ValidationIssue[],
  severity: "error" | "warning",
  path: string,
  code: string,
  message: string
) => {
  issues.push({ severity, path, code, message });
};

export const validateTeamSheet = (teamSheet: TeamSheet): ValidationResult => {
  const issues: ValidationIssue[] = [];

  if (!teamSheet.player.name.trim()) {
    issue(issues, "error", "player.name", "MISSING_PLAYER_NAME", "Player name is required.");
  }

  const speciesDexBySlot = new Map<number, number>();
  const itemBySlot = new Map<string, number>();

  teamSheet.pokemon.forEach((entry, index) => {
    const path = `pokemon.${index}`;
    const slot = `Pokémon ${index + 1}`;
    const hasData = entryHasAnyData(entry);

    if (!entry.speciesId) {
      issue(issues, "error", `${path}.speciesId`, "MISSING_SPECIES", `${slot} needs a species.`);
      return;
    }

    const species = getSpeciesRecord(entry.speciesId);
    if (!species) {
      issue(issues, "error", `${path}.speciesId`, "ILLEGAL_SPECIES", `${slot} species is not legal in M-B.`);
      return;
    }

    const existingSpeciesSlot = speciesDexBySlot.get(species.nationalDexNumber);
    if (existingSpeciesSlot !== undefined) {
      issue(
        issues,
        "error",
        `${path}.speciesId`,
        "DUPLICATE_SPECIES",
        `${slot} duplicates the Pokédex number used by Pokémon ${existingSpeciesSlot + 1}.`
      );
    } else {
      speciesDexBySlot.set(species.nationalDexNumber, index);
    }

    if (!entry.abilityId) {
      issue(issues, "error", `${path}.abilityId`, "MISSING_ABILITY", `${slot} needs an ability.`);
    } else if (!getAbilityRecord(entry.abilityId)) {
      issue(issues, "error", `${path}.abilityId`, "ILLEGAL_ABILITY", `${slot} ability is not legal in M-B.`);
    } else if (!isAbilityAvailable(entry)) {
      issue(
        issues,
        "error",
        `${path}.abilityId`,
        "ABILITY_NOT_AVAILABLE",
        `${slot} cannot have the selected ability.`
      );
    }

    if (!entry.itemId) {
      issue(issues, "error", `${path}.itemId`, "ILLEGAL_ITEM", `${slot} needs a held item.`);
    } else {
      const item = getItemRecord(entry.itemId);
      if (!item) {
        issue(issues, "error", `${path}.itemId`, "ILLEGAL_ITEM", `${slot} item is not legal in M-B.`);
      } else {
        const existingItemSlot = itemBySlot.get(item.id);
        if (item.itemClauseEligible && existingItemSlot !== undefined) {
          issue(
            issues,
            "error",
            `${path}.itemId`,
            "DUPLICATE_ITEM",
            `${slot} duplicates the held item used by Pokémon ${existingItemSlot + 1}.`
          );
        } else if (item.itemClauseEligible) {
          itemBySlot.set(item.id, index);
        }
      }
    }

    if (!isMegaItemMatched(entry)) {
      issue(
        issues,
        "warning",
        `${path}.itemId`,
        "MEGA_ITEM_MISMATCH",
        `${slot} is holding a Mega Stone that will not Mega Evolve this species.`
      );
    }

    entry.moves.forEach((moveId, moveIndex) => {
      const movePath = `${path}.moves.${moveIndex}`;
      if (!moveId) {
        issue(issues, "error", movePath, "MISSING_MOVE", `${slot} needs move ${moveIndex + 1}.`);
        return;
      }
      if (!getMoveRecord(moveId)) {
        issue(issues, "error", movePath, "ILLEGAL_MOVE", `${slot} move ${moveIndex + 1} is not legal in M-B.`);
        return;
      }
      if (!isMoveLearnable(entry, moveId)) {
        issue(
          issues,
          "error",
          movePath,
          "MOVE_NOT_LEARNABLE",
          `${slot} cannot learn ${getMoveRecord(moveId)?.displayName ?? moveId}.`
        );
      }
    });

    if (!entry.statAlignment.value) {
      issue(
        issues,
        "error",
        `${path}.statAlignment`,
        "MISSING_STAT_ALIGNMENT",
        `${slot} needs a Stat Alignment.`
      );
    } else if (entry.statAlignment.requiresReview) {
      issue(
        issues,
        "warning",
        `${path}.statAlignment`,
        "STAT_ALIGNMENT_REQUIRES_REVIEW",
        `${slot} Stat Alignment was imported with review required.`
      );
    }

    if (!hasData) {
      issue(issues, "warning", path, "LESS_THAN_SIX_POKEMON", `${slot} is empty.`);
    }
  });

  return {
    isValid: !issues.some((validationIssue) => validationIssue.severity === "error"),
    issues
  };
};
