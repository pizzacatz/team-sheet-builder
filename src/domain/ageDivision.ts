import type { PlayerInfo } from "./teamTypes";

export type AgeDivision = Exclude<PlayerInfo["division"], "" | undefined>;

// Play! Pokémon age divisions by birth year. These cutoffs shift each season —
// update them when the regulation season rolls over.
export const divisionForBirthYear = (year: number): AgeDivision => {
  if (year >= 2014) return "Junior";
  if (year >= 2010) return "Senior"; // 2010–2013 inclusive
  return "Master"; // 2009 or earlier
};

// Short hint shown as a tooltip on each division option.
export const AGE_DIVISION_HINTS: Record<AgeDivision, string> = {
  Junior: "Born in 2014 or later",
  Senior: "Born 2010–2013",
  Master: "Born in 2009 or earlier"
};
