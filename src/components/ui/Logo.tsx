"use client";

import React from "react";
import { cn } from "~/lib/utils";

/**
 * Brand Logo component
 * HOW: Renders the reusable gradient "R" badge used across navbar and footer.
 * WHY: Keeps brand visuals consistent, configurable in one place.
 */
export interface LogoProps {
  /** Square size in pixels (applies to width and height) */
  readonly size?: number;
  /** Optional additional classes for the outer wrapper */
  readonly className?: string;
  /** Accessible label; defaults to "Repur.fi" */
  readonly ariaLabel?: string;
  /** Whether to render a subtle ring for depth */
  readonly ring?: boolean;
}

export function Logo({ size = 40, className, ariaLabel = "Repur.fi", ring = true }: LogoProps) {
  const fontSizePx = Math.max(14, Math.round(size * 0.5));

  return (
    <span
      aria-label={ariaLabel}
      className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-r from-[var(--color-primary-dark)] to-[var(--color-tertiary)]",
        "text-white font-extrabold tracking-tight shadow-md",
        ring && "ring-1 ring-black/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span
        className="leading-none select-none"
        style={{ fontSize: `${fontSizePx}px`, lineHeight: 1 }}
      >
        R
      </span>
    </span>
  );
}

export default Logo;


