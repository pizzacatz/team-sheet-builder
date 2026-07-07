export type Regulation = "M-B";

export type MoveCategory = "Physical" | "Special" | "Status";

export type SpeciesRecord = {
  id: string;
  nationalDexNumber: number;
  displayName: string;
  aliases: string[];
  showdownAliases: string[];
  pdfName: string;
  legalIn: Regulation[];
  types: string[];
  baseStats?: StatBlock<number>;
  presentedStats?: StatBlock<number>;
  forms: SpeciesFormRecord[];
  abilities: string[];
  moves: string[];
  allowedMegaForms?: MegaEvolutionRecord[];
};

export type StatBlock<T> = {
  hp: T;
  atk: T;
  def: T;
  spa: T;
  spd: T;
  spe: T;
};

export type SpeciesFormRecord = {
  id: string;
  displayName: string;
  aliases: string[];
  showdownAliases: string[];
  pdfName: string;
  legalIn: Regulation[];
};

export type MoveRecord = {
  id: string;
  displayName: string;
  aliases: string[];
  showdownAliases: string[];
  type?: string;
  category?: MoveCategory;
  power?: number | null;
  accuracy?: number | null;
  pp?: number;
  legalIn: Regulation[];
};

export type AbilityRecord = {
  id: string;
  displayName: string;
  aliases: string[];
  showdownAliases: string[];
  legalIn: Regulation[];
};

export type ItemRecord = {
  id: string;
  displayName: string;
  aliases: string[];
  showdownAliases: string[];
  legalIn: Regulation[];
  itemClauseEligible: boolean;
  enablesMegaFor?: string[];
};

export type StatAlignmentRecord = {
  id: string;
  displayName: string;
  aliases: string[];
  showdownNatureAliases: string[];
  raises?: string | null;
  lowers?: string | null;
  isNeutral?: boolean;
};

export type MegaEvolutionRecord = {
  id: string;
  baseSpeciesId: string;
  displayName: string;
  megaStoneId: string;
  abilityId?: string | null;
  abilityName?: string | null;
  pdfName: string;
};

export type RulesRecord = {
  regulation: Regulation;
  dataVersion: string;
  enabledGimmicks: string[];
  statPoints: {
    totalMax: number;
    perStatMax: number;
  };
  speciesClause: "nationalDexNumber";
  itemClause: boolean;
  teraEnabled: boolean;
  source: string;
};
