"use client";

import { motion } from "motion/react";
import { weatherIcon } from "@/lib/format";

export function WeatherIcon({
  code,
  size = 40,
  isDay = true,
}: {
  code: number;
  size?: number;
  isDay?: boolean;
}) {
  const kind = weatherIcon(code);

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      {(kind === "sun" || kind === "cloud-sun") && (
        <motion.g
          style={{ transformOrigin: "24px 24px" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        >
          <circle
            cx="24"
            cy="24"
            r={kind === "sun" ? 9 : 7}
            fill={isDay ? "var(--color-gold)" : "var(--color-ink-soft)"}
          />
          {Array.from({ length: 8 }).map((_, index) => (
            <line
              key={index}
              x1="24"
              y1="24"
              x2="24"
              y2="7"
              stroke="var(--color-gold)"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${index * 45} 24 24)`}
              opacity={0.7}
            />
          ))}
        </motion.g>
      )}

      {(kind === "cloud" ||
        kind === "cloud-sun" ||
        kind === "fog" ||
        kind === "rain" ||
        kind === "drizzle" ||
        kind === "snow" ||
        kind === "storm") && (
        <motion.path
          d="M15 30a7 7 0 0 1 1-13.9 9 9 0 0 1 17.4 2.2A6.4 6.4 0 0 1 33 30Z"
          fill="var(--color-ink-soft)"
          animate={{ x: [0, 2, 0] }}
          transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
        />
      )}

      {(kind === "rain" || kind === "drizzle" || kind === "storm") &&
        [0, 1, 2].map((index) => (
          <motion.line
            key={index}
            x1={18 + index * 6}
            y1="32"
            x2={16 + index * 6}
            y2="39"
            stroke="var(--color-teal)"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0, 1, 0], y: [0, 4, 8] }}
            transition={{
              duration: 1.1,
              delay: index * 0.2,
              ease: "easeIn",
              repeat: Infinity,
            }}
          />
        ))}

      {kind === "snow" &&
        [0, 1, 2].map((index) => (
          <motion.circle
            key={index}
            cx={19 + index * 6}
            cy="35"
            r="1.6"
            fill="var(--color-ink)"
            animate={{ opacity: [0, 1, 0], y: [0, 5] }}
            transition={{
              duration: 1.6,
              delay: index * 0.25,
              ease: "linear",
              repeat: Infinity,
            }}
          />
        ))}

      {kind === "storm" && (
        <motion.path
          d="M24 30l-4 6h4l-2 6 7-8h-4l3-4z"
          fill="var(--color-gold)"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        />
      )}
    </svg>
  );
}
