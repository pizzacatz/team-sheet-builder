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
import { statAlignmentsById } from "./regulationData";
import {
  achievableStatValues,
  alignmentMultiplier,
  impliedStatPoints,
  presentedStat,
  statBounds,
  statRows,
  STAT_POINT_TOTAL_MAX
} from "./stats";
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

// Accepts a complete MM-DD-YY (6 digits) or MM-DD-YYYY (8 digits) date. Two-digit
// years are allowed. Day is bounded loosely (01-31), not per-month.
const isValidDateOfBirth = (digits: string): boolean => {
  if (digits.length !== 6 && digits.length !== 8) return false;
  const month = Number.parseInt(digits.slice(0, 2), 10);
  const day = Number.parseInt(digits.slice(2, 4), 10);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
};

export const validateTeamSheet = (teamSheet: TeamSheet): ValidationResult => {
  const issues: ValidationIssue[] = [];

  if (!teamSheet.player.name.trim()) {
    issue(issues, "error", "player.name", "MISSING_PLAYER_NAME", "Player name is required.");
  }
  if (!teamSheet.player.trainerName?.trim()) {
    issue(
      issues,
      "error",
      "player.trainerName",
      "MISSING_TRAINER_NAME",
      "Trainer Name in Game is required."
    );
  }
  if (!teamSheet.player.division) {
    issue(issues, "error", "player.division", "MISSING_AGE_DIVISION", "Age Division is required.");
  }
  if (!teamSheet.player.playerId?.trim()) {
    issue(issues, "error", "player.playerId", "MISSING_PLAYER_ID", "Player ID is required.");
  }

  const dobDigits = (teamSheet.player.dateOfBirth ?? "").replace(/\D/g, "");
  if (!dobDigits) {
    issue(issues, "error", "player.dateOfBirth", "MISSING_DATE_OF_BIRTH", "Date of Birth is required.");
  } else if (!isValidDateOfBirth(dobDigits)) {
    issue(
      issues,
      "error",
      "player.dateOfBirth",
      "INVALID_DATE_OF_BIRTH",
      "Date of Birth must be a complete date (MM-DD-YY or MM-DD-YYYY)."
    );
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
      issue(issues, "error", `${path}.itemId`, "MISSING_ITEM", `${slot} needs a held item.`);
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
            `${slot} has a duplicate held item — the same item is already on Pokémon ${existingItemSlot + 1}.`
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

    const moveSlotById = new Map<string, number>();
    entry.moves.forEach((moveId, moveIndex) => {
      const movePath = `${path}.moves.${moveIndex}`;
      if (!moveId) {
        if (moveIndex === 0) {
          issue(issues, "error", movePath, "MISSING_MOVE", `${slot} needs move 1.`);
        }
        return;
      }
      const firstSlot = moveSlotById.get(moveId);
      if (firstSlot !== undefined) {
        issue(
          issues,
          "error",
          movePath,
          "DUPLICATE_MOVE",
          `${slot} has a duplicate move — ${getMoveRecord(moveId)?.displayName ?? moveId} is already on move ${firstSlot + 1}.`
        );
      } else {
        moveSlotById.set(moveId, moveIndex);
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

    let statsComplete = true;
    let statsInRange = true;
    statRows.forEach((stat) => {
      const statPath = `${path}.stats.${stat.key}`;
      const raw = entry.stats[stat.key]?.trim();
      if (!raw) {
        issue(issues, "error", statPath, "MISSING_STAT", `${slot} needs a ${stat.label} value.`);
        statsComplete = false;
        return;
      }
      const value = Number.parseInt(raw, 10);
      if (!Number.isFinite(value)) {
        statsComplete = false;
        return;
      }
      const { min, max } = statBounds(species, stat.key);
      if (value < min || value > max) {
        statsInRange = false;
        issue(
          issues,
          "error",
          statPath,
          "STAT_OUT_OF_RANGE",
          `${slot} ${stat.label} of ${value} is outside the expected range. Enter the final in-game stat, not the Stat Point spread.`
        );
      }
    });

    // Alignment-aware pass: when every stat is present and in range and an
    // alignment is chosen, reverse-engineer the Stat Points implied by that
    // alignment. Values that can't come from any legal 0..32 allocation, or that
    // exceed the 66-point budget, are errors; a zero-point spread is a warning.
    const alignmentRecord = statAlignmentsById.get(entry.statAlignment.value ?? "");
    if (statsComplete && statsInRange && alignmentRecord) {
      const alignmentName = alignmentRecord.displayName;
      let totalPoints = 0;
      let inconsistent = false;
      statRows.forEach((stat) => {
        const value = Number.parseInt(entry.stats[stat.key] ?? "", 10);
        const presented = presentedStat(species, stat.key);
        const multiplier = alignmentMultiplier(stat.key, alignmentRecord);
        const points = impliedStatPoints(value, presented, multiplier);
        if (points === null) {
          inconsistent = true;
          // Guide the fix: too low, too high (over 32 points), or an unreachable
          // in-between value (the x1.1 raised stat skips some integers).
          const legal = achievableStatValues(presented, multiplier);
          const min = legal[0];
          const max = legal[legal.length - 1];
          const nearest = legal.reduce((best, option) =>
            Math.abs(option - value) < Math.abs(best - value) ? option : best
          );
          const hint =
            value < min
              ? `it should be at least ${min}`
              : value > max
                ? `it can't exceed ${max} with 32 Stat Points`
                : `the nearest legal value is ${nearest}`;
          issue(
            issues,
            "error",
            `${path}.stats.${stat.key}`,
            "STAT_ALIGNMENT_MISMATCH",
            `${slot} ${stat.label} of ${value} isn't reachable with the ${alignmentName} Stat Alignment — ${hint}.`
          );
        } else {
          totalPoints += points;
        }
      });
      if (!inconsistent && totalPoints > STAT_POINT_TOTAL_MAX) {
        issue(
          issues,
          "error",
          path,
          "STAT_POINTS_OVER_BUDGET",
          `${slot} stats add up to more than the ${STAT_POINT_TOTAL_MAX} Stat Point limit — reduce your investment.`
        );
      } else if (!inconsistent && totalPoints === 0 && !alignmentRecord.raises && !alignmentRecord.lowers) {
        // Only nudge the unambiguous case: a neutral alignment with every stat at
        // default. A non-neutral nature already shifts two stats, so a 0-point
        // spread there is a deliberate choice, not a "nothing entered" tell.
        issue(
          issues,
          "warning",
          `${path}.statAlignment`,
          "STATS_LOOK_UNTOUCHED",
          `${slot} has no Stat Points invested and a neutral Stat Alignment — confirm you entered your spread and picked the right Stat Alignment.`
        );
      }
    }

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
