import { useEffect, useId, useMemo, useRef, useState } from "react";
import { normalizeName } from "../domain/normalization";
import { searchOptions, type AutocompleteOption } from "../domain/autocomplete";
import { keepRoomAboveKeyboard } from "./validationFields";

type AutocompleteFieldProps = {
  id?: string;
  label: string;
  value: string | null;
  // Free text kept when the typed name matches no option (value is null).
  text?: string;
  options: AutocompleteOption[];
  // `text` is the typed text when nothing matched, otherwise "".
  onChange: (value: string | null, text: string) => void;
  filterOptions?: (options: AutocompleteOption[], query: string, selectedValue: string | null) => AutocompleteOption[];
  openOnEmptyFocus?: boolean;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  warning?: boolean;
};

export function AutocompleteField({
  id,
  label,
  value,
  text = "",
  options,
  onChange,
  filterOptions,
  openOnEmptyFocus = true,
  placeholder,
  helperText,
  required,
  disabled,
  invalid,
  warning
}: AutocompleteFieldProps) {
  const generatedInputId = useId();
  const inputId = id ?? generatedInputId;
  const listboxId = `${inputId}-suggestions`;
  const selected = options.find((option) => option.id === value);
  const [inputValue, setInputValue] = useState(selected?.label ?? text);
  const [isOpen, setIsOpen] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // True while the highlight was moved with the arrow keys: the box then shows
  // the highlighted name, and Enter, Tab or leaving the field picks it.
  const [keyboardNav, setKeyboardNav] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const activeOptionRef = useRef<HTMLButtonElement | null>(null);

  // What this field last reported, so a parent echoing our own typing back
  // doesn't overwrite the text mid-word. Only outside changes (picking a new
  // species, an import, a share link, a clear) replace what's on screen.
  const lastReported = useRef({ value, text });

  useEffect(() => {
    if (lastReported.current.value === value && lastReported.current.text === text) return;
    lastReported.current = { value, text };
    setInputValue(selected?.label ?? text);
  }, [selected?.label, text, value]);

  const filterQuery = showAllOptions ? "" : inputValue;

  const filteredOptions = useMemo(
    () => (filterOptions ? filterOptions(options, filterQuery, value) : options),
    [filterOptions, filterQuery, options, value]
  );

  const suggestions = useMemo(
    () => searchOptions(filteredOptions, filterQuery),
    [filterQuery, filteredOptions]
  );

  const previewOption = keyboardNav && activeIndex >= 0 ? suggestions[activeIndex] : undefined;

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
    // Typing never rewrites or clears the text: a match is saved quietly, and
    // anything else is kept as free text for validation to flag.
    const match = exactMatch(rawValue);
    const nextValue = match?.id ?? null;
    const nextText = match ? "" : rawValue.trim() ? rawValue : "";
    lastReported.current = { value: nextValue, text: nextText };
    onChange(nextValue, nextText);
    setKeyboardNav(false);
    setShowAllOptions(false);
    setActiveIndex(-1);
    setIsOpen(true);
  };

  const selectOption = (option: AutocompleteOption) => {
    setInputValue(option.label);
    lastReported.current = { value: option.id, text: "" };
    onChange(option.id, "");
    setKeyboardNav(false);
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
    setKeyboardNav(false);
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
      setKeyboardNav(true);
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
    <div className={`field autocomplete-field${isOpen ? " is-open" : ""}${disabled ? " is-disabled" : ""}${invalid ? " is-invalid" : ""}${warning && !invalid ? " is-warning" : ""}`}>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        value={previewOption?.label ?? inputValue}
        // A long name can be cut off by the field width; show it in full on hover.
        title={selected?.label}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={isOpen && suggestions.length > 0 ? listboxId : undefined}
        aria-activedescendant={activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined}
        aria-expanded={isOpen}
        aria-required={required || undefined}
        onFocus={(event) => {
          openSuggestions();
          keepRoomAboveKeyboard(event.currentTarget);
        }}
        onClick={() => {
          if (!isOpen) openSuggestions();
        }}
        onBlur={() => {
          // Once the person leaves the field, a recognised name switches to its
          // proper label (e.g. "lycanroc" becomes "Lycanroc-Midday").
          if (previewOption) {
            selectOption(previewOption);
            return;
          }
          const match = exactMatch(inputValue);
          if (match && match.label !== inputValue) setInputValue(match.label);
          closeTimer.current = window.setTimeout(() => {
            closeSuggestions();
          }, 120);
        }}
        onKeyDown={handleKeyDown}
        onChange={(event) => handleInput(event.target.value)}
      />
      {helperText ? <p className="field-help">{helperText}</p> : null}
      {isOpen && suggestions.length > 0 ? (
        <div
          id={listboxId}
          className="suggestions"
          role="listbox"
          // Browsers make scrollable boxes Tab stops; keep this one out so Tab
          // moves to the next field instead of into a list that is closing.
          tabIndex={-1}
        >
          {suggestions.map((option, optionIndex) => (
            <button
              type="button"
              key={option.id}
              id={`${inputId}-option-${optionIndex}`}
              ref={optionIndex === activeIndex ? activeOptionRef : undefined}
              className="suggestion"
              role="option"
              // Combobox pattern: arrow keys move through options (via
              // aria-activedescendant); Tab leaves the field instead of
              // walking into the list, which closes under it.
              tabIndex={-1}
              aria-selected={optionIndex === activeIndex}
              onMouseEnter={() => {
                setKeyboardNav(false);
                setActiveIndex(optionIndex);
              }}
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
