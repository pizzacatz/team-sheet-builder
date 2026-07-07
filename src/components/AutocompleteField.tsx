import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normalizeName } from "../domain/normalization";
import { searchOptions, type AutocompleteOption } from "../domain/autocomplete";

type AutocompleteFieldProps = {
  id?: string;
  label: string;
  value: string | null;
  options: AutocompleteOption[];
  onChange: (value: string | null) => void;
  filterOptions?: (options: AutocompleteOption[], query: string, selectedValue: string | null) => AutocompleteOption[];
  maxSuggestions?: number;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
};

export function AutocompleteField({
  id,
  label,
  value,
  options,
  onChange,
  filterOptions,
  maxSuggestions = 10,
  placeholder,
  helperText,
  required,
  disabled
}: AutocompleteFieldProps) {
  const generatedInputId = useId();
  const inputId = id ?? generatedInputId;
  const selected = options.find((option) => option.id === value);
  const [inputValue, setInputValue] = useState(selected?.label ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    setInputValue(selected?.label ?? "");
  }, [selected?.label, value]);

  const filterQuery = showAllOptions ? "" : inputValue;

  const filteredOptions = useMemo(
    () => (filterOptions ? filterOptions(options, filterQuery, value) : options),
    [filterOptions, filterQuery, options, value]
  );

  const suggestions = useMemo(
    () => searchOptions(filteredOptions, filterQuery, showAllOptions ? filteredOptions.length : maxSuggestions),
    [filterQuery, filteredOptions, maxSuggestions, showAllOptions]
  );

  const exactMatch = (
    rawValue: string,
    candidates: AutocompleteOption[] = filterOptions ? filterOptions(options, rawValue, value) : options
  ): AutocompleteOption | undefined => {
    const normalized = normalizeName(rawValue);
    if (!normalized) return undefined;
    return candidates.find((option) => {
      const aliases = [option.label, option.id, ...(option.aliases ?? [])];
      return aliases.some((alias) => normalizeName(alias) === normalized);
    });
  };

  const handleInput = (rawValue: string) => {
    setInputValue(rawValue);
    const match = exactMatch(rawValue);
    onChange(match?.id ?? null);
    setShowAllOptions(false);
    setIsOpen(true);
  };

  const selectOption = (option: AutocompleteOption) => {
    setInputValue(option.label);
    onChange(option.id);
    setShowAllOptions(false);
    setIsOpen(false);
  };

  const openSuggestions = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setShowAllOptions(Boolean(exactMatch(inputValue)));
    setIsOpen(true);
  };

  return (
    <div className={`field autocomplete-field${isOpen ? " is-open" : ""}`}>
      <label htmlFor={inputId}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        id={inputId}
        type="text"
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        onFocus={openSuggestions}
        onBlur={() => {
          closeTimer.current = window.setTimeout(() => {
            setShowAllOptions(false);
            setIsOpen(false);
          }, 120);
        }}
        onChange={(event) => handleInput(event.target.value)}
      />
      {helperText ? <p className="field-help">{helperText}</p> : null}
      {isOpen && suggestions.length > 0 ? (
        <div className="suggestions" role="listbox">
          {suggestions.map((option) => (
            <button
              type="button"
              key={option.id}
              className="suggestion"
              onMouseDown={(event) => {
                event.preventDefault();
                if (closeTimer.current) window.clearTimeout(closeTimer.current);
                selectOption(option);
              }}
            >
              <span>{option.label}</span>
              {option.detail ? <small>{option.detail}</small> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
