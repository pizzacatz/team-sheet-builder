import { describe, expect, it, vi } from "vitest";
import { ReplicaLookupError, fetchReplicaPaste, normalizeReplicaId } from "./fetchReplicaPaste";

const base = "https://replica.example.test";

const mockFetch = (status: number, body: string, contentType = "text/plain") =>
  vi.fn().mockResolvedValue(new Response(body, { status, headers: { "content-type": contentType } }));

describe("normalizeReplicaId", () => {
  it("upper-cases and strips spaces and dashes", () => {
    expect(normalizeReplicaId(" 442e6-dpre t ")).toBe("442E6DPRET");
  });
});

describe("fetchReplicaPaste", () => {
  it("requests the paste for a normalized ID and returns it", async () => {
    const fetchImpl = mockFetch(200, "Aerodactyl @ Aerodactylite\nAbility: Unnerve\n");
    const paste = await fetchReplicaPaste("442e6dpret", { baseUrl: base, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith(`${base}/api/team/442E6DPRET?format=paste`, expect.anything());
    expect(paste).toContain("Aerodactyl @ Aerodactylite");
  });

  it("rejects malformed IDs without a network call", async () => {
    const fetchImpl = mockFetch(200, "");
    await expect(fetchReplicaPaste("ZZZ", { baseUrl: base, fetchImpl })).rejects.toBeInstanceOf(ReplicaLookupError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("surfaces the viewer's error message on non-2xx responses", async () => {
    const fetchImpl = mockFetch(404, JSON.stringify({ error: "Team not found." }), "application/json");
    await expect(fetchReplicaPaste("442E6DPRET", { baseUrl: base, fetchImpl })).rejects.toMatchObject({
      message: "Team not found.",
      status: 404,
    });
  });

  it("wraps network failures in a friendly error", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(fetchReplicaPaste("442E6DPRET", { baseUrl: base, fetchImpl })).rejects.toThrow(/Could not reach/);
  });

  it("fails when no viewer URL is configured", async () => {
    await expect(fetchReplicaPaste("442E6DPRET", { baseUrl: "", fetchImpl: mockFetch(200, "x") })).rejects.toThrow(/not configured/);
  });
});
