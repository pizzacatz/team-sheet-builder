import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AutocompleteOption } from "../domain/autocomplete";
import { AutocompleteField } from "./AutocompleteField";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const options: AutocompleteOption[] = Array.from({ length: 24 }, (_, index) => ({
  id: `option-${index + 1}`,
  label: `Option ${String(index + 1).padStart(2, "0")}`
}));

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

    expect(onChange).toHaveBeenCalledWith("option-1");
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
    expect(onChange).toHaveBeenCalledWith("option-2"); // but still committed
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
});
