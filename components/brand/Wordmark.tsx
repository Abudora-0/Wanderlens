"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Logo } from "@/components/brand/Logo";
import { usePrefersReducedMotion } from "@/lib/hooks";

const HEAD = "Wander".split("");
const TAIL = "lens".split("");

export function Wordmark({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const animate = !compact && !reducedMotion;

  return (
    <Link
      href={href}
      className="focus-ring group inline-flex items-center gap-2.5 rounded-lg"
      aria-label="Wanderlens home"
    >
      <Logo size={compact ? 30 : 38} />
      {!compact && (
        <span
          aria-hidden
          className="relative font-display text-lg font-semibold tracking-tight text-[var(--color-ink)]"
        >
          {HEAD.map((char, index) => (
            <Letter key={`h-${index}`} char={char} index={index} animate={animate} />
          ))}
          <span className="text-aurora">
            {TAIL.map((char, index) => (
              <Letter
                key={`t-${index}`}
                char={char}
                index={HEAD.length + index}
                animate={animate}
              />
            ))}
          </span>
          <motion.span
            className="absolute -bottom-0.5 right-0 block h-[2px] w-[1.9em] origin-right rounded-full"
            style={{
              background:
                "linear-gradient(90deg, var(--color-land), var(--color-teal) 55%, var(--color-ocean))",
            }}
            initial={animate ? { scaleX: 0, opacity: 0 } : false}
            animate={animate ? { scaleX: 1, opacity: 1 } : undefined}
            transition={{ duration: 0.45, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          />
        </span>
      )}
    </Link>
  );
}

function Letter({
  char,
  index,
  animate,
}: {
  char: string;
  index: number;
  animate: boolean;
}) {
  return (
    <motion.span
      className="inline-block"
      initial={animate ? { y: "0.4em", opacity: 0 } : false}
      animate={animate ? { y: 0, opacity: 1 } : undefined}
      transition={{
        duration: 0.5,
        delay: 0.05 + index * 0.035,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {char}
    </motion.span>
  );
}
