import { AlertTriangle, Download, Mail, Printer, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppMode } from "../app/appMode";
import { encodeTeamShare } from "../domain/teamShare";
import type { PlayerInfo, TeamSheet } from "../domain/teamTypes";
import type { ValidationResult } from "../domain/validationTypes";
import type { TeamSheetPdfType } from "../pdf/generateTeamSheetPdf";

// Default recipient for the "Email to TO" draft.
const TO_EMAIL = "";

type PdfActionsProps = {
  teamSheet: TeamSheet;
  validation: ValidationResult;
  // Untouched form: hide the "Download anyway" escape hatch until there is
  // something to override.
  pristine?: boolean;
  onBlockedAttempt: () => void;
  // On /ots every action uses the open team sheet only, and Print replaces Email.
  mode?: AppMode;
};

type DownloadType = TeamSheetPdfType;
type GeneratingType = DownloadType | "share" | "email" | "print" | "force";

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

// Readable player-info block plus the team link, for the Email-to-TO draft body.
// The recipient is left blank — the player fills in their TO's address.
const emailBodyFor = (player: PlayerInfo, teamLink: string) => {
  const dob = (player.dateOfBirth ?? "").replace(/-/g, "/");
  const lines = [
    `Player Name: ${player.name ?? ""}`,
    `Trainer Name in Game: ${player.trainerName ?? ""}`,
    `Battle Team Number / Name: ${player.teamName ?? ""}`,
    `Switch Profile Name: ${player.switchProfileName ?? ""}`,
    `Age Division: ${player.division ?? ""}`,
    `Player ID: ${player.playerId ?? ""}`,
    `Date of Birth: ${dob}`,
    `Support ID: ${player.supportId ?? ""}`,
    "",
    "Team sheet (open the link to view and download the official PDF):",
    teamLink
  ];
  return lines.join("\n");
};

export function PdfActions({ teamSheet, validation, pristine, onBlockedAttempt, mode = "full" }: PdfActionsProps) {
  const sheetType: DownloadType = mode === "ots" ? "open" : "both";
  const [generatingType, setGeneratingType] = useState<GeneratingType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canShareFiles, setCanShareFiles] = useState(false);

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

  // `force` skips the validity gate: the "Download anyway" escape hatch for
  // players who want the rule-breaking PDF anyway (e.g. staff asked for it as-is).
  const handleDownload = async (sheetType: DownloadType, force = false) => {
    if (!validation.isValid && !force) {
      onBlockedAttempt();
      return;
    }
    setError(null);
    setGeneratingType(force ? "force" : sheetType);
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

  // Opens the player's mail app with the TO pre-filled as the recipient and a
  // pre-filled body (player info + the team link). No backend, no send — just a
  // draft the player can review and send.
  const handleEmail = async () => {
    if (!validation.isValid) {
      onBlockedAttempt();
      return;
    }
    setError(null);
    setGeneratingType("email");
    try {
      const encoded = await encodeTeamShare(teamSheet, true);
      const teamLink = `${window.location.origin}${window.location.pathname}#t=${encoded}`;
      const subject = `${teamSheet.player.name.trim() || "Player"} - VGC Team List`;
      const body = emailBodyFor(teamSheet.player, teamLink);
      window.location.href = `mailto:${TO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch (emailError) {
      setError(emailError instanceof Error ? emailError.message : "Couldn't open an email draft.");
    } finally {
      setGeneratingType(null);
    }
  };

  const handleShare = async () => {
    if (!validation.isValid) {
      onBlockedAttempt();
      return;
    }
    setError(null);
    setGeneratingType("share");
    try {
      const blob = await generatePdfBlob(sheetType);
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

  // Desktop browsers print a PDF from a hidden frame. Phones mostly can't, so
  // there the PDF opens in a new tab for the system print/share sheet. The tab
  // is opened before the PDF is generated so popup blockers allow it.
  const handlePrint = async () => {
    if (!validation.isValid) {
      onBlockedAttempt();
      return;
    }
    setError(null);
    setGeneratingType("print");
    const isTouch = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const popup = isTouch ? window.open("", "_blank") : null;
    try {
      const blob = await generatePdfBlob(sheetType);
      const url = URL.createObjectURL(blob);
      if (isTouch) {
        if (popup) popup.location.href = url;
        else window.location.href = url;
        return;
      }
      const frame = document.createElement("iframe");
      frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
      frame.src = url;
      frame.onload = () => {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        // The print dialog blocks in most browsers; clean up well after it.
        window.setTimeout(() => {
          frame.remove();
          URL.revokeObjectURL(url);
        }, 60_000);
      };
      document.body.appendChild(frame);
    } catch (printError) {
      popup?.close();
      setError(printError instanceof Error ? printError.message : "Couldn't open the print dialog.");
    } finally {
      setGeneratingType(null);
    }
  };

  // Buttons keep full strength while invalid: a tap reveals the errors, and the
  // Validation status says why. They are only disabled while a PDF generates.
  const generating = Boolean(generatingType);

  return (
    <section className="actions-panel" aria-label="Team sheet actions">
      <div className="actions-row">
        <button
          type="button"
          className="primary-action"
          disabled={generating}
          onClick={() => handleDownload(sheetType)}
        >
          <Download size={18} />
          <span className="action-label">{generatingType === sheetType ? "Generating..." : "Download"}</span>
        </button>
        {mode === "ots" ? (
          <button
            type="button"
            className="secondary-action"
            disabled={generating}
            title="Print the open team sheet"
            onClick={handlePrint}
          >
            <Printer size={18} />
            <span className="action-label">{generatingType === "print" ? "Generating..." : "Print"}</span>
          </button>
        ) : (
        <button
          type="button"
          className="secondary-action"
          disabled={generating}
          title="Email your team sheet to your Tournament Organizer"
          aria-label="Email to TO"
          onClick={handleEmail}
        >
          <Mail size={18} />
          <span className="action-label collapsible-label">{generatingType === "email" ? "Preparing..." : "Email to TO"}</span>
        </button>
        )}
        {canShareFiles ? (
          <button
            type="button"
            className="secondary-action"
            disabled={generating}
            aria-label={mode === "ots" ? "Share open team sheet" : "Share team sheets"}
            title={mode === "ots" ? "Share open team sheet" : "Share team sheets"}
            onClick={handleShare}
          >
            <Share2 size={18} />
            <span className="action-label">{generatingType === "share" ? "Generating..." : "Share"}</span>
          </button>
        ) : null}
      </div>
      {!validation.isValid && !pristine ? (
        <button
          type="button"
          className="override-action"
          disabled={generating}
          title="Download the PDF without fixing the validation errors. The sheet may be rejected at check-in."
          onClick={() => handleDownload(sheetType, true)}
        >
          <AlertTriangle size={16} aria-hidden="true" />
          <span className="action-label">{generatingType === "force" ? "Generating..." : "Download anyway"}</span>
        </button>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
