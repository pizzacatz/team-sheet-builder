import { Link2 } from "lucide-react";
import { useState } from "react";
import { encodeTeamShare } from "../domain/teamShare";
import type { TeamSheet } from "../domain/teamTypes";

type ShareTeamProps = {
  teamSheet: TeamSheet;
};

export function ShareTeam({ teamSheet }: ShareTeamProps) {
  const [includePlayer, setIncludePlayer] = useState(false);
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const linkFor = async () => {
    const encoded = await encodeTeamShare(teamSheet, includePlayer);
    return `${window.location.origin}${window.location.pathname}#t=${encoded}`;
  };

  const handleCopy = async () => {
    try {
      const url = await linkFor();
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      // Clipboard blocked/unsupported — offer the link for manual copy.
      try {
        window.prompt("Copy this team link:", await linkFor());
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    }
  };

  return (
    <section className="section-panel share-team-panel" aria-label="Share team">
      <div className="share-team-row">
        <button type="button" className="secondary-action" onClick={handleCopy}>
          <Link2 size={18} />
          <span>{status === "copied" ? "Link copied!" : "Copy team link"}</span>
        </button>
        <label className="share-include-player">
          <input type="checkbox" checked={includePlayer} onChange={(event) => setIncludePlayer(event.target.checked)} />
          Include player info
        </label>
      </div>
      <p className="share-team-hint">
        {includePlayer
          ? "The link will include your player info (name, ID, date of birth)."
          : "The link contains only your team — no player information."}
      </p>
      {status === "error" ? <p className="error-text">Couldn't create a link.</p> : null}
    </section>
  );
}
