import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ValidationIssue } from "../domain/validationTypes";
import type { ValidationResult } from "../domain/validationTypes";

type ValidationPanelProps = {
  validation: ValidationResult;
};

const fieldIdForPath = (path: string): string | null => {
  if (path === "player.name") return "player-name";
  if (path === "player.trainerName") return "trainer-name";
  if (path === "player.division") return "age-division-field";
  if (path === "player.playerId") return "player-id";

  const pokemonMatch = path.match(/^pokemon\.(\d+)\.([^.]+)(?:\.(\d+))?/);
  if (!pokemonMatch) return null;

  const [, pokemonIndex, field, childIndex] = pokemonMatch;
  if (field === "speciesId") return `pokemon-${pokemonIndex}-species`;
  if (field === "abilityId") return `pokemon-${pokemonIndex}-ability`;
  if (field === "itemId") return `pokemon-${pokemonIndex}-item`;
  if (field === "statAlignment") return `pokemon-${pokemonIndex}-stat-alignment`;
  if (field === "moves" && childIndex !== undefined) return `pokemon-${pokemonIndex}-move-${childIndex}`;
  if (field === "stats" && childIndex !== undefined) return `pokemon-${pokemonIndex}-${childIndex}`;

  return null;
};

const scrollToIssueField = (path: string) => {
  const fieldId = fieldIdForPath(path);
  if (!fieldId) return;

  const element = document.getElementById(fieldId);
  if (!element) return;

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    if (element instanceof HTMLElement) {
      element.focus({ preventScroll: true });
    }
  }, 250);
};

const IssueRow = ({ issue, index }: { issue: ValidationIssue; index: number }) => {
  const targetId = fieldIdForPath(issue.path);
  const className = `issue ${issue.severity}${targetId ? " issue-action" : ""}`;

  if (!targetId) {
    return (
      <div key={`${issue.path}-${issue.code}-${index}`} className={className}>
        <strong>{issue.code}</strong>
        <span>{issue.message}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      key={`${issue.path}-${issue.code}-${index}`}
      className={className}
      onClick={() => scrollToIssueField(issue.path)}
      aria-label={`${issue.message} Go to field.`}
    >
      <strong>{issue.code}</strong>
      <span>{issue.message}</span>
    </button>
  );
};

export function ValidationPanel({ validation }: ValidationPanelProps) {
  const errors = validation.issues.filter((issue) => issue.severity === "error");
  const warnings = validation.issues.filter((issue) => issue.severity === "warning");

  return (
    <section className="section-panel validation-panel" aria-labelledby="validation-heading">
      <div className="section-heading">
        <h2 id="validation-heading">Validation</h2>
        <span className={`status-pill ${validation.isValid ? "valid" : "invalid"}`}>
          {validation.isValid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {validation.isValid ? "Ready" : `${errors.length} errors`}
        </span>
      </div>
      {validation.issues.length === 0 ? (
        <p className="empty-state">Complete team data will be checked here.</p>
      ) : (
        <div className="issue-list">
          {errors.map((issue, index) => (
            <IssueRow key={`${issue.path}-${issue.code}-${index}`} issue={issue} index={index} />
          ))}
          {warnings.map((issue, index) => (
            <IssueRow key={`${issue.path}-${issue.code}-${index}`} issue={issue} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
