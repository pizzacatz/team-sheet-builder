import { AlertTriangle, Download, Mail, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { encodeTeamShare } from "../domain/teamShare";
import type { PlayerInfo, TeamSheet } from "../domain/teamTypes";
import type { ValidationResult } from "../domain/validationTypes";
import type { TeamSheetPdfType } from "../pdf/generateTeamSheetPdf";

type PdfActionsProps = {
  teamSheet: TeamSheet;
  validation: ValidationResult;
  onBlockedAttempt: () => void;
  // True once a download/share attempt has been blocked; reveals the
  // "Download anyway" escape hatch.
  hasBlockedAttempt?: boolean;
};

type DownloadType = TeamSheetPdfType;
type GeneratingType = DownloadType | "share" | "email" | "force";

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
    `Team Name: ${player.teamName ?? ""}`,
    `Player ID: ${player.playerId ?? ""}`,
    `Age Division: ${player.division ?? ""}`,
    `Date of Birth: ${dob}`,
    "",
    "Team sheet (open the link to view and download the official PDF):",
    teamLink
  ];
  return lines.join("\n");
};

export function PdfActions({ teamSheet, validation, onBlockedAttempt, hasBlockedAttempt = false }: PdfActionsProps) {
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

  // Opens the player's mail app with a pre-filled body (player info + the team
  // link) and no recipient. No backend, no send — just a draft the player
  // addresses to their TO.
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
      const subject = `${teamSheet.player.name.trim() || "Player"} — VGC Team List`;
      const body = emailBodyFor(teamSheet.player, teamLink);
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

  // Buttons stay tappable while invalid (a tap reveals the errors); they are only
  // truly disabled while a PDF is generating. `is-muted` styles the blocked state.
  const generating = Boolean(generatingType);
  const mutedClass = validation.isValid ? "" : " is-muted";
  const blockedAria = validation.isValid ? undefined : true;

  return (
    <section className="actions-panel" aria-label="Team sheet actions">
      <div className="actions-row">
        <button
          type="button"
          className={`primary-action${mutedClass}`}
          disabled={generating}
          aria-disabled={blockedAria}
          onClick={() => handleDownload("both")}
        >
          <Download size={18} />
          <span className="action-label">{generatingType === "both" ? "Generating..." : "Download"}</span>
        </button>
        <button
          type="button"
          className={`secondary-action${mutedClass}`}
          disabled={generating}
          aria-disabled={blockedAria}
          title="Email your team sheet to your Tournament Organizer"
          onClick={handleEmail}
        >
          <Mail size={18} />
          <span className="action-label">{generatingType === "email" ? "Preparing..." : "Email to TO"}</span>
        </button>
        {canShareFiles ? (
          <button
            type="button"
            className={`secondary-action${mutedClass}`}
            disabled={generating}
            aria-disabled={blockedAria}
            aria-label="Share team sheets"
            title="Share team sheets"
            onClick={handleShare}
          >
            <Share2 size={18} />
            <span className="action-label">{generatingType === "share" ? "Generating..." : "Share"}</span>
          </button>
        ) : null}
      </div>
      {!validation.isValid && hasBlockedAttempt ? (
        <button
          type="button"
          className="override-action"
          disabled={generating}
          title="Download the combined PDF without fixing the validation errors. The sheet may be rejected at check-in."
          onClick={() => handleDownload("both", true)}
        >
          <AlertTriangle size={16} />
          <span className="action-label">{generatingType === "force" ? "Generating..." : "Download anyway"}</span>
        </button>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
