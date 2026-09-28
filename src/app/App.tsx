import { Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImportPanel } from "../components/ImportPanel";
import { PdfActions } from "../components/PdfActions";
import { PlayerInfoForm } from "../components/PlayerInfoForm";
import { TeamForm } from "../components/TeamForm";
import { ValidationPanel } from "../components/ValidationPanel";
import { collectFieldFlags, isIssueVisible, scrollToIssueField } from "../components/validationFields";
import { entryHasAnyData } from "../domain/legality";
import { decodeTeamShare } from "../domain/teamShare";
import { rules } from "../domain/regulationData";
import { emptyPokemonEntry, type PokemonEntry } from "../domain/teamTypes";
import { useTeamSheetState } from "../state/useTeamSheetState";
import { useValidationReveal } from "../state/useValidationReveal";
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
  const { teamSheet, validation, updatePlayer, clearPlayer, updatePokemon, replacePokemon } = useTeamSheetState();
  const sideColumnRef = useRef<HTMLElement | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [isMobileFieldEditing, setIsMobileFieldEditing] = useState(false);
  const [expandSignal, setExpandSignal] = useState(0);
  const isDarkMode = theme === "dark";
  const teamHasData = teamSheet.pokemon.some(entryHasAnyData);
  const playerHasData = Object.values(teamSheet.player).some(
    (value) => typeof value === "string" && value.trim().length > 0
  );
  const sectionHasData = (section: string) =>
    section === "player" ? playerHasData : entryHasAnyData(teamSheet.pokemon[Number(section.slice("pokemon-".length))]);
  const { reveal, revealAll, markFinished } = useValidationReveal(sectionHasData, validation.isValid);
  // An untouched form is "not started", not "invalid": the error list and the
  // override button stay hidden until the user edits something or taps an action.
  const isPristine = !reveal.attemptedSections.size && !teamHasData && !playerHasData;

  // One visibility rule feeds both the panel and the field highlights.
  const visibleIssues = validation.issues.filter((issue) => isIssueVisible(issue, reveal, sectionHasData));
  const fieldFlags = collectFieldFlags(visibleIssues);

  // Tapping a download/share button while invalid: reveal every error (highlight
  // missing fields too), open the list, and jump to the first problem.
  const handleBlockedAttempt = () => {
    revealAll();
    setExpandSignal((current) => current + 1);
    const firstError = validation.issues.find((issue) => issue.severity === "error");
    if (firstError) scrollToIssueField(firstError.path);
  };

  const pokemonSections = (entries: PokemonEntry[]) =>
    entries.map((entry, index) => (entryHasAnyData(entry) ? `pokemon-${index}` : "")).filter(Boolean);

  // Clears are one tap (no confirmation), so each offers a short Undo instead.
  const [undo, setUndo] = useState<{ label: string; restore: () => void } | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);
  const offerUndo = (label: string, restore: () => void) => {
    window.clearTimeout(undoTimer.current);
    setUndo({ label, restore });
    undoTimer.current = window.setTimeout(() => setUndo(null), 8000);
  };
  const runUndo = () => {
    window.clearTimeout(undoTimer.current);
    undo?.restore();
    setUndo(null);
  };
  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  const handleClearPlayer = () => {
    const previous = teamSheet.player;
    clearPlayer();
    if (!playerHasData) return;
    offerUndo("Player Info cleared.", () => {
      updatePlayer(previous);
      markFinished(["player"]);
    });
  };

  const handleClearSlot = (index: number) => {
    const previous = teamSheet.pokemon[index];
    updatePokemon(index, emptyPokemonEntry());
    if (!entryHasAnyData(previous)) return;
    offerUndo(`Pokémon ${index + 1} cleared.`, () => {
      updatePokemon(index, previous);
      markFinished([`pokemon-${index}`]);
    });
  };

  const handleImport = (entries: PokemonEntry[]) => {
    replacePokemon(entries);
    markFinished(pokemonSections(entries));
  };

  // A `#t=` shared-team link loads the encoded team (confirming before it would
  // replace existing data), then clears the hash so a refresh doesn't re-load.
  useEffect(() => {
    const match = window.location.hash.match(/[#&]t=([A-Za-z0-9\-_]+)/);
    if (!match) return;
    let active = true;
    void (async () => {
      const shared = await decodeTeamShare(match[1]);
      if (!active || !shared) return;
      const hasExisting = teamSheet.pokemon.some(entryHasAnyData) || Boolean(teamSheet.player.name?.trim());
      if (hasExisting && !window.confirm("Load the shared team? This replaces your current team.")) return;
      replacePokemon(shared.pokemon);
      if (shared.player) updatePlayer(shared.player);
      markFinished([...pokemonSections(shared.pokemon), ...(shared.player ? ["player"] : [])]);
      // Clear the hash only after loading so a refresh doesn't re-load — and so
      // StrictMode's double-mount doesn't drop the hash before the load runs.
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <a className="brand-logo" href="https://georgiaplayevents.com/" aria-label="GeorgiaPlayEvents.com">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={115} height={144} />
          </a>
          <div className="brand-text">
            <p className="eyebrow" title={`Game data ${rules.dataVersion}`}>
              Regulation {rules.regulation}
            </p>
            <h1 className="app-title">Pokémon Champions Team Sheet Builder</h1>
            <p className="header-subtitle">
              Part of the <a href="https://georgiaplayevents.com/">Georgia Play Events Calendar</a>
              <span className="subtitle-join"> and </span>
              <a href="https://map.georgiaplayevents.com/">Georgia Play Events Map</a>
            </p>
          </div>
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
          <ImportPanel onImport={handleImport} teamHasData={teamHasData} />
          <PlayerInfoForm
            player={teamSheet.player}
            onChange={updatePlayer}
            onClear={handleClearPlayer}
            fieldFlags={fieldFlags}
          />
          <TeamForm
            pokemon={teamSheet.pokemon}
            onChange={updatePokemon}
            onClear={handleClearSlot}
            fieldFlags={fieldFlags}
          />
        </div>
        <aside className="side-column" ref={sideColumnRef}>
          <ValidationPanel
            validation={validation}
            visibleIssues={visibleIssues}
            expandSignal={expandSignal}
            pristine={isPristine}
          />
          <PdfActions
            teamSheet={teamSheet}
            validation={validation}
            pristine={isPristine}
            onBlockedAttempt={handleBlockedAttempt}
          />
        </aside>
      </div>
      {undo ? (
        <div className="undo-toast" role="status">
          <span>{undo.label}</span>
          <button type="button" className="secondary-action" onClick={runUndo}>
            Undo
          </button>
        </div>
      ) : null}
    </main>
  );
}
