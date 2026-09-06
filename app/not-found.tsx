import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-6xl text-[var(--color-teal)]">404</p>
      <h1 className="mt-4 font-display text-2xl text-[var(--color-ink)]">
        That place is off the map
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        We could not find a travel guide for this spot. Try searching from the
        globe instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/explore"
          className="focus-ring rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-void)] transition-transform hover:-translate-y-0.5"
        >
          Open the globe
        </Link>
        <Link
          href="/"
          className="focus-ring rounded-full border border-[var(--color-hairline)] px-5 py-2.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
