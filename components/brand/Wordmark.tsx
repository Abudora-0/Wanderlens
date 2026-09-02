"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Wordmark({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="focus-ring group inline-flex items-center gap-2.5 rounded-lg"
      aria-label="Wanderlens home"
    >
      <Logo size={compact ? 30 : 38} />
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight text-[var(--color-ink)]">
          Wander<span className="text-aurora">lens</span>
        </span>
      )}
    </Link>
  );
}
