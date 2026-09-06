export default function DestinationLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-28 pt-28">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-hairline)] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">
        Back to explore
      </div>

      <div className="animate-pulse">
        <header className="mt-6 border-b border-[var(--color-hairline)] pb-6">
          <div className="h-3 w-24 rounded-full bg-[var(--color-surface)]" />
          <div className="mt-4 h-12 w-3/5 rounded-2xl bg-[var(--color-surface)]" />
          <p className="mt-4 text-sm text-[var(--color-ink-mute)]">
            Gathering places worth your time...
          </p>
        </header>

        <div className="grid gap-8 pt-8 lg:grid-cols-[340px_1fr] lg:gap-10">
          <div className="flex flex-col gap-4">
            <div className="h-24 rounded-2xl bg-[var(--color-surface)]" />
            <div className="h-40 rounded-2xl bg-[var(--color-surface)]" />
            <div className="h-40 rounded-2xl bg-[var(--color-surface)]" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
