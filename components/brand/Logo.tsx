"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";

interface LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
  title?: string;
}

/* Two identical land tiles sit side by side and scroll left forever, so land
   masses appear to rotate around the sphere. Everything is clipped to the ocean
   circle. */
function LandTile({ dx }: { dx: number }) {
  return (
    <g transform={`translate(${dx} 0)`}>
      <path
        d="M8 20c4-3 9-2 11 1s-1 7-5 8-9 0-10-4 1-3 4-5z"
        fill="var(--color-land)"
      />
      <path
        d="M28 34c3-4 10-5 14-1s3 10-2 12-13 1-15-4 1-4 3-7z"
        fill="#2ba05f"
      />
      <path
        d="M20 44c2-2 6-2 7 1s-1 5-4 5-6-1-6-4 1-1 3-2z"
        fill="var(--color-land)"
      />
      <path
        d="M40 14c2-2 6-1 7 2s-2 5-5 5-5-2-5-4 1-2 3-3z"
        fill="#2ba05f"
      />
      {/* thin meridian arcs travelling with the surface */}
      <path
        d="M14 8C10 20 10 44 14 56"
        fill="none"
        stroke="#dfeeff"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <path
        d="M34 6C29 20 29 44 34 58"
        fill="none"
        stroke="#dfeeff"
        strokeOpacity="0.28"
        strokeWidth="1"
      />
    </g>
  );
}

export function Logo({
  size = 40,
  className,
  animated = true,
  title = "Wanderlens",
}: LogoProps) {
  const reducedMotion = usePrefersReducedMotion();
  const spin = animated && !reducedMotion;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
      initial={spin ? { rotate: -18, scale: 0.85, opacity: 0 } : false}
      animate={spin ? { rotate: 0, scale: 1, opacity: 1 } : undefined}
      transition={{ type: "spring", stiffness: 120, damping: 13 }}
    >
      <defs>
        <radialGradient id="wl-ocean" cx="37%" cy="33%" r="75%">
          <stop offset="0%" stopColor="#57a8ff" />
          <stop offset="55%" stopColor="var(--color-ocean)" />
          <stop offset="100%" stopColor="#173f95" />
        </radialGradient>
        <clipPath id="wl-sphere">
          <circle cx="32" cy="32" r="25" />
        </clipPath>
      </defs>

      <circle cx="32" cy="32" r="25" fill="url(#wl-ocean)" />

      <g clipPath="url(#wl-sphere)">
        <motion.g
          animate={spin ? { x: [0, -50] } : undefined}
          transition={
            spin
              ? { duration: 14, ease: "linear", repeat: Infinity }
              : undefined
          }
        >
          <LandTile dx={0} />
          <LandTile dx={50} />
          <LandTile dx={-50} />
        </motion.g>
      </g>

      {/* fixed graticule + rim */}
      <ellipse
        cx="32"
        cy="32"
        rx="25"
        ry="8.5"
        fill="none"
        stroke="#eef0f8"
        strokeOpacity="0.22"
        strokeWidth="1"
      />
      <circle
        cx="32"
        cy="32"
        r="25"
        fill="none"
        stroke="var(--color-teal)"
        strokeOpacity="0.55"
        strokeWidth="1.6"
      />
      <circle cx="23" cy="21" r="3.2" fill="var(--color-gold)" fillOpacity="0.9" />
    </motion.svg>
  );
}
