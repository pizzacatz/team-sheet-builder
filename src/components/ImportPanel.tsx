import { ChevronDown, ClipboardPaste, X } from "lucide-react";
import { useState } from "react";
import type { ImportIssue } from "../importers/showdown/showdownTypes";
import { parseShowdownPaste } from "../importers/showdown/parseShowdownPaste";
import type { PokemonEntry } from "../domain/teamTypes";

type ImportPanelProps = {
  onImport: (entries: PokemonEntry[]) => void;
};

export function ImportPanel({ onImport }: ImportPanelProps) {
  const [paste, setPaste] = useState("");
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleImport = () => {
    const result = parseShowdownPaste(paste);
    setIssues(result.issues);
    if (result.teamSheet.pokemon?.length) {
      onImport(result.teamSheet.pokemon as PokemonEntry[]);
    }
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
