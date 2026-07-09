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
  openOnEmptyFocus?: boolean;
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
  openOnEmptyFocus = true,
  placeholder,
  helperText,
  required,
  disabled
}: AutocompleteFieldProps) {
  const generatedInputId = useId();
  const inputId = id ?? generatedInputId;
  const listboxId = `${inputId}-suggestions`;
  const selected = options.find((option) => option.id === value);
  const [inputValue, setInputValue] = useState(selected?.label ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const closeTimer = useRef<number | null>(null);
  const activeOptionRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setInputValue(selected?.label ?? "");
  }, [selected?.label, value]);

  const filterQuery = showAllOptions ? "" : inputValue;

  const filteredOptions = useMemo(
    () => (filterOptions ? filterOptions(options, filterQuery, value) : options),
    [filterOptions, filterQuery, options, value]
  );

  const suggestions = useMemo(
    () => searchOptions(filteredOptions, filterQuery),
    [filterQuery, filteredOptions]
  );

  useEffect(() => {
    if (activeIndex >= suggestions.length) setActiveIndex(suggestions.length - 1);
  }, [activeIndex, suggestions.length]);

  useEffect(() => {
    activeOptionRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  // Resolve typed text against the FULL option list, not the dropdown-filtered
  // one. filterOptions only hides suggestions (e.g. duplicates already used
  // elsewhere); a user who types an exact name should still be able to commit it
  // so validation can flag the duplicate.
  const exactMatch = (
    rawValue: string,
    candidates: AutocompleteOption[] = options
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
    setActiveIndex(-1);
    setIsOpen(true);
  };

  const selectOption = (option: AutocompleteOption) => {
    setInputValue(option.label);
    onChange(option.id);
    setShowAllOptions(false);
    setActiveIndex(-1);
    setIsOpen(false);
  };

  const openSuggestions = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    if (!openOnEmptyFocus && !inputValue.trim()) {
      closeSuggestions();
      return;
    }
    setShowAllOptions(Boolean(exactMatch(inputValue)));
    setActiveIndex(-1);
    setIsOpen(true);
  };

  const closeSuggestions = () => {
    setShowAllOptions(false);
    setActiveIndex(-1);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeSuggestions();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        if (!openOnEmptyFocus && !inputValue.trim()) return;
        openSuggestions();
        setActiveIndex(event.key === "ArrowDown" ? 0 : suggestions.length - 1);
        return;
      }
      setActiveIndex((current) => {
        if (event.key === "ArrowDown") return Math.min(current + 1, suggestions.length - 1);
        return current < 0 ? suggestions.length - 1 : Math.max(current - 1, 0);
      });
      return;
    }

    if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      event.preventDefault();
      const option = suggestions[activeIndex];
      if (option) selectOption(option);
    }
  };

  return (
    <div className={`field autocomplete-field${isOpen ? " is-open" : ""}${disabled ? " is-disabled" : ""}`}>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={isOpen && suggestions.length > 0 ? listboxId : undefined}
        aria-activedescendant={activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined}
        aria-expanded={isOpen}
        aria-required={required || undefined}
        onFocus={openSuggestions}
        onClick={() => {
          if (!isOpen) openSuggestions();
        }}
        onBlur={() => {
          closeTimer.current = window.setTimeout(() => {
            closeSuggestions();
          }, 120);
        }}
        onKeyDown={handleKeyDown}
        onChange={(event) => handleInput(event.target.value)}
      />
      {helperText ? <p className="field-help">{helperText}</p> : null}
      {isOpen && suggestions.length > 0 ? (
        <div id={listboxId} className="suggestions" role="listbox">
          {suggestions.map((option, optionIndex) => (
            <button
              type="button"
              key={option.id}
              id={`${inputId}-option-${optionIndex}`}
              ref={optionIndex === activeIndex ? activeOptionRef : undefined}
              className="suggestion"
              role="option"
              aria-selected={optionIndex === activeIndex}
              onMouseEnter={() => setActiveIndex(optionIndex)}
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
