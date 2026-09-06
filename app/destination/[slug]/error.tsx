"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DestinationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface it for the browser console, no external reporting.
    console.error("destination page error", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-5 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-hairline)] text-[var(--color-teal)]">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="none">
          <path
            d="M12 8v5M12 16h.01M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="mt-6 font-display text-2xl text-[var(--color-ink)]">
        That destination did not come together
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        The open travel guides can be slow or rate limited on a cold request. A
        second attempt usually works.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="focus-ring rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-void)]"
        >
          Try again
        </button>
        <Link
          href="/explore"
          className="focus-ring rounded-full border border-[var(--color-hairline)] px-5 py-2.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
        >
          Back to the globe
        </Link>
        <Link
          href="/"
          className="focus-ring rounded-full border border-[var(--color-hairline)] px-5 py-2.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
