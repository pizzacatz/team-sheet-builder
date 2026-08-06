import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyTeamSheet } from "../domain/teamTypes";
import { generateTeamSheetPdf } from "../pdf/generateTeamSheetPdf";
import { PdfActions } from "./PdfActions";

vi.mock("../pdf/generateTeamSheetPdf", () => ({
  generateTeamSheetPdf: vi.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" }))
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("PdfActions file sharing", () => {
  let container: HTMLDivElement;
  let root: Root;
  const share = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: vi.fn().mockReturnValue(true)
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    share.mockClear();
    Reflect.deleteProperty(navigator, "canShare");
    Reflect.deleteProperty(navigator, "share");
  });

  it("shares the combined PDF with descriptive email details", async () => {
    const teamSheet = createEmptyTeamSheet();
    teamSheet.player.name = "Casey Champion";

    await act(async () => {
      root.render(
        <PdfActions
          teamSheet={teamSheet}
          validation={{ isValid: true, issues: [] }}
          onBlockedAttempt={vi.fn()}
        />
      );
    });

    const shareButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.getAttribute("aria-label") === "Share team sheets"
    )!;
    await act(async () => {
      shareButton.click();
    });

    expect(share).toHaveBeenCalledOnce();
    const shareData = share.mock.calls[0]![0] as ShareData;
    expect(shareData.title).toBe("Casey Champion VGC Team List");
    expect(shareData.text).toBe("Casey Champion VGC Team List");
    expect(shareData.files?.[0]?.name).toBe("casey-champion-vgc-team-list.pdf");
    expect(shareData.files?.[0]?.type).toBe("application/pdf");
  });
});

describe("PdfActions ignore-all-errors override", () => {
  let container: HTMLDivElement;
  let root: Root;
  let anchorClick: ReturnType<typeof vi.spyOn>;
  const invalidValidation = {
    isValid: false,
    issues: [{ severity: "error" as const, code: "MISSING_FIELD", message: "Player Name is required.", path: "player.name" }]
  };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn().mockReturnValue("blob:mock") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    // jsdom can't navigate the blob: URL the download anchor points at.
    anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.mocked(generateTeamSheetPdf).mockClear();
    anchorClick.mockRestore();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  const findButton = (label: string) =>
    Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes(label));

  it("stays hidden until a blocked attempt has happened", async () => {
    await act(async () => {
      root.render(
        <PdfActions
          teamSheet={createEmptyTeamSheet()}
          validation={invalidValidation}
          onBlockedAttempt={vi.fn()}
          hasBlockedAttempt={false}
        />
      );
    });

    expect(findButton("Ignore all errors")).toBeUndefined();
  });

  it("generates the combined PDF despite errors, while Download stays blocked", async () => {
    const onBlockedAttempt = vi.fn();
    await act(async () => {
      root.render(
        <PdfActions
          teamSheet={createEmptyTeamSheet()}
          validation={invalidValidation}
          onBlockedAttempt={onBlockedAttempt}
          hasBlockedAttempt
        />
      );
    });

    await act(async () => {
      findButton("Download")!.click();
    });
    expect(onBlockedAttempt).toHaveBeenCalledOnce();
    expect(generateTeamSheetPdf).not.toHaveBeenCalled();

    await act(async () => {
      findButton("Ignore all errors")!.click();
    });
    expect(generateTeamSheetPdf).toHaveBeenCalledOnce();
    expect(vi.mocked(generateTeamSheetPdf).mock.calls[0]![1]).toBe("both");
  });
});
