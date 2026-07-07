import type { TeamSheet } from "../domain/teamTypes";

export type GeneratePdf = (teamSheet: TeamSheet) => Promise<Blob>;
