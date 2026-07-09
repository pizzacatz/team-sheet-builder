import { Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImportPanel } from "../components/ImportPanel";
import { PdfActions } from "../components/PdfActions";
import { PlayerInfoForm } from "../components/PlayerInfoForm";
import { TeamForm } from "../components/TeamForm";
import { ValidationPanel } from "../components/ValidationPanel";
import { collectErrorFieldIds, fieldIdForPath, scrollToIssueField } from "../components/validationFields";
import { rules } from "../domain/regulationData";
import { emptyPokemonEntry } from "../domain/teamTypes";
import { useTeamSheetState } from "../state/useTeamSheetState";
import { mobileFloatingTrayClearancePx } from "./mobileTray";
import "./styles.css";

type ThemeMode = "light" | "dark";
const THEME_STORAGE_KEY = "team-sheet-builder-theme";

const isEditableElement = (element: EventTarget | Element | null): boolean =>
  element instanceof HTMLElement && Boolean(element.closest("input, textarea, select, [contenteditable='true']"));

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export function App() {
  const { teamSheet, validation, updatePlayer, updatePokemon, replacePokemon, reset } = useTeamSheetState();
  const sideColumnRef = useRef<HTMLElement | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [isMobileFieldEditing, setIsMobileFieldEditing] = useState(false);
  const [attemptedDownload, setAttemptedDownload] = useState(false);
  const [expandSignal, setExpandSignal] = useState(0);
  const isDarkMode = theme === "dark";

  const errorFieldIds = useMemo(
    () => collectErrorFieldIds(validation.issues, attemptedDownload),
    [validation.issues, attemptedDownload]
  );

  // Tapping a download/share button while invalid: reveal every error (highlight
  // missing fields too), open the list, and jump to the first problem.
  const handleBlockedAttempt = () => {
    setAttemptedDownload(true);
    setExpandSignal((current) => current + 1);
    const firstError = validation.issues.find((issue) => issue.severity === "error" && fieldIdForPath(issue.path));
    if (firstError) scrollToIssueField(firstError.path);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const element = sideColumnRef.current;
    if (!element) return;

    const updateFloatingTrayClearance = () => {
      const bottom = Number.parseFloat(window.getComputedStyle(element).bottom) || 0;
      const height = element.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--mobile-floating-tray-clearance",
        `${mobileFloatingTrayClearancePx(height, bottom)}px`
      );
    };

    updateFloatingTrayClearance();
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateFloatingTrayClearance);
    resizeObserver?.observe(element);
    window.addEventListener("resize", updateFloatingTrayClearance);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateFloatingTrayClearance);
      document.documentElement.style.removeProperty("--mobile-floating-tray-clearance");
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 760px)");

    const updateFromActiveElement = () => {
      setIsMobileFieldEditing(mediaQuery.matches && isEditableElement(document.activeElement));
    };

    const handleFocusIn = (event: FocusEvent) => {
      setIsMobileFieldEditing(mediaQuery.matches && isEditableElement(event.target));
    };

    const handleFocusOut = () => {
      window.requestAnimationFrame(updateFromActiveElement);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    mediaQuery.addEventListener("change", updateFromActiveElement);
    updateFromActiveElement();

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      mediaQuery.removeEventListener("change", updateFromActiveElement);
    };
  }, []);

  return (
    <main className={`app-shell${isMobileFieldEditing ? " is-mobile-field-editing" : ""}`}>
      <header className="app-header">
        <div className="app-brand">
          <p className="eyebrow">{rules.regulation} · {rules.dataVersion}</p>
          <h1 className="app-title">Video Game Team List</h1>
          <p className="header-subtitle">
            Part of the <a href="https://georgiaplayevents.com/">Georgia Play Events Calendar</a>
            <span className="subtitle-join"> and </span>
            <a href="https://map.georgiaplayevents.com/">Georgia Play Events Map</a>
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDarkMode}
            title={isDarkMode ? "Light mode" : "Dark mode"}
            onClick={() => setTheme(isDarkMode ? "light" : "dark")}
          >
            {isDarkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            <span>{isDarkMode ? "Light" : "Dark"}</span>
          </button>
        </div>
      </header>

      <div className="layout">
        <div className="main-column">
          <ImportPanel onImport={replacePokemon} />
          <PlayerInfoForm player={teamSheet.player} onChange={updatePlayer} errorFieldIds={errorFieldIds} />
          <TeamForm
            pokemon={teamSheet.pokemon}
            onChange={updatePokemon}
            onClear={(index) => updatePokemon(index, emptyPokemonEntry())}
            errorFieldIds={errorFieldIds}
          />
        </div>
        <aside className="side-column" ref={sideColumnRef}>
          <ValidationPanel validation={validation} expandSignal={expandSignal} />
          <PdfActions teamSheet={teamSheet} validation={validation} onClear={reset} onBlockedAttempt={handleBlockedAttempt} />
        </aside>
      </div>
    </main>
  );
}
