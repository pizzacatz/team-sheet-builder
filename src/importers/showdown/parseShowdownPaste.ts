import { resolveAbility, resolveItem, resolveMove, resolveSpecies, resolveStatAlignment } from "../../domain/normalization";
import { statsFromSpecies } from "../../domain/stats";
import { createEmptyTeamSheet, emptyPokemonEntry, type PokemonEntry } from "../../domain/teamTypes";
import { extractSpeciesTextFromHeader } from "./showdownNormalization";
import type { ImportIssue, ImportResult } from "./showdownTypes";

const IGNORED_FIELD_PREFIXES = [
  "tera type:",
  "gender:",
  "shiny:",
  "happiness:",
  "dynamax level:",
  "gigantamax:",
  "ivs:"
];

const isSilentlyIgnoredField = (lowerLine: string): boolean =>
  lowerLine.startsWith("level:") || /^level\s+\d+/.test(lowerLine);

const oldNeutralNatureNames = new Set(["bashful", "docile", "hardy", "quirky"]);

const addIssue = (
  issues: ImportIssue[],
  severity: "error" | "warning",
  code: string,
  message: string,
  pokemonIndex?: number,
  field?: string
) => {
  issues.push({ severity, code, message, pokemonIndex, field });
};

const parseBlock = (block: string, pokemonIndex: number, issues: ImportIssue[]): PokemonEntry => {
  const entry = emptyPokemonEntry();
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return entry;

  const { speciesText, itemText } = extractSpeciesTextFromHeader(lines[0]);
  const speciesResolution = resolveSpecies(speciesText);
  if (speciesResolution) {
    entry.speciesId = speciesResolution.record.id;
    entry.displayName = speciesResolution.record.displayName;
    entry.stats = statsFromSpecies(speciesResolution.record);
    entry.canMegaEvolve = Boolean(speciesResolution.record.allowedMegaForms?.length);
    if (speciesResolution.ambiguous) {
      addIssue(
        issues,
        "warning",
        "AMBIGUOUS_ALIAS_RESOLVED",
        `${speciesText} matched multiple species aliases; using ${speciesResolution.record.displayName}.`,
        pokemonIndex,
        "species"
      );
    }
  } else {
    entry.displayName = speciesText;
    addIssue(issues, "warning", "UNKNOWN_SPECIES", `Could not match species "${speciesText}".`, pokemonIndex, "species");
  }

  if (itemText) {
    const itemResolution = resolveItem(itemText);
    if (itemResolution) {
      entry.itemId = itemResolution.record.id;
    } else {
      addIssue(issues, "warning", "UNKNOWN_ITEM", `Could not match item "${itemText}".`, pokemonIndex, "item");
    }
  }

  let moveCursor = 0;
  let sawNature = false;
  let sawEvs = false;

  for (const line of lines.slice(1)) {
    const lower = line.toLowerCase();

    if (lower.startsWith("ability:")) {
      const abilityText = line.slice("ability:".length).trim();
      const abilityResolution = resolveAbility(abilityText);
      if (abilityResolution) {
        entry.abilityId = abilityResolution.record.id;
      } else {
        addIssue(
          issues,
          "warning",
          "UNKNOWN_ABILITY",
          `Could not match ability "${abilityText}".`,
          pokemonIndex,
          "ability"
        );
      }
      continue;
    }

    if (lower.startsWith("evs:")) {
      sawEvs = true;
      continue;
    }

    const natureMatch = line.match(/^(.+?)\s+Nature$/i);
    if (natureMatch) {
      sawNature = true;
      const alignmentText = natureMatch[1].trim();
      const alignmentResolution = resolveStatAlignment(alignmentText);
      if (alignmentResolution) {
        const normalizedOldNeutral = oldNeutralNatureNames.has(alignmentText.toLowerCase());
        entry.statAlignment = {
          value: alignmentResolution.record.id,
          source: "parsed_from_showdown_nature",
          confidence: "high",
          requiresReview: normalizedOldNeutral
        };
        if (normalizedOldNeutral) {
          addIssue(
            issues,
            "warning",
            "NEUTRAL_NATURE_NORMALIZED",
            `${alignmentText} is a removed neutral nature and was normalized to Serious.`,
            pokemonIndex,
            "statAlignment"
          );
        }
      } else {
        addIssue(
          issues,
          "warning",
          "UNKNOWN_STAT_ALIGNMENT",
          `Could not match Stat Alignment "${alignmentText}".`,
          pokemonIndex,
          "statAlignment"
        );
      }
      continue;
    }

    if (line.startsWith("-")) {
      if (moveCursor >= 4) continue;
      const moveText = line.replace(/^-\s*/, "").trim();
      const moveResolution = resolveMove(moveText);
      if (moveResolution) {
        entry.moves[moveCursor] = moveResolution.record.id;
      } else {
        addIssue(issues, "warning", "UNKNOWN_MOVE", `Could not match move "${moveText}".`, pokemonIndex, "moves");
      }
      moveCursor += 1;
      continue;
    }

    if (isSilentlyIgnoredField(lower)) {
      continue;
    }

    if (IGNORED_FIELD_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
      addIssue(
        issues,
        "warning",
        "UNKNOWN_SHOWDOWN_FIELD_IGNORED",
        `Ignored Showdown field "${line}".`,
        pokemonIndex
      );
      continue;
    }

    addIssue(issues, "warning", "UNKNOWN_SHOWDOWN_FIELD_IGNORED", `Ignored unrecognized line "${line}".`, pokemonIndex);
  }

  if (!sawNature && sawEvs) {
    addIssue(
      issues,
      "warning",
      "LOW_CONFIDENCE_STAT_ALIGNMENT_SUGGESTION",
      "EVs/SP were present, but no Nature line was found; choose Stat Alignment manually.",
      pokemonIndex,
      "statAlignment"
    );
  }

  return entry;
};

export const parseShowdownPaste = (paste: string): ImportResult => {
  const issues: ImportIssue[] = [];
  const blocks = paste
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) {
    addIssue(issues, "error", "NO_POKEMON_PARSED", "No Pokémon blocks were found.");
    return { teamSheet: {}, issues };
  }

  if (blocks.length < 6) {
    addIssue(issues, "warning", "LESS_THAN_SIX_POKEMON", `Imported ${blocks.length} Pokémon; team sheets have six slots.`);
  }

  if (blocks.length > 6) {
    addIssue(issues, "warning", "MORE_THAN_SIX_POKEMON_TRUNCATED", "Imported the first six Pokémon and ignored the rest.");
  }

  const teamSheet = createEmptyTeamSheet();
  blocks.slice(0, 6).forEach((block, index) => {
    teamSheet.pokemon[index] = parseBlock(block, index, issues);
  });

  return { teamSheet, issues };
};
