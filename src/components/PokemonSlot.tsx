import { useEffect, useMemo, useRef } from "react";
import { Trash2 } from "lucide-react";
import type { AutocompleteOption } from "../domain/autocomplete";
import { makeOptions, sortOptions } from "../domain/autocomplete";
import { normalizeName } from "../domain/normalization";
import { abilities, abilitiesById, items, itemsById, moves, movesById, species, speciesById, statAlignments } from "../domain/regulationData";
import { normalizePokemonStats, statRows } from "../domain/stats";
import { emptyPokemonEntry, type PokemonEntry, type StatKey } from "../domain/teamTypes";
import { AutocompleteField } from "./AutocompleteField";

type PokemonSlotProps = {
  index: number;
  entry: PokemonEntry;
  usedSpeciesDex?: Set<number>;
  usedItemIds?: Set<string>;
  errorFieldIds?: Set<string>;
  onChange: (patch: Partial<PokemonEntry>) => void;
  onClear: () => void;
};

const includeSelected = (preferred: AutocompleteOption[], all: AutocompleteOption[], selectedId: string | null | undefined) => {
  if (!selectedId || preferred.some((option) => option.id === selectedId)) return preferred;
  const selected = all.find((option) => option.id === selectedId);
  return selected ? sortOptions([selected, ...preferred]) : preferred;
};

const isMegaStoneOption = (option: AutocompleteOption) => option.detail?.startsWith("Mega Stone for ");

const isRelevantMegaStoneOption = (option: AutocompleteOption, selectedSpeciesId: string | undefined): boolean => {
  const item = itemsById.get(option.id);
  return Boolean(item?.enablesMegaFor?.length && selectedSpeciesId && item.enablesMegaFor.includes(selectedSpeciesId));
};

const shouldShowTypedMegaStone = (option: AutocompleteOption, query: string, selectedValue: string | null): boolean => {
  if (option.id === selectedValue) return true;
  const normalizedQuery = normalizeName(query);
  if (normalizedQuery.length < 5) return false;
  return normalizeName(option.label).startsWith(normalizedQuery) || normalizeName(option.id).startsWith(normalizedQuery);
};

const statAbbreviations: Record<string, string> = {
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe"
};

const formatStatAlignmentEffect = (raises?: string | null, lowers?: string | null): string => {
  if (!raises || !lowers) return "Neutral";
  return `${statAbbreviations[raises] ?? raises}↑ ${statAbbreviations[lowers] ?? lowers}↓`;
};

const statFieldLabels: Record<StatKey, string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe"
};

export function PokemonSlot({ index, entry, usedSpeciesDex, usedItemIds, errorFieldIds, onChange, onClear }: PokemonSlotProps) {
  const hasError = (fieldId: string) => Boolean(errorFieldIds?.has(fieldId));
  const lastSelectedSpeciesId = useRef(entry.speciesId);
  const allSpeciesOptions = useMemo(() => makeOptions(species, (record) => record.types.join(" / ")), []);
  const allAbilityOptions = useMemo(() => makeOptions(abilities), []);
  const allMoveOptions = useMemo(() => makeOptions(moves, (record) => record.type), []);
  const statAlignmentOptions = useMemo(
    () => makeOptions(statAlignments, (record) => formatStatAlignmentEffect(record.raises, record.lowers)),
    []
  );
  const allItemOptions = useMemo(
    () =>
      makeOptions(items, (record) =>
        record.enablesMegaFor?.length ? `Mega Stone for ${record.enablesMegaFor.map((id) => speciesById.get(id)?.displayName ?? id).join(", ")}` : undefined
      ),
    []
  );

  const selectedSpecies = speciesById.get(entry.speciesId ?? "");
  const entryStats = normalizePokemonStats(entry.stats);

  // Species Clause: hide species already used by other slots from the dropdown
  // (by Pokédex number). This only filters suggestions — a manually typed exact
  // name still commits, and validation flags the duplicate.
  const filterSpeciesOptions = useMemo(
    () => (speciesOptionList: AutocompleteOption[], _query: string, selectedValue: string | null) => {
      if (!usedSpeciesDex?.size) return speciesOptionList;
      return speciesOptionList.filter((option) => {
        if (option.id === selectedValue) return true;
        const dex = speciesById.get(option.id)?.nationalDexNumber;
        return dex === undefined || !usedSpeciesDex.has(dex);
      });
    },
    [usedSpeciesDex]
  );

  useEffect(() => {
    if (entry.speciesId) lastSelectedSpeciesId.current = entry.speciesId;
  }, [entry.speciesId]);

  const abilityOptions = useMemo(() => {
    if (!selectedSpecies) return allAbilityOptions;
    const preferred = selectedSpecies.abilities
      .map((abilityId) => abilitiesById.get(abilityId))
      .filter(Boolean)
      .map((record) => ({ id: record!.id, label: record!.displayName, aliases: record!.aliases }));
    return includeSelected(sortOptions(preferred), allAbilityOptions, entry.abilityId);
  }, [allAbilityOptions, entry.abilityId, selectedSpecies]);

  const moveOptions = useMemo(() => {
    if (!selectedSpecies) return allMoveOptions;
    const preferred = selectedSpecies.moves
      .map((moveId) => movesById.get(moveId))
      .filter(Boolean)
      .map((record) => ({ id: record!.id, label: record!.displayName, aliases: record!.aliases, detail: record!.type }));
    return sortOptions(preferred);
  }, [allMoveOptions, selectedSpecies]);

  const filterItemOptions = useMemo(
    () => (options: AutocompleteOption[], query: string, selectedValue: string | null) => {
      const selectedSpeciesId = selectedSpecies?.id;
      return options.filter((option) => {
        if (usedItemIds?.has(option.id) && option.id !== selectedValue) return false;
        if (!isMegaStoneOption(option)) return true;
        if (isRelevantMegaStoneOption(option, selectedSpeciesId)) return true;
        return shouldShowTypedMegaStone(option, query, selectedValue);
      });
    },
    [selectedSpecies?.id, usedItemIds]
  );

  const handleSpeciesChange = (speciesId: string | null) => {
    const record = speciesById.get(speciesId ?? "");

    if (!record) {
      onChange({
        speciesId: null,
        displayName: "",
        canMegaEvolve: false
      });
      return;
    }

    if (lastSelectedSpeciesId.current === speciesId) {
      onChange({
        speciesId,
        displayName: record.displayName,
        canMegaEvolve: Boolean(record.allowedMegaForms?.length)
      });
      return;
    }

    lastSelectedSpeciesId.current = speciesId;
    onChange({
      ...emptyPokemonEntry(),
      speciesId,
      displayName: record.displayName,
      canMegaEvolve: Boolean(record.allowedMegaForms?.length)
    });
  };

  const updateMove = (moveIndex: number, moveId: string | null) => {
    const nextMoves = [...entry.moves] as PokemonEntry["moves"];
    nextMoves[moveIndex] = moveId;
    onChange({ moves: nextMoves });
  };

  const updateStat = (statKey: StatKey, value: string) => {
    onChange({
      stats: {
        ...entryStats,
        [statKey]: value.replace(/[^\d]/g, "").slice(0, 3)
      }
    });
  };

  const statDescription = entry.statAlignment.requiresReview ? "Review imported neutral alignment." : undefined;

  return (
    <section className="pokemon-slot in-field-form" aria-labelledby={`pokemon-${index}-heading`}>
      <div className="slot-heading">
        <h3 id={`pokemon-${index}-heading`}>Pokémon {index + 1}</h3>
        <button type="button" className="icon-button slot-clear-button" title={`Clear Pokémon ${index + 1}`} aria-label={`Clear Pokémon ${index + 1}`} onClick={onClear}>
          <Trash2 size={17} />
        </button>
      </div>
      <div className="slot-top-grid">
        <AutocompleteField
          id={`pokemon-${index}-species`}
          label="Pokémon"
          value={entry.speciesId}
          options={allSpeciesOptions}
          filterOptions={filterSpeciesOptions}
          onChange={handleSpeciesChange}
          required
          invalid={hasError(`pokemon-${index}-species`)}
        />
        <AutocompleteField
          id={`pokemon-${index}-stat-alignment`}
          label="Stat Alignment"
          value={entry.statAlignment.value}
          options={statAlignmentOptions}
          onChange={(value) =>
            onChange({
              statAlignment: {
                value,
                source: value ? "manual" : "unknown",
                confidence: value ? "high" : "none",
                requiresReview: false
              }
            })
          }
          required
          helperText={statDescription}
          invalid={hasError(`pokemon-${index}-stat-alignment`)}
        />
      </div>
      <div className="slot-pdf-grid">
        <div className="slot-main-column">
          <AutocompleteField
            id={`pokemon-${index}-ability`}
            label="Ability"
            value={entry.abilityId}
            options={abilityOptions}
            onChange={(abilityId) => onChange({ abilityId })}
            openOnEmptyFocus={Boolean(selectedSpecies)}
            required
            invalid={hasError(`pokemon-${index}-ability`)}
          />
          <AutocompleteField
            id={`pokemon-${index}-item`}
            label="Held Item"
            value={entry.itemId}
            options={allItemOptions}
            filterOptions={filterItemOptions}
            onChange={(itemId) => onChange({ itemId })}
            required
            invalid={hasError(`pokemon-${index}-item`)}
          />
          {entry.moves.map((moveId, moveIndex) => {
            // A Pokémon can't have the same move twice: hide moves already picked
            // in this Pokémon's other slots from the dropdown. Only suggestions
            // are filtered — a manually typed duplicate still commits and is
            // flagged by validation.
            const filterMoveOptions = (moveOptionList: AutocompleteOption[], _query: string, selectedValue: string | null) => {
              const usedInOtherSlots = new Set(entry.moves.filter((id, slot) => slot !== moveIndex && id));
              return moveOptionList.filter((option) => option.id === selectedValue || !usedInOtherSlots.has(option.id));
            };
            return (
              <AutocompleteField
                key={moveIndex}
                id={`pokemon-${index}-move-${moveIndex}`}
                label={`Move ${moveIndex + 1}`}
                value={moveId}
                options={includeSelected(moveOptions, allMoveOptions, moveId)}
                filterOptions={filterMoveOptions}
                onChange={(nextMoveId) => updateMove(moveIndex, nextMoveId)}
                openOnEmptyFocus={Boolean(selectedSpecies)}
                required={moveIndex === 0}
                invalid={hasError(`pokemon-${index}-move-${moveIndex}`)}
              />
            );
          })}
        </div>
        <div className="slot-stats-column" aria-label={`Pokémon ${index + 1} stats`}>
          {statRows.map((stat) => (
            <div className="stat-field" key={stat.key}>
              <label htmlFor={`pokemon-${index}-${stat.key}`}>{statFieldLabels[stat.key]}</label>
              <input
                id={`pokemon-${index}-${stat.key}`}
                className={hasError(`pokemon-${index}-${stat.key}`) ? "is-invalid" : undefined}
                aria-invalid={hasError(`pokemon-${index}-${stat.key}`) || undefined}
                inputMode="numeric"
                pattern="[0-9]*"
                value={entryStats[stat.key]}
                onChange={(event) => updateStat(stat.key, event.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
