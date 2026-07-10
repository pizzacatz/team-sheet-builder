export type ValidationResult = {
  isValid: boolean;
  issues: ValidationIssue[];
};

export type ValidationIssue = {
  severity: "error" | "warning";
  path: string;
  code: string;
  message: string;
  // Extra field paths to highlight alongside `path` (e.g. the raised/lowered
  // stats for an alignment issue).
  relatedFields?: string[];
};
