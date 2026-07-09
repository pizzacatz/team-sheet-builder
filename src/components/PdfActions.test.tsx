import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyTeamSheet } from "../domain/teamTypes";
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
          onClear={vi.fn()}
          onBlockedAttempt={vi.fn()}
        />
      );
    });

    const shareButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Share Team Sheets")
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
