import { CalendarDays, Download, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { parsePlayerInfoFile, playerInfoFilename, serializePlayerInfoFile } from "../domain/playerInfoFile";
import type { PlayerInfo } from "../domain/teamTypes";

type PlayerInfoFormProps = {
  player: PlayerInfo;
  onChange: (patch: Partial<PlayerInfo>) => void;
};

const ageDivisions: Array<Exclude<PlayerInfo["division"], "" | undefined>> = ["Junior", "Senior", "Master"];
const maxPlayerInfoFileBytes = 64 * 1024;
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

export function PlayerInfoForm({ player, onChange }: PlayerInfoFormProps) {
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const downloadPlayerInfo = () => {
    const blob = new Blob([serializePlayerInfoFile(player)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = playerInfoFilename(player);
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const openUploadPicker = () => {
    setUploadError(null);
    uploadInputRef.current?.click();
  };

  const uploadPlayerInfo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > maxPlayerInfoFileBytes) {
      setUploadError("Choose a player info file smaller than 64 KB.");
      return;
    }

    try {
      const contents = await file.text();
      onChange(parsePlayerInfoFile(contents));
      setUploadError(null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Could not upload player info.");
    }
  };

  return (
    <section className="section-panel player-info-panel in-field-form" aria-labelledby="player-info-heading">
      <div className="section-heading">
        <h2 id="player-info-heading">Player Info</h2>
        <div className="heading-actions">
          <button type="button" className="icon-button" title="Download player info" aria-label="Download player info" onClick={downloadPlayerInfo}>
            <Download size={17} />
          </button>
          <button type="button" className="icon-button" title="Upload player info" aria-label="Upload player info" onClick={openUploadPicker}>
            <Upload size={17} />
          </button>
          <input ref={uploadInputRef} className="file-input" type="file" accept="application/json,.json" onChange={uploadPlayerInfo} />
        </div>
      </div>
      {uploadError ? (
        <p className="file-error" role="alert">
          {uploadError}
        </p>
      ) : null}
      <div className="player-info-grid">
        <div className="player-info-column">
          <div className="field">
            <label htmlFor="player-name">Player Name:</label>
            <input
              id="player-name"
              value={player.name}
              aria-required="true"
              required
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </div>
          <div className="field compact-label">
            <label htmlFor="trainer-name">Trainer Name in Game:</label>
            <input
              id="trainer-name"
              value={player.trainerName ?? ""}
              aria-required="true"
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
          <fieldset className="division-field" id="age-division-field" tabIndex={-1} aria-required="true">
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
              value={digitsOnly(player.playerId ?? "")}
              inputMode="numeric"
              pattern="[0-9]*"
              aria-required="true"
              required
              onChange={(event) => onChange({ playerId: digitsOnly(event.target.value) })}
            />
          </div>
          <div className="field">
            <label htmlFor="date-of-birth">Date of Birth:</label>
            <div className="date-field-control">
              <input
                id="date-of-birth"
                value={player.dateOfBirth ?? ""}
                inputMode="numeric"
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
