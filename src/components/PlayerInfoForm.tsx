import { useRef } from "react";
import { AGE_DIVISION_HINTS, divisionForBirthYear } from "../domain/ageDivision";
import type { PlayerInfo } from "../domain/teamTypes";

type PlayerInfoFormProps = {
  player: PlayerInfo;
  onChange: (patch: Partial<PlayerInfo>) => void;
  errorFieldIds?: Set<string>;
};

const ageDivisions: Array<Exclude<PlayerInfo["division"], "" | undefined>> = ["Junior", "Senior", "Master"];
const digitsOnly = (value: string): string => value.replace(/\D/g, "");

// Date of Birth is stored as an "MM-DD-YYYY" string (parts may be blank while
// typing). Splitting on "-" keeps each part in its slot even when an earlier one
// is empty.
const dobPart = (value: string | undefined, index: number, max: number): string =>
  ((value ?? "").split("-")[index] ?? "").replace(/\D/g, "").slice(0, max);

const composeDob = (month: string, day: string, year: string): string =>
  month || day || year ? `${month}-${day}-${year}` : "";

export function PlayerInfoForm({ player, onChange, errorFieldIds }: PlayerInfoFormProps) {
  const dobDayRef = useRef<HTMLInputElement | null>(null);
  const dobYearRef = useRef<HTMLInputElement | null>(null);
  const invalidClass = (fieldId: string) => (errorFieldIds?.has(fieldId) ? "is-invalid" : undefined);
  const invalidFlag = (fieldId: string) => (errorFieldIds?.has(fieldId) ? true : undefined);

  const dobMonth = dobPart(player.dateOfBirth, 0, 2);
  const dobDay = dobPart(player.dateOfBirth, 1, 2);
  const dobYear = dobPart(player.dateOfBirth, 2, 4);

  const setDobPart = (part: "month" | "day" | "year", raw: string) => {
    const value = raw.replace(/\D/g, "").slice(0, part === "year" ? 4 : 2);
    const patch: Partial<PlayerInfo> = {
      dateOfBirth: composeDob(
        part === "month" ? value : dobMonth,
        part === "day" ? value : dobDay,
        part === "year" ? value : dobYear
      )
    };
    // A complete birth year fixes the age division (division is set by birth year).
    if (part === "year" && value.length === 4) {
      patch.division = divisionForBirthYear(Number.parseInt(value, 10));
    }
    onChange(patch);
    if (part === "month" && value.length === 2) dobDayRef.current?.focus();
    else if (part === "day" && value.length === 2) dobYearRef.current?.focus();
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
            <legend title="Age division is set by birth year (auto-filled from Date of Birth).">
              Age Division:
            </legend>
            <div className="division-options">
              {ageDivisions.map((division) => (
                <label
                  key={division}
                  className="radio-option"
                  title={`${division} — ${AGE_DIVISION_HINTS[division]}`}
                >
                  <input
                    id={`age-division-${division.toLowerCase()}`}
                    type="radio"
                    name="age-division"
                    value={division}
                    checked={player.division === division}
                    required
                    aria-label={`${division} division — ${AGE_DIVISION_HINTS[division]}`}
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
          <div className="field dob-field">
            <label htmlFor="dob-month">Date of Birth:</label>
            <div
              className={`date-field-control${invalidClass("date-of-birth") ? " is-invalid" : ""}`}
              id="date-of-birth"
              tabIndex={-1}
              aria-invalid={invalidFlag("date-of-birth")}
            >
              <input
                id="dob-month"
                className="dob-part"
                value={dobMonth}
                placeholder="MM"
                inputMode="numeric"
                aria-label="Birth month, two digits"
                aria-required="true"
                maxLength={2}
                onChange={(event) => setDobPart("month", event.target.value)}
              />
              <span className="date-sep" aria-hidden="true">/</span>
              <input
                ref={dobDayRef}
                id="dob-day"
                className="dob-part"
                value={dobDay}
                placeholder="DD"
                inputMode="numeric"
                aria-label="Birth day, two digits"
                aria-required="true"
                maxLength={2}
                onChange={(event) => setDobPart("day", event.target.value)}
              />
              <span className="date-sep" aria-hidden="true">/</span>
              <input
                ref={dobYearRef}
                id="dob-year"
                className="dob-part dob-year"
                value={dobYear}
                placeholder="YYYY"
                inputMode="numeric"
                aria-label="Birth year, four digits"
                aria-required="true"
                maxLength={4}
                onChange={(event) => setDobPart("year", event.target.value)}
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
