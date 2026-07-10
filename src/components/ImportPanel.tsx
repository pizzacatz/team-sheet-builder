import { ChevronDown, ClipboardPaste, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ImportIssue } from "../importers/showdown/showdownTypes";
import { parseShowdownPaste } from "../importers/showdown/parseShowdownPaste";
import type { PokemonEntry } from "../domain/teamTypes";

type ImportPanelProps = {
  onImport: (entries: PokemonEntry[]) => void;
  teamHasData?: boolean;
};

export function ImportPanel({ onImport, teamHasData }: ImportPanelProps) {
  const [paste, setPaste] = useState("");
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const focusOnOpen = useRef(false);

  useEffect(() => {
    if (isOpen && focusOnOpen.current) {
      textareaRef.current?.focus();
      focusOnOpen.current = false;
    }
  }, [isOpen]);

  const openAndFocus = () => {
    if (isOpen) {
      textareaRef.current?.focus();
    } else {
      focusOnOpen.current = true;
      setIsOpen(true);
    }
  };

  // Replaces all six Pokémon, so confirm first when the team already has data.
  const runImport = (text: string) => {
    if (!text.trim()) {
      openAndFocus();
      return;
    }
    if (teamHasData && !window.confirm("Replace the current team with this paste?")) return;
    const result = parseShowdownPaste(text);
    setIssues(result.issues);
    if (result.teamSheet.pokemon?.length) {
      onImport(result.teamSheet.pokemon as PokemonEntry[]);
    }
  };

  const handleImport = () => runImport(paste);

  // One tap: read the clipboard, fill the box, and import. If the browser blocks
  // or has no clipboard read, fall back to opening the box for a manual paste.
  const handlePasteAndImport = async () => {
    if (navigator.clipboard?.readText) {
      try {
        const clip = await navigator.clipboard.readText();
        if (clip.trim()) {
          setPaste(clip);
          runImport(clip);
          return;
        }
      } catch {
        // fall through to manual paste
      }
    }
    openAndFocus();
  };

  return (
    <section className="section-panel import-panel" aria-labelledby="import-heading">
      <div className="section-heading import-heading">
        <button
          type="button"
          className="collapse-button"
          aria-expanded={isOpen}
          aria-controls="showdown-import-body"
          onClick={() => setIsOpen((current) => !current)}
        >
          <ChevronDown size={18} aria-hidden="true" />
          <span id="import-heading">Showdown Import</span>
        </button>
        <div className="heading-actions">
          {!isOpen ? (
            <button type="button" className="import-paste-button" onClick={handlePasteAndImport}>
              <ClipboardPaste size={16} aria-hidden="true" />
              <span>Paste &amp; Import</span>
            </button>
          ) : null}
          {paste.trim() ? <span className="tag">Paste ready</span> : null}
          {issues.length ? (
            <button type="button" className="icon-button" onClick={() => setIssues([])} aria-label="Dismiss import issues">
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>
      {isOpen ? (
        <div id="showdown-import-body" className="collapsible-body">
          <div className="field">
            <label htmlFor="showdown-paste">Paste Export</label>
            <textarea
              ref={textareaRef}
              id="showdown-paste"
              value={paste}
              onChange={(event) => setPaste(event.target.value)}
              rows={9}
              placeholder={"Incineroar @ Safety Goggles\nAbility: Intimidate\nCareful Nature\n- Fake Out"}
            />
          </div>
          <div className="action-row">
            <button type="button" className="primary-action" onClick={handleImport}>
              <ClipboardPaste size={18} />
              Import Paste
            </button>
          </div>
        </div>
      ) : null}
      {issues.length ? (
        <div className="issue-list compact">
          {issues.map((issue, index) => (
            <div key={`${issue.code}-${index}`} className={`issue ${issue.severity}`}>
              <strong>{issue.code}</strong>
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
