"use client";

import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";

export function Nav() {
  const { scrollY } = useScroll();
  const [condensed, setCondensed] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setCondensed(latest > 40);
  });

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4"
    >
      <div
        className={`mt-3 flex w-full max-w-6xl items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-300 ${
          condensed
            ? "border-[var(--color-hairline)] bg-[color-mix(in_oklab,var(--color-abyss)_90%,transparent)] backdrop-blur-md"
            : "border-transparent bg-transparent"
        }`}
      >
        <Wordmark />
        <nav className="flex items-center gap-1 text-sm">
          <a
            href="#explore"
            className="focus-ring hidden rounded-lg px-3 py-1.5 text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)] sm:block"
          >
            Collections
          </a>
          <a
            href="https://github.com/Abudora-0/Wanderlens"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring rounded-lg border border-[var(--color-hairline)] px-3 py-1.5 text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-iris)] hover:text-[var(--color-ink)]"
          >
            Source
          </a>
        </nav>
      </div>
    </motion.header>
  );
}
