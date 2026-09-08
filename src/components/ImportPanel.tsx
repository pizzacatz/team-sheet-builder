import { ChevronDown, ClipboardPaste, Search, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ImportIssue } from "../importers/showdown/showdownTypes";
import { parseShowdownPaste } from "../importers/showdown/parseShowdownPaste";
import {
  ReplicaLookupError,
  fetchReplicaPaste,
  isReplicaLookupEnabled,
  normalizeReplicaId,
} from "../importers/replica/fetchReplicaPaste";
import type { PokemonEntry } from "../domain/teamTypes";

type ImportPanelProps = {
  onImport: (entries: PokemonEntry[]) => void;
  teamHasData?: boolean;
};

export function ImportPanel({ onImport, teamHasData }: ImportPanelProps) {
  const [paste, setPaste] = useState("");
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [replicaId, setReplicaId] = useState("");
  const [replicaError, setReplicaError] = useState("");
  const [replicaBusy, setReplicaBusy] = useState(false);
  const replicaEnabled = isReplicaLookupEnabled();
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

  // Clears the paste box and any import issues. Does not touch the built team.
  const handleClear = () => {
    setPaste("");
    setIssues([]);
    setReplicaId("");
    setReplicaError("");
  };

  // One button, both flows: if the field has an ID, use it; otherwise read the
  // clipboard, fill the field, and use that. Then fetch the Replica Team through
  // the viewer and import the resulting paste via the normal path. If the
  // browser blocks clipboard reading, prompt for a manual entry instead.
  const handleReplicaLookup = async () => {
    if (replicaBusy) return;
    setReplicaError("");
    let id = replicaId.trim();
    if (!id && navigator.clipboard?.readText) {
      try {
        const clip = await navigator.clipboard.readText();
        id = normalizeReplicaId(clip);
        if (id) setReplicaId(id);
      } catch {
        // clipboard blocked/unavailable; fall through to the empty-field message
      }
    }
    if (!id) {
      setReplicaError("Enter a Replica Team ID, or copy one to your clipboard first.");
      return;
    }
    setReplicaBusy(true);
    try {
      const fetched = await fetchReplicaPaste(id);
      setPaste(fetched);
      runImport(fetched);
    } catch (error) {
      setReplicaError(
        error instanceof ReplicaLookupError ? error.message : "Replica lookup failed. Try again."
      );
    } finally {
      setReplicaBusy(false);
    }
  };

  // One button, both flows: if the box already has text, import that; otherwise
  // read the clipboard, fill the box, and import in a single tap. If the browser
  // blocks or has no clipboard read, fall back to opening the box for manual paste.
  const handlePasteAndImport = async () => {
    if (paste.trim()) {
      runImport(paste);
      return;
    }
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
          {issues.length ? (
            <button type="button" className="icon-button" onClick={() => setIssues([])} aria-label="Dismiss import issues">
              <X size={16} />
            </button>
          ) : null}
          <button
            type="button"
            className="icon-button import-clear-button"
            title="Clear import"
            aria-label="Clear import"
            onClick={handleClear}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
      {isOpen ? (
        <div id="showdown-import-body" className="collapsible-body">
          {replicaEnabled ? (
            <div className="replica-lookup">
              <div className="field replica-field">
                <label htmlFor="replica-team-id">Replica Team ID</label>
                <input
                  id="replica-team-id"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={12}
                  placeholder="e.g. 442E6DPRET"
                  value={replicaId}
                  onChange={(event) => {
                    setReplicaId(normalizeReplicaId(event.target.value));
                    if (replicaError) setReplicaError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleReplicaLookup();
                    }
                  }}
                  aria-invalid={replicaError ? true : undefined}
                  aria-describedby={replicaError ? "replica-team-id-error" : undefined}
                />
              </div>
              <button
                type="button"
                className="primary-action replica-fetch-button"
                onClick={() => void handleReplicaLookup()}
                disabled={replicaBusy}
                title="Uses the field if filled, otherwise reads a code from your clipboard"
              >
                <Search size={18} aria-hidden="true" />
                {replicaBusy ? "Fetching…" : "Fetch & Import"}
              </button>
              {replicaError ? (
                <p id="replica-team-id-error" className="replica-error" role="alert">
                  {replicaError}
                </p>
              ) : null}
            </div>
          ) : null}
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
            <button type="button" className="primary-action" onClick={handlePasteAndImport}>
              <ClipboardPaste size={18} />
              Paste &amp; Import
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
