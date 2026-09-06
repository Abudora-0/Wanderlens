const DEFAULT_TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch with a hard upstream timeout plus automatic retries on a rate-limit or
 * transient server error (open APIs like Wikimedia throttle bursts). On a cache
 * hit Next serves from cache and none of this is armed.
 */
export async function timedFetch(
  input: string | URL,
  init: RequestInit & { next?: { revalidate: number } } = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const last = attempt === MAX_ATTEMPTS - 1;
    let res: Response;
    try {
      res = await fetch(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      lastError = error;
      if (last) throw error;
      await sleep(300 + attempt * 300);
      continue;
    }

    if ((res.status === 429 || res.status === 503) && !last) {
      const retryAfter = Number(res.headers.get("retry-after"));
      await sleep(
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 2500)
          : 600 + attempt * 500,
      );
      continue;
    }
    return res;
  }

  throw lastError ?? new Error("timedFetch exhausted retries");
}
