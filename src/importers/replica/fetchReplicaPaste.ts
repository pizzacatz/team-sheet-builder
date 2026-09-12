/**
 * Fetches a Showdown paste for a Pokémon Champions Replica Team ID from the
 * companion Replica Team Viewer service (https://github.com/pizzacatz/replica-team-viewer).
 *
 * The viewer URL comes from VITE_REPLICA_VIEWER_URL at build time. When it is
 * unset the feature is hidden entirely, so the builder keeps working as a
 * fully static app with no external runtime dependency.
 */

export const REPLICA_VIEWER_URL: string = (import.meta.env.VITE_REPLICA_VIEWER_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

// Temporary kill switch. While true the Replica Team ID field is hidden even
// when VITE_REPLICA_VIEWER_URL is set. Flip to false to re-enable.
export const REPLICA_LOOKUP_DISABLED = true;

export const isReplicaLookupEnabled = (): boolean =>
  !REPLICA_LOOKUP_DISABLED && REPLICA_VIEWER_URL.length > 0;

/** 10 characters, letters and digits, excluding the confusable I, O and Z. */
export const REPLICA_ID_PATTERN = /^[A-HJ-NP-Y0-9]{10}$/;

export const normalizeReplicaId = (input: string): string =>
  input.trim().toUpperCase().replace(/[\s-]/g, "");

export const REPLICA_ID_ERROR =
  "Team IDs are 10 characters of letters and numbers (no I, O, or Z).";

export class ReplicaLookupError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ReplicaLookupError";
  }
}

type FetchLike = typeof fetch;

export const fetchReplicaPaste = async (
  rawId: string,
  options: { baseUrl?: string; fetchImpl?: FetchLike; signal?: AbortSignal } = {}
): Promise<string> => {
  const baseUrl = (options.baseUrl ?? REPLICA_VIEWER_URL).replace(/\/+$/, "");
  const fetchImpl = options.fetchImpl ?? fetch;
  if (!baseUrl) throw new ReplicaLookupError("Replica lookup is not configured.");

  const id = normalizeReplicaId(rawId);
  if (!REPLICA_ID_PATTERN.test(id)) throw new ReplicaLookupError(REPLICA_ID_ERROR, 400);

  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}/api/team/${id}?format=paste`, {
      signal: options.signal,
      headers: { accept: "text/plain" },
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ReplicaLookupError("Could not reach the Replica Team Viewer. Check your connection and try again.");
  }

  if (!response.ok) {
    let message = `Lookup failed (HTTP ${response.status}).`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body; keep generic message
    }
    throw new ReplicaLookupError(message, response.status);
  }

  const paste = (await response.text()).trim();
  if (!paste) throw new ReplicaLookupError("The viewer returned an empty team.", 502);
  return paste;
};
