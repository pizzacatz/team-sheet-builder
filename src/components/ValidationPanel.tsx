import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { ValidationIssue } from "../domain/validationTypes";
import type { ValidationResult } from "../domain/validationTypes";
import { fieldIdForPath, scrollToIssueField } from "./validationFields";

type ValidationPanelProps = {
  validation: ValidationResult;
  // Bumps whenever a blocked download/share attempt should force the list open.
  expandSignal?: number;
};

const PEEK_COUNT = 2;

const IssueRow = ({ issue, index }: { issue: ValidationIssue; index: number }) => {
  const targetId = fieldIdForPath(issue.path);
  const className = `issue ${issue.severity}${targetId ? " issue-action" : ""}`;

  if (!targetId) {
    return (
      <div className={className}>
        <strong>{issue.code}</strong>
        <span>{issue.message}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => scrollToIssueField(issue.path)}
      aria-label={`${issue.message} Go to field.`}
    >
      <strong>{issue.code}</strong>
      <span>{issue.message}</span>
    </button>
  );
};

export function ValidationPanel({ validation, expandSignal }: ValidationPanelProps) {
  const errors = validation.issues.filter((issue) => issue.severity === "error");
  const warnings = validation.issues.filter((issue) => issue.severity === "warning");
  const hasIssues = validation.issues.length > 0;
  const hasErrors = errors.length > 0;
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
  // it collapsed so the compact 2-error peek shows instead of a tall list.
  useEffect(() => {
    if (!hasErrors) return;
    if (window.matchMedia("(min-width: 761px)").matches) setIsExpanded(true);
  }, [hasErrors]);

  const summaryClassName = `section-heading validation-summary${hasIssues ? " validation-summary-button" : ""}`;
  const summaryContent = (
    <>
      <h2 id="validation-heading">Validation</h2>
      <span className="status-pill-group">
        {hasErrors ? (
          <span className="status-pill invalid">
            <AlertTriangle size={16} />
            {`${errors.length} ${errors.length === 1 ? "error" : "errors"}`}
          </span>
        ) : (
          <span className="status-pill valid">
            <CheckCircle2 size={16} />
            {warnings.length ? "No errors" : "Ready"}
          </span>
        )}
        {!hasErrors && warnings.length ? (
          <span className="status-pill warning">{`${warnings.length} ${warnings.length === 1 ? "warning" : "warnings"}`}</span>
        ) : null}
      </span>
    </>
  );

  const peekErrors = errors.slice(0, PEEK_COUNT);
  const hiddenErrorCount = errors.length - peekErrors.length;

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
      {validation.issues.length === 0 ? (
        <p className="empty-state">Complete team data will be checked here.</p>
      ) : (
        <>
          {hasErrors ? (
            <div className="issue-peek" aria-hidden="true">
              {peekErrors.map((issue, index) => (
                <IssueRow key={`peek-${issue.path}-${issue.code}-${index}`} issue={issue} index={index} />
              ))}
              {hiddenErrorCount > 0 ? (
                <p className="issue-peek-more">{`+${hiddenErrorCount} more — tap to expand`}</p>
              ) : null}
            </div>
          ) : null}
          <div className="issue-list" id="validation-issue-list">
            {errors.map((issue, index) => (
              <IssueRow key={`${issue.path}-${issue.code}-${index}`} issue={issue} index={index} />
            ))}
            {warnings.map((issue, index) => (
              <IssueRow key={`${issue.path}-${issue.code}-${index}`} issue={issue} index={index} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
