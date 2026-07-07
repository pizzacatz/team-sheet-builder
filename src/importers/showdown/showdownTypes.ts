import type { TeamSheet } from "../../domain/teamTypes";

export type ImportResult = {
  teamSheet: Partial<TeamSheet>;
  issues: ImportIssue[];
};

export type ImportIssue = {
  severity: "error" | "warning";
  pokemonIndex?: number;
  field?: string;
  code: string;
  message: string;
};
