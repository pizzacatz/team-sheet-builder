import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import type { TeamSheet } from "../domain/teamTypes";
import type { ValidationResult } from "../domain/validationTypes";
import { generateTeamSheetPdf } from "../pdf/generateTeamSheetPdf";

type PdfActionsProps = {
  teamSheet: TeamSheet;
  validation: ValidationResult;
  onClear: () => void;
};

const filenameFor = (teamSheet: TeamSheet) => {
  const player = teamSheet.player.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${player || "team"}-vg-team-list.pdf`;
};

export function PdfActions({ teamSheet, validation, onClear }: PdfActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    try {
      const blob = await generateTeamSheetPdf(teamSheet);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filenameFor(teamSheet);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (pdfError) {
      setError(pdfError instanceof Error ? pdfError.message : "PDF generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="actions-panel" aria-label="PDF actions">
      <button type="button" className="primary-action" disabled={!validation.isValid || isGenerating} onClick={handleGenerate}>
        <Download size={18} />
        {isGenerating ? "Generating..." : "Download PDF"}
      </button>
      <button type="button" className="secondary-action" onClick={onClear}>
        <Trash2 size={18} />
        Clear Team
      </button>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
