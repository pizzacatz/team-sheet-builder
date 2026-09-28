import { useEffect, useRef, useState } from "react";
import {
  SECTIONS,
  emptyRevealState,
  fieldIdForElement,
  sectionForElement,
  sectionForFieldId,
  type RevealState
} from "../components/validationFields";

/**
 * Tracks what the user has had a fair chance to fill in: fields they've left,
 * started sections they've moved on from, and sections revealed by a blocked
 * download. Clearing a section puts it back to "not started"; a valid sheet
 * turns the download reveal off.
 */
export const useValidationReveal = (sectionHasData: (section: string) => boolean, isValid: boolean) => {
  // Data restored from a previous visit counts as finished.
  const [reveal, setReveal] = useState<RevealState>(() => ({
    ...emptyRevealState(),
    finishedSections: new Set(SECTIONS.filter(sectionHasData))
  }));

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const fieldId = fieldIdForElement(event.target);
      setReveal((current) => (current.focusedField === fieldId ? current : { ...current, focusedField: fieldId }));
    };

    const handleFocusOut = (event: FocusEvent) => {
      const fieldId = fieldIdForElement(event.target);
      const nextFieldId = fieldIdForElement(event.relatedTarget);
      const section = sectionForElement(event.target);
      const nextSection = sectionForElement(event.relatedTarget);
      setReveal((current) => {
        const next = { ...current, focusedField: null };
        // Moving between the DOB parts is still the same field.
        if (fieldId && fieldId !== nextFieldId) next.touchedFields = new Set(current.touchedFields).add(fieldId);
        // Moving on means focus lands in a field of a *different* section.
        // Focus going nowhere (mobile keyboard dismissed, tapping blank space)
        // or to a button (a trash button, the import panel) doesn't count.
        if (section && nextSection && nextFieldId && section !== nextSection) {
          next.finishedSections = new Set(current.finishedSections).add(section);
        }
        return next;
      });
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  // A section that goes from having data to empty (trash button, import) is
  // back to "not started".
  const dataKey = SECTIONS.map((section) => (sectionHasData(section) ? "1" : "0")).join("");
  const previousDataKey = useRef(dataKey);
  useEffect(() => {
    const previous = previousDataKey.current;
    previousDataKey.current = dataKey;
    const cleared = SECTIONS.filter((_, index) => previous[index] === "1" && dataKey[index] === "0");
    if (!cleared.length) return;
    // A completely empty form starts over as "not started".
    if (!dataKey.includes("1")) {
      setReveal(emptyRevealState());
      return;
    }
    setReveal((current) => {
      const drop = (set: Set<string>) => new Set([...set].filter((section) => !cleared.includes(section)));
      return {
        ...current,
        touchedFields: new Set(
          [...current.touchedFields].filter((fieldId) => !cleared.includes(sectionForFieldId(fieldId) ?? ""))
        ),
        finishedSections: drop(current.finishedSections),
        attemptedSections: drop(current.attemptedSections)
      };
    });
  }, [dataKey]);

  // Download mode switches off once the sheet is valid.
  useEffect(() => {
    if (isValid) setReveal((current) => (current.attemptedSections.size ? { ...current, attemptedSections: new Set() } : current));
  }, [isValid]);

  const revealAll = () => setReveal((current) => ({ ...current, attemptedSections: new Set(SECTIONS) }));

  // Imported or shared data counts as finished: show its problems straight away.
  const markFinished = (sections: string[]) =>
    setReveal((current) => ({ ...current, finishedSections: new Set([...current.finishedSections, ...sections]) }));

  return { reveal, revealAll, markFinished };
};
