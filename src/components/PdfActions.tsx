import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import type { TeamSheet } from "../domain/teamTypes";
import type { ValidationResult } from "../domain/validationTypes";
import { generateTeamSheetPdf, type TeamSheetPdfType } from "../pdf/generateTeamSheetPdf";

type PdfActionsProps = {
  teamSheet: TeamSheet;
  validation: ValidationResult;
  onClear: () => void;
};

type DownloadType = TeamSheetPdfType;

const filenameFor = (teamSheet: TeamSheet, sheetType: DownloadType) => {
  const player = teamSheet.player.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const suffix = sheetType === "both" ? "both-team-sheets" : `${sheetType}-team-sheet`;
  return `${player || "team"}-${suffix}.pdf`;
};

export function PdfActions({ teamSheet, validation, onClear }: PdfActionsProps) {
  const [generatingType, setGeneratingType] = useState<DownloadType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (sheetType: DownloadType) => {
    setError(null);
    setGeneratingType(sheetType);
    try {
      const blob = await generateTeamSheetPdf(teamSheet, sheetType);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filenameFor(teamSheet, sheetType);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (pdfError) {
      setError(pdfError instanceof Error ? pdfError.message : "PDF generation failed.");
    } finally {
      setGeneratingType(null);
    }
  };

  return (
    <section className="actions-panel" aria-label="PDF actions">
      <button type="button" className="primary-action" disabled={!validation.isValid || Boolean(generatingType)} onClick={() => handleGenerate("open")}>
        <Download size={18} />
        {generatingType === "open" ? "Generating..." : "Open Team Sheet"}
      </button>
      <button type="button" className="primary-action" disabled={!validation.isValid || Boolean(generatingType)} onClick={() => handleGenerate("staff")}>
        <Download size={18} />
        {generatingType === "staff" ? "Generating..." : "Staff Team Sheet"}
      </button>
      <button type="button" className="primary-action" disabled={!validation.isValid || Boolean(generatingType)} onClick={() => handleGenerate("both")}>
        <Download size={18} />
        {generatingType === "both" ? "Generating..." : "Both Team Sheets"}
      </button>
      <button type="button" className="secondary-action" onClick={onClear}>
        <Trash2 size={18} />
        Clear Team
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
