"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";

const CENTER = 32;
const LONG = 28;
const SHORT = 13.5;
const WAIST = 6;

function pt(radius: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(a), CENTER + radius * Math.sin(a)] as const;
}

function starPath() {
  const cmds: string[] = [];
  for (let i = 0; i < 8; i += 1) {
    const tipR = i % 2 === 0 ? LONG : SHORT;
    const [tx, ty] = pt(tipR, i * 45);
    const [wx, wy] = pt(WAIST, i * 45 + 22.5);
    cmds.push(`${i === 0 ? "M" : "L"} ${tx.toFixed(2)} ${ty.toFixed(2)}`);
    cmds.push(`L ${wx.toFixed(2)} ${wy.toFixed(2)}`);
  }
  cmds.push("Z");
  return cmds.join(" ");
}

const STAR = starPath();

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
      initial={shouldAnimate ? { rotate: -68, scale: 0.62, opacity: 0 } : false}
      animate={shouldAnimate ? { rotate: 0, scale: 1, opacity: 1 } : undefined}
      transition={{ type: "spring", stiffness: 95, damping: 10, mass: 0.9 }}
    >
      <defs>
        <linearGradient id="wl-star" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-teal)" />
          <stop offset="52%" stopColor="var(--color-iris)" />
          <stop offset="100%" stopColor="var(--color-rose)" />
        </linearGradient>
        <radialGradient id="wl-core" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="var(--color-gold)" />
          <stop offset="100%" stopColor="var(--color-ember)" />
        </radialGradient>
      </defs>

      <motion.g
        style={{ transformOrigin: "32px 32px" }}
        animate={shouldAnimate ? { rotate: 360 } : undefined}
        transition={
          shouldAnimate
            ? { duration: 64, ease: "linear", repeat: Infinity }
            : undefined
        }
      >
        {/* faint back star for depth */}
        <path
          d={STAR}
          transform="rotate(45 32 32)"
          fill="var(--color-iris)"
          fillOpacity={0.16}
        />
        <path
          d={STAR}
          fill="url(#wl-star)"
          stroke="var(--color-void)"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </motion.g>

      <motion.circle
        cx="32"
        cy="32"
        r="5"
        fill="url(#wl-core)"
        style={{ transformOrigin: "32px 32px" }}
        initial={
          shouldAnimate ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }
        }
        animate={shouldAnimate ? { scale: 1, opacity: 1 } : undefined}
        transition={
          shouldAnimate
            ? { duration: 0.5, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }
            : undefined
        }
      />
    </motion.svg>
  );
}
