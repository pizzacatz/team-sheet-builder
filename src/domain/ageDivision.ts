import type { PlayerInfo } from "./teamTypes";

export type AgeDivision = Exclude<PlayerInfo["division"], "" | undefined>;

// Play! Pokémon age divisions by the age reached in the season year: Junior 12
// or under, Senior 13–16, Master 17+. Derived from the current year so the
// birth-year cutoffs shift automatically each season (no hardcoded years).
//
// Note: the season year is approximated by the calendar year. Around the
// Sept–Dec season rollover the calendar year can trail the official season year
// by one; pass an explicit `seasonYear` if that edge matters.
const JUNIOR_MAX_AGE = 12;
const SENIOR_MAX_AGE = 16;

const currentYear = (): number => new Date().getFullYear();

export const divisionForBirthYear = (birthYear: number, seasonYear: number = currentYear()): AgeDivision => {
  const age = seasonYear - birthYear;
  if (age <= JUNIOR_MAX_AGE) return "Junior";
  if (age <= SENIOR_MAX_AGE) return "Senior";
  return "Master";
};

// Tooltip text stating the birth-year cutoff for a division, computed from the
// season year so it stays correct as the cutoffs shift.
export const ageDivisionHint = (division: AgeDivision, seasonYear: number = currentYear()): string => {
  switch (division) {
    case "Junior":
      return `Born in ${seasonYear - JUNIOR_MAX_AGE} or later`;
    case "Senior":
      return `Born ${seasonYear - SENIOR_MAX_AGE}–${seasonYear - JUNIOR_MAX_AGE - 1}`;
    case "Master":
      return `Born in ${seasonYear - SENIOR_MAX_AGE - 1} or earlier`;
  }
};
