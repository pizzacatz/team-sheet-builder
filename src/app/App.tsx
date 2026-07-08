import { Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ImportPanel } from "../components/ImportPanel";
import { PdfActions } from "../components/PdfActions";
import { PlayerInfoForm } from "../components/PlayerInfoForm";
import { TeamForm } from "../components/TeamForm";
import { ValidationPanel } from "../components/ValidationPanel";
import { rules } from "../domain/regulationData";
import { useTeamSheetState } from "../state/useTeamSheetState";
import "./styles.css";

type ThemeMode = "light" | "dark";
const THEME_STORAGE_KEY = "team-sheet-builder-theme";
const MOBILE_FLOATING_TRAY_CONTENT_GAP_PX = 14;

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
  const isDarkMode = theme === "dark";

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
        `${Math.ceil(height + bottom + MOBILE_FLOATING_TRAY_CONTENT_GAP_PX)}px`
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

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">{rules.regulation} · {rules.dataVersion}</p>
          <h1>Team Sheet Builder</h1>
        </div>
        <div className="header-actions">
          <p className="header-note">Client-side Showdown import, Regulation M-B validation, and Play! Pokémon PDF output.</p>
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
          <PlayerInfoForm player={teamSheet.player} onChange={updatePlayer} />
          <TeamForm pokemon={teamSheet.pokemon} onChange={updatePokemon} />
        </div>
        <aside className="side-column" ref={sideColumnRef}>
          <ValidationPanel validation={validation} />
          <PdfActions teamSheet={teamSheet} validation={validation} onClear={reset} />
        </aside>
      </div>
    </main>
  );
}
