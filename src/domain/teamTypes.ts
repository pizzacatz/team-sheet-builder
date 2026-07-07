import type { Regulation } from "./dataTypes";

export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

export type PokemonStats = Record<StatKey, string>;

export type TeamSheet = {
  player: PlayerInfo;
  regulation: Regulation;
  pokemon: PokemonEntry[];
};

export type PlayerInfo = {
  name: string;
  playerId?: string;
  eventName?: string;
  date?: string;
  division?: "Junior" | "Senior" | "Master" | "";
  teamName?: string;
  trainerName?: string;
  switchProfileName?: string;
  supportId?: string;
  dateOfBirth?: string;
};

export type PokemonEntry = {
  speciesId: string | null;
  formId?: string | null;
  displayName: string;
  abilityId: string | null;
  itemId: string | null;
  moves: [string | null, string | null, string | null, string | null];
  stats: PokemonStats;
  statAlignment: StatAlignmentField;
  canMegaEvolve?: boolean;
  notes?: string[];
};

export type StatAlignmentField = {
  value: string | null;
  source:
    | "parsed_from_showdown_nature"
    | "inferred_from_evs"
    | "manual"
    | "unknown";
  confidence: "high" | "medium" | "low" | "none";
  requiresReview: boolean;
};

export const emptyStatAlignment = (): StatAlignmentField => ({
  value: null,
  source: "unknown",
  confidence: "none",
  requiresReview: false
});

export const emptyPokemonStats = (): PokemonStats => ({
  hp: "",
  atk: "",
  def: "",
  spa: "",
  spd: "",
  spe: ""
});

export const emptyPokemonEntry = (): PokemonEntry => ({
  speciesId: null,
  formId: null,
  displayName: "",
  abilityId: null,
  itemId: null,
  moves: [null, null, null, null],
  stats: emptyPokemonStats(),
  statAlignment: emptyStatAlignment(),
  canMegaEvolve: false,
  notes: []
});

export const createEmptyTeamSheet = (): TeamSheet => ({
  player: {
    name: "",
    playerId: "",
    eventName: "",
    date: "",
    division: "",
    teamName: "",
    trainerName: "",
    switchProfileName: "",
    supportId: "",
    dateOfBirth: ""
  },
  regulation: "M-B",
  pokemon: Array.from({ length: 6 }, emptyPokemonEntry)
});
