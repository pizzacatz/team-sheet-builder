import { ChevronDown, ChevronUp, Download, Eye, Share2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { TeamSheet } from "../domain/teamTypes";
import type { ValidationResult } from "../domain/validationTypes";
import type { TeamSheetPdfType } from "../pdf/generateTeamSheetPdf";

type PdfActionsProps = {
  teamSheet: TeamSheet;
  validation: ValidationResult;
  onClear: () => void;
};

type DownloadType = TeamSheetPdfType;
type GeneratingType = DownloadType | "preview" | "share";
type PdfPreview = {
  url: string;
  sheetType: DownloadType;
};

const filenameFor = (teamSheet: TeamSheet, sheetType: DownloadType) => {
  const player = teamSheet.player.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const suffix = sheetType === "both" ? "both-team-sheets" : `${sheetType}-team-sheet`;
  return `${player || "team"}-${suffix}.pdf`;
};

const shareDetailsFor = (teamSheet: TeamSheet) => {
  const playerName = teamSheet.player.name.trim() || "Player";
  const playerSlug = playerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const description = `${playerName} VGC Team List`;
  return {
    description,
    filename: `${playerSlug || "player"}-vgc-team-list.pdf`
  };
};

export function PdfActions({ teamSheet, validation, onClear }: PdfActionsProps) {
  const [generatingType, setGeneratingType] = useState<GeneratingType | null>(null);
  const [preview, setPreview] = useState<PdfPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);

  useEffect(
    () => () => {
      if (preview) {
        URL.revokeObjectURL(preview.url);
      }
    },
    [preview]
  );

  useEffect(() => {
    try {
      if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") {
        setCanShareFiles(false);
        return;
      }
      const probe = new File([""], "team-sheet.pdf", { type: "application/pdf" });
      setCanShareFiles(navigator.canShare({ files: [probe] }));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  const generatePdfBlob = async (sheetType: DownloadType) => {
    const { generateTeamSheetPdf } = await import("../pdf/generateTeamSheetPdf");
    return generateTeamSheetPdf(teamSheet, sheetType);
  };

  const handleDownload = async (sheetType: DownloadType) => {
    setError(null);
    setGeneratingType(sheetType);
    try {
      const blob = await generatePdfBlob(sheetType);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filenameFor(teamSheet, sheetType);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (pdfError) {
      setError(pdfError instanceof Error ? pdfError.message : "PDF generation failed.");
    } finally {
      setGeneratingType(null);
    }
  };

  const handlePreview = async () => {
    const sheetType: DownloadType = "both";
    setError(null);
    setGeneratingType("preview");
    try {
      const blob = await generatePdfBlob(sheetType);
      const url = URL.createObjectURL(blob);
      setPreview((currentPreview) => {
        if (currentPreview) {
          URL.revokeObjectURL(currentPreview.url);
        }
        return { url, sheetType };
      });
    } catch (pdfError) {
      setError(pdfError instanceof Error ? pdfError.message : "PDF preview failed.");
    } finally {
      setGeneratingType(null);
    }
  };

  const handleShare = async () => {
    setError(null);
    setGeneratingType("share");
    try {
      const blob = await generatePdfBlob("both");
      const { description, filename } = shareDetailsFor(teamSheet);
      const file = new File([blob], filename, { type: "application/pdf" });
      if (!navigator.canShare?.({ files: [file] })) {
        throw new Error("PDF file sharing is not available in this browser.");
      }
      await navigator.share({
        files: [file],
        title: description,
        text: description
      });
    } catch (shareError) {
      if (!(shareError instanceof DOMException && shareError.name === "AbortError")) {
        setError(shareError instanceof Error ? shareError.message : "PDF sharing failed.");
      }
    } finally {
      setGeneratingType(null);
    }
  };

  const closePreview = () => setPreview(null);
  const previewModal = preview ? (
    <div className="pdf-preview-backdrop" role="presentation">
      <section className="pdf-preview-modal" role="dialog" aria-modal="true" aria-labelledby="pdf-preview-heading">
        <div className="pdf-preview-header">
          <h2 id="pdf-preview-heading">PDF Preview</h2>
          <button type="button" className="icon-button" title="Close preview" aria-label="Close preview" onClick={closePreview}>
            <X size={18} />
          </button>
        </div>
        <iframe className="pdf-preview-frame" src={preview.url} title="Both team sheets PDF preview" />
        <div className="pdf-preview-actions">
          <a className="primary-action" href={preview.url} download={filenameFor(teamSheet, preview.sheetType)}>
            <Download size={18} />
            <span className="action-label">Download Previewed PDF</span>
          </a>
          <button type="button" className="secondary-action" onClick={closePreview}>
            Close
          </button>
        </div>
      </section>
    </div>
  ) : null;

  return (
    <>
      <section className={`actions-panel${isExpanded ? " is-expanded" : ""}`} aria-label="PDF actions">
        <div className="actions-compact-row">
          <button type="button" className="primary-action" disabled={!validation.isValid || Boolean(generatingType)} onClick={() => handleDownload("both")}>
            <Download size={18} />
            <span className="action-label">{generatingType === "both" ? "Generating..." : "Both Team Sheets"}</span>
          </button>
          <button type="button" className="secondary-action preview-action" disabled={!validation.isValid || Boolean(generatingType)} onClick={handlePreview}>
            <Eye size={18} />
            <span className="action-label">{generatingType === "preview" ? "Generating..." : "Preview PDF"}</span>
          </button>
          <button
            type="button"
            className="icon-button actions-expand-toggle"
            aria-controls="pdf-actions-expanded"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse PDF actions" : "Expand PDF actions"}
            title={isExpanded ? "Collapse actions" : "More actions"}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? <ChevronDown size={19} /> : <ChevronUp size={19} />}
          </button>
        </div>
        <div className="actions-expanded-row" id="pdf-actions-expanded">
          {canShareFiles ? (
            <button type="button" className="secondary-action" disabled={!validation.isValid || Boolean(generatingType)} onClick={handleShare}>
              <Share2 size={18} />
              <span className="action-label">{generatingType === "share" ? "Generating..." : "Share Team Sheets"}</span>
            </button>
          ) : null}
          <button type="button" className="primary-action" disabled={!validation.isValid || Boolean(generatingType)} onClick={() => handleDownload("open")}>
            <Download size={18} />
            <span className="action-label">{generatingType === "open" ? "Generating..." : "Open Team Sheet"}</span>
          </button>
          <button type="button" className="primary-action" disabled={!validation.isValid || Boolean(generatingType)} onClick={() => handleDownload("staff")}>
            <Download size={18} />
            <span className="action-label">{generatingType === "staff" ? "Generating..." : "Staff Team Sheet"}</span>
          </button>
          <button type="button" className="secondary-action clear-team-action" onClick={onClear}>
            <Trash2 size={18} />
            <span className="action-label">Clear Team</span>
          </button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
      </section>
      {previewModal ? createPortal(previewModal, document.body) : null}
    </>
  );
}
