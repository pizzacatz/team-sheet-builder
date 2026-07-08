import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generateTeamSheetPdf } from "../pdf/generateTeamSheetPdf";
import { makeValidTeamSheet } from "./fixtures";

const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> =>
  new Promise((resolveBuffer, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolveBuffer(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
  });

describe("generateTeamSheetPdf", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a non-empty PDF Blob", async () => {
    const blob = await generateTeamSheetPdf(makeValidTeamSheet());
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(500);
  });

  it("draws onto the bundled team-list template when it is available", async () => {
    const template = await readFile(resolve(process.cwd(), "public/templates/pokemon-vg-team-list.pdf"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(template, { status: 200, headers: { "content-type": "application/pdf" } }))
    );

    const blob = await generateTeamSheetPdf(makeValidTeamSheet());
    const generated = await PDFDocument.load(await blobToArrayBuffer(blob));
    // staff sheet + open sheet + appended QR data page
    expect(generated.getPageCount()).toBe(3);
    expect(blob.size).toBeGreaterThan(200_000);
  });

  it("can export separate open and staff team sheets", async () => {
    const template = await readFile(resolve(process.cwd(), "public/templates/pokemon-vg-team-list.pdf"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(template, { status: 200, headers: { "content-type": "application/pdf" } }))
    );

    const openBlob = await generateTeamSheetPdf(makeValidTeamSheet(), "open");
    const staffBlob = await generateTeamSheetPdf(makeValidTeamSheet(), "staff");
    const openPdf = await PDFDocument.load(await blobToArrayBuffer(openBlob));
    const staffPdf = await PDFDocument.load(await blobToArrayBuffer(staffBlob));

    // open stays a single page; staff gains the appended QR data page
    expect(openPdf.getPageCount()).toBe(1);
    expect(staffPdf.getPageCount()).toBe(2);
    expect(openBlob.size).toBeGreaterThan(100_000);
    expect(staffBlob.size).toBeGreaterThan(100_000);
  });

  it("does not throw for long common names", async () => {
    const team = makeValidTeamSheet();
    team.player.name = "A Very Long Player Name That Still Needs To Fit";
    team.pokemon[0].displayName = "Tauros-Paldea-Aqua";
    const blob = await generateTeamSheetPdf(team);
    expect(blob.size).toBeGreaterThan(500);
  });
});
