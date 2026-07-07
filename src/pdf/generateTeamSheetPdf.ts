import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from "pdf-lib";
import { abilitiesById, itemsById, movesById, speciesById, statAlignmentsById } from "../domain/regulationData";
import { normalizePokemonStats, statRows } from "../domain/stats";
import type { PokemonEntry, TeamSheet } from "../domain/teamTypes";
import { opponentSlots, pageSize, playerCoordinates, staffSlots, type SlotCoordinates } from "./pdfCoordinates";

const TEMPLATE_PATH = `${import.meta.env.BASE_URL}templates/pokemon-vg-team-list.pdf`;

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
  while (fontSize > 6 && font.widthOfTextAtSize(safeText, fontSize) > maxWidth) {
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
  drawFittedText(page, font, player.name, playerCoordinates.playerName.x, playerCoordinates.playerName.y, playerCoordinates.playerName.maxWidth, 10);
  drawFittedText(
    page,
    font,
    player.trainerName,
    playerCoordinates.trainerName.x,
    playerCoordinates.trainerName.y,
    playerCoordinates.trainerName.maxWidth,
    10
  );
  drawFittedText(page, font, player.teamName, playerCoordinates.teamName.x, playerCoordinates.teamName.y, playerCoordinates.teamName.maxWidth, 10);
  drawFittedText(
    page,
    font,
    player.switchProfileName,
    playerCoordinates.switchProfileName.x,
    playerCoordinates.switchProfileName.y,
    playerCoordinates.switchProfileName.maxWidth,
    10
  );

  if (player.division) {
    const point = playerCoordinates.division[player.division];
    page.drawText("X", { x: point.x, y: point.y, size: 11, font, color: rgb(0, 0, 0) });
  }

  if (!includePrivateFields) return;
  drawFittedText(page, font, player.playerId, playerCoordinates.playerId.x, playerCoordinates.playerId.y, playerCoordinates.playerId.maxWidth, 10);
  drawFittedText(
    page,
    font,
    player.dateOfBirth,
    playerCoordinates.dateOfBirth.x,
    playerCoordinates.dateOfBirth.y,
    playerCoordinates.dateOfBirth.maxWidth,
    10
  );
  drawFittedText(page, font, player.supportId, playerCoordinates.supportId.x, playerCoordinates.supportId.y, playerCoordinates.supportId.maxWidth, 10);
};

const drawSlot = (page: PDFPage, font: PDFFont, entry: PokemonEntry, coordinates: SlotCoordinates) => {
  const stats = normalizePokemonStats(entry.stats);
  drawFittedText(page, font, displaySpecies(entry), coordinates.valueX, coordinates.y.species, coordinates.maxSpeciesWidth, 10);
  drawFittedText(
    page,
    font,
    displayStatAlignment(entry),
    coordinates.valueX,
    coordinates.y.statAlignment,
    coordinates.maxMainWidth,
    8
  );
  drawFittedText(page, font, displayAbility(entry), coordinates.valueX, coordinates.y.ability, coordinates.maxMainWidth, 9);
  drawFittedText(page, font, displayItem(entry), coordinates.valueX, coordinates.y.item, coordinates.maxMainWidth, 9);
  entry.moves.forEach((moveId, index) => {
    drawFittedText(page, font, displayMove(moveId), coordinates.valueX, coordinates.y.moves[index], coordinates.maxMainWidth, 9);
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
      drawFittedText(page, font, stats[stat.key], statX + 18, statY[index], 26, 8);
    });
  }
};

export async function generateTeamSheetPdf(teamSheet: TeamSheet): Promise<Blob> {
  const pdfDoc = await loadTemplate();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  while (pdfDoc.getPageCount() < 2) {
    pdfDoc.addPage([pageSize.width, pageSize.height]);
  }

  const staffPage = pdfDoc.getPage(0);
  const opponentPage = pdfDoc.getPage(1);

  drawPlayerInfo(staffPage, font, teamSheet, true);
  drawPlayerInfo(opponentPage, font, teamSheet, false);

  teamSheet.pokemon.forEach((entry, index) => {
    drawSlot(staffPage, font, entry, staffSlots[index]);
    drawSlot(opponentPage, font, entry, opponentSlots[index]);
  });

  const bytes = await pdfDoc.save();
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  return new Blob([arrayBuffer], { type: "application/pdf" });
}
