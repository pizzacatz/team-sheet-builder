import type { TeamSheet } from "../domain/teamTypes";
import type { TeamSheetPdfType } from "./generateTeamSheetPdf";

export type GeneratePdf = (teamSheet: TeamSheet, sheetType?: TeamSheetPdfType) => Promise<Blob>;
