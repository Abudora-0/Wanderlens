"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";

export function Nav() {
  const [condensed, setCondensed] = useState(false);
  const condensedRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 40;
      if (next !== condensedRef.current) {
        condensedRef.current = next;
        setCondensed(next);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4"
    >
      <div
        className={`mt-3 flex w-full max-w-6xl items-center justify-between rounded-2xl border px-4 py-2.5 transition-colors duration-300 ${
          condensed
            ? "border-[var(--color-hairline)] bg-[var(--color-abyss)]"
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
