"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";

const CENTER = 32;
const R_IN = 12.5;
const R_OUT = 30;
const BLADES = 6;

function point(radius: number, degrees: number) {
  const rad = (degrees * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

function bladePath(index: number) {
  const base = index * (360 / BLADES) - 90;
  const a = point(R_IN, base);
  const b = point(R_IN, base + 360 / BLADES);
  const c = point(R_OUT, base + 360 / BLADES - 14);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)} L ${c.x.toFixed(2)} ${c.y.toFixed(2)} Z`;
}

interface LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  title?: string;
}

export function Logo({
  size = 40,
  className,
  animated = true,
  title = "Wanderlens",
}: LogoProps) {
  const reducedMotion = usePrefersReducedMotion();
  const shouldAnimate = animated && !reducedMotion;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
      initial={shouldAnimate ? { rotate: -35, scale: 0.82, opacity: 0 } : false}
      animate={shouldAnimate ? { rotate: 0, scale: 1, opacity: 1 } : undefined}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <defs>
        <linearGradient id="wl-blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-teal)" />
          <stop offset="55%" stopColor="var(--color-iris)" />
          <stop offset="100%" stopColor="var(--color-rose)" />
        </linearGradient>
        <radialGradient id="wl-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-gold)" />
          <stop offset="100%" stopColor="var(--color-ember)" />
        </radialGradient>
      </defs>

      <motion.g
        style={{ transformOrigin: "32px 32px" }}
        animate={shouldAnimate ? { rotate: 360 } : undefined}
        transition={
          shouldAnimate
            ? { duration: 26, ease: "linear", repeat: Infinity }
            : undefined
        }
      >
        <circle
          cx="32"
          cy="32"
          r={R_OUT}
          fill="none"
          stroke="var(--color-hairline)"
          strokeWidth="1.5"
        />
        {Array.from({ length: BLADES }).map((_, index) => (
          <motion.path
            key={index}
            d={bladePath(index)}
            fill="url(#wl-blade)"
            fillOpacity={0.9}
            initial={
              shouldAnimate
                ? { scale: 0.4, rotate: 24, opacity: 0 }
                : false
            }
            animate={
              shouldAnimate ? { scale: 1, rotate: 0, opacity: 0.9 } : undefined
            }
            transition={{
              duration: 0.7,
              delay: 0.15 + index * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ transformOrigin: "32px 32px" }}
          />
        ))}
      </motion.g>

      <ellipse
        cx="32"
        cy="32"
        rx="10"
        ry="20"
        fill="none"
        stroke="var(--color-ink)"
        strokeOpacity="0.35"
        strokeWidth="1.1"
      />
      <line
        x1="12"
        y1="32"
        x2="52"
        y2="32"
        stroke="var(--color-ink)"
        strokeOpacity="0.35"
        strokeWidth="1.1"
      />

      <motion.circle
        cx="32"
        cy="32"
        r="5.5"
        fill="url(#wl-core)"
        style={{ transformOrigin: "32px 32px" }}
        initial={{ scale: 1, opacity: 0.9 }}
        animate={
          shouldAnimate
            ? { scale: [1, 1.16, 1], opacity: [0.9, 1, 0.9] }
            : undefined
        }
        transition={
          shouldAnimate
            ? { duration: 3.4, ease: "easeInOut", repeat: Infinity }
            : undefined
        }
      />
    </motion.svg>
  );
}
