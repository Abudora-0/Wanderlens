"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Wordmark } from "@/components/brand/Wordmark";

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const REPO = "https://github.com/Abudora-0/Wanderlens";

export function SiteHeader() {
  const pathname = usePathname();
  const [condensed, setCondensed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const condensedRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 32;
      if (next !== condensedRef.current) {
        condensedRef.current = next;
        setCondensed(next);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 sm:px-4">
      <div
        className={`mt-3 flex w-full max-w-6xl items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 transition-colors duration-300 sm:px-4 ${
          condensed || menuOpen
            ? "border-[var(--color-hairline)] bg-[var(--color-abyss)]"
            : "border-transparent bg-transparent"
        }`}
      >
        <Wordmark />

        <nav className="hidden items-center gap-1 text-sm md:flex">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`focus-ring rounded-lg px-3 py-1.5 transition-colors ${
                  active
                    ? "text-[var(--color-ink)]"
                    : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <a
            href={REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring ml-1 rounded-lg border border-[var(--color-hairline)] px-3 py-1.5 text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ocean)] hover:text-[var(--color-ink)]"
          >
            Source
          </a>
        </nav>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="focus-ring -mr-1 grid h-9 w-9 place-items-center rounded-lg text-[var(--color-ink-soft)] md:hidden"
        >
          <span className="relative block h-3 w-5">
            <span
              className={`absolute left-0 block h-[2px] w-5 rounded bg-current transition-transform duration-300 ${
                menuOpen ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 block h-[2px] w-5 rounded bg-current transition-opacity duration-200 ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-[2px] w-5 rounded bg-current transition-transform duration-300 ${
                menuOpen ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-3 top-[68px] rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-surface-raised)] p-2 shadow-[var(--shadow-lift)] md:hidden"
          >
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-xl px-4 py-3 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl px-4 py-3 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
            >
              Source
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
