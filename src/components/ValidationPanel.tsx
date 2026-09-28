import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import { useEffect, useState } from "react";
import type { ValidationIssue } from "../domain/validationTypes";
import type { ValidationResult } from "../domain/validationTypes";
import { SECTIONS, fieldIdForPath, inlineMessage, scrollToIssueField, sectionForPath, sectionLabel } from "./validationFields";

type ValidationPanelProps = {
  validation: ValidationResult;
  // The issues the form is currently showing; the panel lists exactly these.
  visibleIssues: ValidationIssue[];
  // Bumps whenever a blocked download/share attempt should force the list open.
  expandSignal?: number;
  // Untouched form: show a neutral "Not started" summary instead of errors.
  pristine?: boolean;
};

const IssueRow = ({ issue }: { issue: ValidationIssue }) => {
  const targetId = fieldIdForPath(issue.path);
  const className = `issue ${issue.severity}${targetId ? " issue-action" : ""}`;
  const text = inlineMessage(issue.message);

  if (!targetId) {
    return (
      <div className={className}>
        <span>{text}</span>
      </div>
    );
  }

  return (
    <button type="button" className={className} onClick={() => scrollToIssueField(issue.path)} aria-label={`${issue.message} Go to field.`}>
      <span>{text}</span>
    </button>
  );
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function ValidationPanel({ validation, visibleIssues, expandSignal, pristine = false }: ValidationPanelProps) {
  const errors = visibleIssues.filter((issue) => issue.severity === "error");
  const warnings = visibleIssues.filter((issue) => issue.severity === "warning");
  const hasIssues = !pristine && visibleIssues.length > 0;
  const hasErrors = !pristine && errors.length > 0;
  const inProgress = !pristine && !validation.isValid;
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!hasIssues) {
      setIsExpanded(false);
    }
  }, [hasIssues]);

  useEffect(() => {
    if (expandSignal) setIsExpanded(true);
  }, [expandSignal]);

  // Auto-expand the full list on desktop when errors appear. On mobile we leave
  // it collapsed so the tray stays small; a blocked download expands it.
  useEffect(() => {
    if (!hasErrors) return;
    if (window.matchMedia("(min-width: 761px)").matches) setIsExpanded(true);
  }, [hasErrors]);

  // Grouped by section in form order, errors before warnings within each.
  const groups = SECTIONS.map((section) => ({
    section,
    issues: [...errors, ...warnings].filter((issue) => sectionForPath(issue.path) === section)
  })).filter((group) => group.issues.length > 0);

  const summaryClassName = `section-heading validation-summary${hasIssues ? " validation-summary-button" : ""}`;
  const summaryContent = (
    <>
      <h2 id="validation-heading">Validation</h2>
      <span className="status-pill-group">
        {pristine ? (
          <span className="status-pill pending">
            <CircleDashed size={16} />
            Not started
          </span>
        ) : hasErrors ? (
          <span className="status-pill invalid">
            <AlertTriangle size={16} />
            {plural(errors.length, "error")}
          </span>
        ) : inProgress ? (
          <span className="status-pill pending">
            <CircleDashed size={16} />
            In progress
          </span>
        ) : (
          <span className="status-pill valid">
            <CheckCircle2 size={16} />
            Ready
          </span>
        )}
        {!pristine && warnings.length ? <span className="status-pill warning">{plural(warnings.length, "warning")}</span> : null}
      </span>
    </>
  );

  const emptyText = pristine
    ? "Complete team data will be checked here."
    : validation.isValid
      ? "Ready to download."
      : "No problems so far. Empty fields are flagged when you move on, or when you download.";

  return (
    <section
      className={`section-panel validation-panel${hasIssues ? " has-issues" : ""}${hasErrors ? " has-errors" : ""}${isExpanded ? " is-expanded" : ""}`}
      aria-labelledby="validation-heading"
    >
      {hasIssues ? (
        <button
          type="button"
          className={summaryClassName}
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          aria-controls="validation-issue-list"
        >
          {summaryContent}
        </button>
      ) : (
        <div className={summaryClassName}>{summaryContent}</div>
      )}
      {!hasIssues ? (
        <p className="empty-state">{emptyText}</p>
      ) : (
        <div className="issue-list" id="validation-issue-list">
          {groups.map((group) => (
            <div className="issue-group" key={group.section}>
              <h3 className="issue-group-heading">{sectionLabel(group.section)}</h3>
              {group.issues.map((issue, index) => (
                <IssueRow key={`${issue.path}-${issue.code}-${index}`} issue={issue} />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
