const DEFAULT_TIMEOUT_MS = 3500;

/**
 * fetch with a hard upstream timeout so one slow open API cannot stall a whole
 * aggregated response. On a cache hit Next serves from cache and the timeout is
 * never armed.
 */
export function timedFetch(
  input: string | URL,
  init: RequestInit & { next?: { revalidate: number } } = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}
