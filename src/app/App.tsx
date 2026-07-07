import { ImportPanel } from "../components/ImportPanel";
import { PdfActions } from "../components/PdfActions";
import { PlayerInfoForm } from "../components/PlayerInfoForm";
import { TeamForm } from "../components/TeamForm";
import { ValidationPanel } from "../components/ValidationPanel";
import { rules } from "../domain/regulationData";
import { useTeamSheetState } from "../state/useTeamSheetState";
import "./styles.css";

export function App() {
  const { teamSheet, validation, updatePlayer, updatePokemon, replacePokemon, reset } = useTeamSheetState();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">{rules.regulation} · {rules.dataVersion}</p>
          <h1>Team Sheet Builder</h1>
        </div>
        <p className="header-note">Client-side Showdown import, Regulation M-B validation, and Play! Pokémon PDF output.</p>
      </header>

      <div className="layout">
        <div className="main-column">
          <ImportPanel onImport={replacePokemon} />
          <PlayerInfoForm player={teamSheet.player} onChange={updatePlayer} />
          <TeamForm pokemon={teamSheet.pokemon} onChange={updatePokemon} />
        </div>
        <aside className="side-column">
          <ValidationPanel validation={validation} />
          <PdfActions teamSheet={teamSheet} validation={validation} onClear={reset} />
        </aside>
      </div>
    </main>
  );
}
