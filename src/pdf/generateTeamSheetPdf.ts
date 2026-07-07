import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from "pdf-lib";
import { abilitiesById, itemsById, movesById, speciesById, statAlignmentsById } from "../domain/regulationData";
import { normalizePokemonStats, statRows } from "../domain/stats";
import type { PokemonEntry, TeamSheet } from "../domain/teamTypes";
import { opponentSlots, pageSize, playerCoordinates, staffSlots, type SlotCoordinates } from "./pdfCoordinates";

const TEMPLATE_PATH = `${import.meta.env.BASE_URL}templates/pokemon-vg-team-list.pdf`;
export type TeamSheetPdfType = "both" | "open" | "staff";

const loadTemplate = async (): Promise<PDFDocument> => {
  try {
    const response = await fetch(TEMPLATE_PATH);
    if (!response.ok) throw new Error(`Template returned ${response.status}`);
    const bytes = await response.arrayBuffer();
    return PDFDocument.load(bytes);
  } catch {
    const fallback = await PDFDocument.create();
    fallback.addPage([pageSize.width, pageSize.height]);
    fallback.addPage([pageSize.width, pageSize.height]);
    return fallback;
  }
};

const cleanText = (value: string | null | undefined): string =>
  (value ?? "").replace(/\s+/g, " ").replace(/[^\S\r\n]+/g, " ").trim();

const dateParts = (value: string | null | undefined): [string, string, string] => {
  const digits = cleanText(value).replace(/\D/g, "");
  if (digits.length === 6) return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)];
  if (digits.length === 8) return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)];
  return ["", "", ""];
};

const drawFittedText = (
  page: PDFPage,
  font: PDFFont,
  text: string | null | undefined,
  x: number,
  y: number,
  maxWidth: number,
  size = 10
) => {
  const safeText = cleanText(text);
  if (!safeText) return;

  let fontSize = size;
  while (fontSize > 7 && font.widthOfTextAtSize(safeText, fontSize) > maxWidth) {
    fontSize -= 0.5;
  }

  page.drawText(safeText, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
    maxWidth
  });
};

const drawCenteredFittedText = (
  page: PDFPage,
  font: PDFFont,
  text: string | null | undefined,
  centerX: number,
  y: number,
  maxWidth: number,
  size = 10
) => {
  const safeText = cleanText(text);
  if (!safeText) return;

  let fontSize = size;
  while (fontSize > 7 && font.widthOfTextAtSize(safeText, fontSize) > maxWidth) {
    fontSize -= 0.5;
  }

  const width = font.widthOfTextAtSize(safeText, fontSize);
  page.drawText(safeText, {
    x: centerX - width / 2,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
    maxWidth
  });
};

const displaySpecies = (entry: PokemonEntry): string => {
  const species = speciesById.get(entry.speciesId ?? "");
  return species?.pdfName ?? entry.displayName;
};

const displayAbility = (entry: PokemonEntry): string => abilitiesById.get(entry.abilityId ?? "")?.displayName ?? "";
const displayItem = (entry: PokemonEntry): string => itemsById.get(entry.itemId ?? "")?.displayName ?? "";
const displayMove = (moveId: string | null): string => movesById.get(moveId ?? "")?.displayName ?? "";
const displayStatAlignment = (entry: PokemonEntry): string =>
  statAlignmentsById.get(entry.statAlignment.value ?? "")?.displayName ?? "";

const drawPlayerInfo = (page: PDFPage, font: PDFFont, teamSheet: TeamSheet, includePrivateFields: boolean) => {
  const player = teamSheet.player;
  drawFittedText(page, font, player.name, playerCoordinates.playerName.x, playerCoordinates.playerName.y, playerCoordinates.playerName.maxWidth, 11);
  drawFittedText(
    page,
    font,
    player.trainerName,
    playerCoordinates.trainerName.x,
    playerCoordinates.trainerName.y,
    playerCoordinates.trainerName.maxWidth,
    11
  );
  drawFittedText(page, font, player.teamName, playerCoordinates.teamName.x, playerCoordinates.teamName.y, playerCoordinates.teamName.maxWidth, 11);
  drawFittedText(
    page,
    font,
    player.switchProfileName,
    playerCoordinates.switchProfileName.x,
    playerCoordinates.switchProfileName.y,
    playerCoordinates.switchProfileName.maxWidth,
    11
  );

  if (player.division) {
    const point = playerCoordinates.division[player.division];
    drawCenteredFittedText(page, font, "X", point.centerX, point.y, 12, 11);
  }

  if (!includePrivateFields) return;
  drawFittedText(page, font, player.playerId, playerCoordinates.playerId.x, playerCoordinates.playerId.y, playerCoordinates.playerId.maxWidth, 11);
  const [month, day, year] = dateParts(player.dateOfBirth);
  drawCenteredFittedText(
    page,
    font,
    month,
    playerCoordinates.dateOfBirth.month.centerX,
    playerCoordinates.dateOfBirth.month.y,
    playerCoordinates.dateOfBirth.month.maxWidth,
    11
  );
  drawCenteredFittedText(
    page,
    font,
    day,
    playerCoordinates.dateOfBirth.day.centerX,
    playerCoordinates.dateOfBirth.day.y,
    playerCoordinates.dateOfBirth.day.maxWidth,
    11
  );
  drawFittedText(page, font, year, playerCoordinates.dateOfBirth.year.x, playerCoordinates.dateOfBirth.year.y, playerCoordinates.dateOfBirth.year.maxWidth, 11);
  drawFittedText(page, font, player.supportId, playerCoordinates.supportId.x, playerCoordinates.supportId.y, playerCoordinates.supportId.maxWidth, 11);
};

const drawSlot = (page: PDFPage, font: PDFFont, entry: PokemonEntry, coordinates: SlotCoordinates) => {
  const stats = normalizePokemonStats(entry.stats);
  drawFittedText(page, font, displaySpecies(entry), coordinates.valueX, coordinates.y.species, coordinates.maxSpeciesWidth, 12);
  drawFittedText(
    page,
    font,
    displayStatAlignment(entry),
    coordinates.valueX,
    coordinates.y.statAlignment,
    coordinates.maxMainWidth,
    11
  );
  drawFittedText(page, font, displayAbility(entry), coordinates.valueX, coordinates.y.ability, coordinates.maxMainWidth, 11);
  drawFittedText(page, font, displayItem(entry), coordinates.valueX, coordinates.y.item, coordinates.maxMainWidth, 11);
  entry.moves.forEach((moveId, index) => {
    drawFittedText(page, font, displayMove(moveId), coordinates.valueX, coordinates.y.moves[index], coordinates.maxMainWidth, 11);
  });
  if (coordinates.statX !== undefined) {
    const statX = coordinates.statX;
    const statY = [
      coordinates.y.ability,
      coordinates.y.item,
      coordinates.y.moves[0],
      coordinates.y.moves[1],
      coordinates.y.moves[2],
      coordinates.y.moves[3]
    ];
    statRows.forEach((stat, index) => {
      drawCenteredFittedText(page, font, stats[stat.key], statX + 26, statY[index], 28, 10);
    });
  }
};

export async function generateTeamSheetPdf(teamSheet: TeamSheet, sheetType: TeamSheetPdfType = "both"): Promise<Blob> {
  const pdfDoc = await loadTemplate();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  while (pdfDoc.getPageCount() < 2) {
    pdfDoc.addPage([pageSize.width, pageSize.height]);
  }

  if (sheetType === "staff" || sheetType === "both") {
    const staffPage = pdfDoc.getPage(0);
    drawPlayerInfo(staffPage, font, teamSheet, true);
    teamSheet.pokemon.forEach((entry, index) => {
      drawSlot(staffPage, font, entry, staffSlots[index]);
    });
  }

  if (sheetType === "open" || sheetType === "both") {
    const opponentPage = pdfDoc.getPage(1);
    drawPlayerInfo(opponentPage, font, teamSheet, false);
    teamSheet.pokemon.forEach((entry, index) => {
      drawSlot(opponentPage, font, entry, opponentSlots[index]);
    });
  }

  if (sheetType === "staff") {
    for (let pageIndex = pdfDoc.getPageCount() - 1; pageIndex > 0; pageIndex -= 1) {
      pdfDoc.removePage(pageIndex);
    }
  } else if (sheetType === "open") {
    pdfDoc.removePage(0);
    for (let pageIndex = pdfDoc.getPageCount() - 1; pageIndex > 0; pageIndex -= 1) {
      pdfDoc.removePage(pageIndex);
    }
  }

  const bytes = await pdfDoc.save();
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  return new Blob([arrayBuffer], { type: "application/pdf" });
}
