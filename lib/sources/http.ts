const DEFAULT_TIMEOUT_MS = 4500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch with a hard upstream timeout plus one quick retry on a rate-limit or
 * transient error. Kept tight so an aggregated response never blows the
 * function's time budget. On a cache hit none of this is armed.
 */
export async function timedFetch(
  input: string | URL,
  init: RequestInit & { next?: { revalidate: number } } = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const last = attempt === 1;
    let res: Response;
    try {
      res = await fetch(input, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (last) throw error;
      await sleep(250);
      continue;
    }

    if ((res.status === 429 || res.status === 503) && !last) {
      const retryAfter = Number(res.headers.get("retry-after"));
      await sleep(
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 1500)
          : 450,
      );
      continue;
    }
    return res;
  }
  return fetch(input, init);
}
