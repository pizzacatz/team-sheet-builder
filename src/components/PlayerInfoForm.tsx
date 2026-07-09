import { CalendarDays } from "lucide-react";
import { useRef } from "react";
import type { PlayerInfo } from "../domain/teamTypes";

type PlayerInfoFormProps = {
  player: PlayerInfo;
  onChange: (patch: Partial<PlayerInfo>) => void;
  errorFieldIds?: Set<string>;
};

const ageDivisions: Array<Exclude<PlayerInfo["division"], "" | undefined>> = ["Junior", "Senior", "Master"];
const digitsOnly = (value: string): string => value.replace(/\D/g, "");

const formatDateDigits = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 6) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
  }
  if (digits.length === 8) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  }
  return value;
};

const formatCalendarDate = (value: string): string => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "";
  return `${month}-${day}-${year.slice(-2)}`;
};

export function PlayerInfoForm({ player, onChange, errorFieldIds }: PlayerInfoFormProps) {
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const invalidClass = (fieldId: string) => (errorFieldIds?.has(fieldId) ? "is-invalid" : undefined);
  const invalidFlag = (fieldId: string) => (errorFieldIds?.has(fieldId) ? true : undefined);

  const openCalendar = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  };

  return (
    <section className="section-panel player-info-panel in-field-form" aria-labelledby="player-info-heading">
      <div className="section-heading">
        <h2 id="player-info-heading">Player Info</h2>
      </div>
      <div className="player-info-grid">
        <div className="player-info-column">
          <div className="field">
            <label htmlFor="player-name">Player Name:</label>
            <input
              id="player-name"
              className={invalidClass("player-name")}
              value={player.name}
              aria-required="true"
              aria-invalid={invalidFlag("player-name")}
              required
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </div>
          <div className="field compact-label">
            <label htmlFor="trainer-name">Trainer Name in Game:</label>
            <input
              id="trainer-name"
              className={invalidClass("trainer-name")}
              value={player.trainerName ?? ""}
              aria-required="true"
              aria-invalid={invalidFlag("trainer-name")}
              required
              onChange={(event) => onChange({ trainerName: event.target.value })}
            />
          </div>
          <div className="field compact-label">
            <label htmlFor="team-name">Battle Team Number / Name:</label>
            <input
              id="team-name"
              value={player.teamName ?? ""}
              onChange={(event) => onChange({ teamName: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="switch-profile">Switch Profile Name:</label>
            <input
              id="switch-profile"
              value={player.switchProfileName ?? ""}
              onChange={(event) => onChange({ switchProfileName: event.target.value })}
            />
          </div>
        </div>
        <div className="player-info-column">
          <fieldset
            className={`division-field${invalidClass("age-division-field") ? " is-invalid" : ""}`}
            id="age-division-field"
            tabIndex={-1}
            aria-required="true"
            aria-invalid={invalidFlag("age-division-field")}
          >
            <legend>Age Division:</legend>
            <div className="division-options">
              {ageDivisions.map((division) => (
                <label key={division} className="radio-option">
                  <input
                    id={`age-division-${division.toLowerCase()}`}
                    type="radio"
                    name="age-division"
                    value={division}
                    checked={player.division === division}
                    required
                    onChange={() => onChange({ division })}
                  />
                  <span>{division}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor="player-id">Player ID:</label>
            <input
              id="player-id"
              className={invalidClass("player-id")}
              value={digitsOnly(player.playerId ?? "")}
              inputMode="numeric"
              pattern="[0-9]*"
              aria-required="true"
              aria-invalid={invalidFlag("player-id")}
              required
              onChange={(event) => onChange({ playerId: digitsOnly(event.target.value) })}
            />
          </div>
          <div className="field">
            <label htmlFor="date-of-birth">Date of Birth:</label>
            <div className="date-field-control">
              <input
                id="date-of-birth"
                className={invalidClass("date-of-birth")}
                value={player.dateOfBirth ?? ""}
                placeholder="02-27-1996"
                inputMode="numeric"
                aria-required="true"
                aria-invalid={invalidFlag("date-of-birth")}
                onChange={(event) => onChange({ dateOfBirth: formatDateDigits(event.target.value) })}
              />
              <button type="button" className="date-picker-button" aria-label="Open date picker" onClick={openCalendar}>
                <CalendarDays size={18} />
              </button>
              <input
                ref={dateInputRef}
                className="native-date-input"
                type="date"
                aria-hidden="true"
                tabIndex={-1}
                onChange={(event) => onChange({ dateOfBirth: formatCalendarDate(event.target.value) })}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="support-id">Support ID:</label>
            <input
              id="support-id"
              value={player.supportId ?? ""}
              onChange={(event) => onChange({ supportId: event.target.value })}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
