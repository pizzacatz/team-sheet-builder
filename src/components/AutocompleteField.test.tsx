import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AutocompleteOption } from "../domain/autocomplete";
import { AutocompleteField } from "./AutocompleteField";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const options: AutocompleteOption[] = Array.from({ length: 24 }, (_, index) => ({
  id: `option-${index + 1}`,
  label: `Option ${String(index + 1).padStart(2, "0")}`
}));

const nameOptions: AutocompleteOption[] = [
  { id: "lycanroc", label: "Lycanroc-Midday", aliases: ["Lycanroc"] },
  { id: "thunder", label: "Thunder" },
  { id: "thunderbolt", label: "Thunderbolt" }
];

// A parent that stores what the field reports, like PokemonSlot does.
function ControlledField({ onReport }: { onReport?: (value: string | null, text: string) => void }) {
  const [state, setState] = useState<{ value: string | null; text: string }>({ value: null, text: "" });
  return (
    <AutocompleteField
      label="Test"
      value={state.value}
      text={state.text}
      options={nameOptions}
      onChange={(value, text) => {
        setState({ value, text });
        onReport?.(value, text);
      }}
    />
  );
}

const typeText = (input: HTMLInputElement, text: string) => {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  for (let length = 1; length <= text.length; length += 1) {
    act(() => {
      setValue?.call(input, text.slice(0, length));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
};

describe("AutocompleteField", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("shows every option and supports keyboard selection", () => {
    const onChange = vi.fn();
    act(() => {
      root.render(<AutocompleteField label="Test" value={null} options={options} onChange={onChange} />);
    });

    const input = container.querySelector("input")!;
    act(() => input.focus());

    expect(container.querySelectorAll('[role="option"]')).toHaveLength(24);

    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });
    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith("option-1", "");
    expect(input.value).toBe("Option 01");
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });

  it("reopens the complete list when a selected input is clicked again", () => {
    act(() => {
      root.render(<AutocompleteField label="Test" value="option-1" options={options} onChange={vi.fn()} />);
    });

    const input = container.querySelector("input")!;
    act(() => input.focus());
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(24);

    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });
    act(() => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(container.querySelector('[role="listbox"]')).toBeNull();

    act(() => input.click());
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(24);
  });

  it("commits a typed exact match even when filterOptions hides it from the dropdown", () => {
    const onChange = vi.fn();
    // Mimics duplicate-hiding: option-2 is kept out of the suggestions.
    const hideOption2 = (opts: AutocompleteOption[], _query: string, selectedValue: string | null) =>
      opts.filter((option) => option.id === selectedValue || option.id !== "option-2");

    act(() => {
      root.render(
        <AutocompleteField label="Test" value={null} options={options} filterOptions={hideOption2} onChange={onChange} />
      );
    });

    const input = container.querySelector("input")!;
    act(() => {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setValue?.call(input, "Option 02");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const shownLabels = Array.from(container.querySelectorAll('[role="option"]')).map((el) => el.textContent);
    expect(shownLabels).not.toContain("Option 02"); // hidden from the dropdown
    expect(onChange).toHaveBeenCalledWith("option-2", ""); // but still committed
  });

  it("waits for text before opening when empty-focus suggestions are disabled", () => {
    act(() => {
      root.render(
        <AutocompleteField label="Test" value={null} options={options} openOnEmptyFocus={false} onChange={vi.fn()} />
      );
    });

    const input = container.querySelector("input")!;
    act(() => input.focus());
    expect(container.querySelector('[role="listbox"]')).toBeNull();

    act(() => {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setValue?.call(input, "O");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(container.querySelectorAll('[role="option"]')).toHaveLength(24);
  });

  it("never rewrites or clears the text while typing past a shorter exact name", () => {
    const onReport = vi.fn();
    act(() => root.render(<ControlledField onReport={onReport} />));
    const input = container.querySelector("input")!;
    act(() => input.focus());

    typeText(input, "Lycanroc-Mid");
    expect(input.value).toBe("Lycanroc-Mid");
    expect(onReport).toHaveBeenLastCalledWith(null, "Lycanroc-Mid");

    typeText(input, "Lycanroc-Midday");
    expect(input.value).toBe("Lycanroc-Midday");
    expect(onReport).toHaveBeenLastCalledWith("lycanroc", "");
  });

  it("keeps a typo as free text after leaving the field", () => {
    const onReport = vi.fn();
    act(() => root.render(<ControlledField onReport={onReport} />));
    const input = container.querySelector("input")!;
    act(() => input.focus());

    typeText(input, "Thunderbollt");
    act(() => input.blur());
    expect(input.value).toBe("Thunderbollt");
    expect(onReport).toHaveBeenLastCalledWith(null, "Thunderbollt");
  });

  it("switches a recognised name to its proper label only when leaving the field", () => {
    act(() => root.render(<ControlledField />));
    const input = container.querySelector("input")!;
    act(() => input.focus());

    typeText(input, "lycanroc");
    expect(input.value).toBe("lycanroc");
    act(() => input.blur());
    expect(input.value).toBe("Lycanroc-Midday");
  });

  it("keeps the text when backspacing a matched name", () => {
    const onReport = vi.fn();
    act(() => root.render(<ControlledField onReport={onReport} />));
    const input = container.querySelector("input")!;
    act(() => input.focus());

    typeText(input, "Thunderbolt");
    typeText(input, "Thunderbol");
    expect(input.value).toBe("Thunderbol");
    expect(onReport).toHaveBeenLastCalledWith(null, "Thunderbol");
  });

  it("shows outside changes such as an import or a clear", () => {
    const render = (value: string | null, text: string) =>
      act(() => root.render(<AutocompleteField label="Test" value={value} text={text} options={nameOptions} onChange={vi.fn()} />));
    render(null, "Koraidon");
    const input = container.querySelector("input")!;
    expect(input.value).toBe("Koraidon");
    render("thunder", "");
    expect(input.value).toBe("Thunder");
    render(null, "");
    expect(input.value).toBe("");
  });

  it("fills the box with the highlighted name while arrowing, and Escape restores the typed text", () => {
    const onReport = vi.fn();
    act(() => root.render(<ControlledField onReport={onReport} />));
    const input = container.querySelector("input")!;
    act(() => input.focus());
    typeText(input, "Thu");

    const press = (key: string) => act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })));
    press("ArrowDown");
    expect(input.value).toBe("Thunder");
    press("ArrowDown");
    expect(input.value).toBe("Thunderbolt");
    expect(onReport).toHaveBeenLastCalledWith(null, "Thu"); // only previewed, not picked

    press("Escape");
    expect(input.value).toBe("Thu");

    press("ArrowDown");
    act(() => input.blur());
    expect(input.value).toBe("Thunder");
    expect(onReport).toHaveBeenLastCalledWith("thunder", "");
  });
});
