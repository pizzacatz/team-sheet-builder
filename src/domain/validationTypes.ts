export type ValidationResult = {
  isValid: boolean;
  issues: ValidationIssue[];
};

export type ValidationIssue = {
  severity: "error" | "warning";
  path: string;
  code: string;
  message: string;
};
