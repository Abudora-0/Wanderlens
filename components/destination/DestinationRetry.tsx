"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Shown when a destination could not be assembled on a cold request (a slow or
 * rate-limited open API). Auto-refreshes once, since the retry usually hits a
 * warm cache.
 */
export function DestinationRetry({ name }: { name: string }) {
  const router = useRouter();
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTried(true);
      router.refresh();
    }, 2200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-5 text-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--color-hairline)] border-t-[var(--color-teal)]" />
      <h1 className="mt-6 font-display text-2xl text-[var(--color-ink)]">
        Pulling together {name}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        The open travel guides were slow to answer on the first try. This usually
        works on a second attempt.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="focus-ring rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-void)]"
        >
          {tried ? "Try again" : "Retrying..."}
        </button>
        <Link
          href="/explore"
          className="focus-ring rounded-full border border-[var(--color-hairline)] px-5 py-2.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
        >
          Back to the globe
        </Link>
      </div>
    </div>
  );
}
