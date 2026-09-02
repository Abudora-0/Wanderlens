"use client";

import { motion } from "motion/react";

export function GlobeSpinner({ label = "Focusing" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-[var(--color-ink-mute)]">
      <motion.svg
        width="46"
        height="46"
        viewBox="0 0 46 46"
        animate={{ rotate: 360 }}
        transition={{ duration: 3.2, ease: "linear", repeat: Infinity }}
      >
        <circle
          cx="23"
          cy="23"
          r="18"
          fill="none"
          stroke="var(--color-hairline)"
          strokeWidth="2"
        />
        <path
          d="M23 5a18 18 0 0 1 0 36"
          fill="none"
          stroke="var(--color-teal)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <ellipse
          cx="23"
          cy="23"
          rx="8"
          ry="18"
          fill="none"
          stroke="var(--color-iris)"
          strokeWidth="1.4"
          opacity="0.7"
        />
      </motion.svg>
      <span className="text-xs uppercase tracking-[0.28em]">{label}</span>
    </div>
  );
}
