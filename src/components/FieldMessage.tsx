import type { FieldMessage as FieldMessageData } from "./validationFields";

export const fieldMessageId = (fieldId: string) => `${fieldId}-message`;

/** The first (most severe) message for a field, shown under it. */
export function FieldMessage({ fieldId, messages }: { fieldId: string; messages?: FieldMessageData[] }) {
  const message = messages?.[0];
  if (!message) return null;
  return (
    <p id={fieldMessageId(fieldId)} className={`field-message ${message.severity}`}>
      {message.text}
    </p>
  );
}
