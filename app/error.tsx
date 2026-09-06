"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("app error", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-2xl text-[var(--color-ink)]">
        Something slipped
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        That page did not finish loading. Try again, or head back to the globe.
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
          href="/"
          className="focus-ring rounded-full border border-[var(--color-hairline)] px-5 py-2.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
