"use client";

import { useEffect, useState } from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import { cn } from "@/lib/cn";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return "var(--color-ps-ok)";
  if (score >= 60) return "var(--color-ps-accent)";
  if (score >= 40) return "var(--color-ps-warn)";
  return "var(--color-ps-err)";
}

export function ScoreRing({ score, size = 110, strokeWidth = 8, className }: ScoreRingProps) {
  const clamped    = Math.max(0, Math.min(100, score));
  const r          = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - clamped / 100);
  const center     = size / 2;
  const color      = scoreColor(clamped);

  // Animate ring from 0 on mount, then follow score changes
  const [animatedOffset, setAnimatedOffset] = useState(circumference);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimatedOffset(dashoffset));
    return () => cancelAnimationFrame(raf);
  }, [dashoffset]);

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score: ${clamped} out of 100`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={center} cy={center} r={r}
          fill="none"
          stroke="var(--color-ps-border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={center} cy={center} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.85s cubic-bezier(0.34,1.56,0.64,1), stroke 0.4s ease" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={clamped}
          durationMs={850}
          className="font-mono font-extrabold leading-none tabular-nums"
          style={{ fontSize: size * 0.25, color }}
        />
        <span
          className="tracking-widest uppercase"
          style={{ fontSize: size * 0.08, marginTop: 2, color: "var(--color-ps-ink-ghost)" }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}
