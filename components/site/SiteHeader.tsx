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

  // Lock the page behind the mobile menu while it is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

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
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`focus-ring rounded-lg px-3 py-1.5 transition-colors ${
                isActive(link.href)
                  ? "text-[var(--color-ink)]"
                  : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              }`}
            >
              {link.label}
            </Link>
          ))}
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
          className={`focus-ring grid h-10 w-10 place-items-center rounded-xl border transition-colors md:hidden ${
            menuOpen
              ? "border-[var(--color-ocean)] bg-[var(--color-surface)] text-[var(--color-ink)]"
              : "border-[var(--color-hairline)] bg-[var(--color-surface)]/60 text-[var(--color-ink-soft)]"
          }`}
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
                menuOpen ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 block h-[2px] rounded-full bg-current transition-all duration-200 ${
                menuOpen ? "w-0 opacity-0" : "w-5 opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
                menuOpen ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default bg-[var(--color-void)]/70"
            />

            <motion.nav
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-3 top-[76px] overflow-hidden rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface-raised)] p-2 shadow-[var(--shadow-lift)]"
            >
              {LINKS.map((link, i) => {
                const active = isActive(link.href);
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.05, duration: 0.25 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`group flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] transition-colors ${
                        active
                          ? "bg-[color-mix(in_oklab,var(--color-ocean)_16%,transparent)] text-[var(--color-ink)]"
                          : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full transition-colors ${
                            active
                              ? "bg-[var(--color-teal)]"
                              : "bg-[var(--color-hairline)] group-hover:bg-[var(--color-ink-mute)]"
                          }`}
                        />
                        {link.label}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        aria-hidden
                        className="text-[var(--color-ink-mute)] transition-transform group-hover:translate-x-0.5"
                      >
                        <path
                          d="M6 3l5 5-5 5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </motion.div>
                );
              })}

              <div className="my-2 h-px bg-[var(--color-hairline)]" />

              <motion.a
                href={REPO}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 + LINKS.length * 0.05, duration: 0.25 }}
                className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
              >
                <span className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-hairline)]" />
                  Source
                </span>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  aria-hidden
                  className="text-[var(--color-ink-mute)]"
                >
                  <path
                    d="M6 3h7v7M13 3l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.a>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
