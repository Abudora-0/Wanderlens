import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedStrip } from "@/components/home/FeaturedStrip";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <FeaturedStrip />
      <section className="mx-auto w-full max-w-6xl px-5 pb-28">
        <div className="flex flex-col items-start gap-6 rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="font-display text-2xl text-[var(--color-ink)]">
              Point it anywhere on Earth
            </h2>
            <p className="mt-2 max-w-md text-sm text-[var(--color-ink-soft)]">
              No account, no tracking, no affiliate links. Just open travel data,
              rendered on a globe.
            </p>
          </div>
          <Link
            href="/explore"
            className="focus-ring shrink-0 rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-medium text-[var(--color-void)] transition-transform hover:-translate-y-0.5"
          >
            Open the globe
          </Link>
        </div>
      </section>
    </>
  );
}
