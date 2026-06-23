"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  durationMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Counts up (or down) to `value` using requestAnimationFrame.
 * Re-triggers whenever `value` changes.
 */
export function AnimatedNumber({
  value,
  durationMs = 800,
  className,
  style,
}: AnimatedNumberProps) {
  const [displayed, setDisplayed] = useState(0);
  const startRef    = useRef<number | null>(null);
  const fromRef     = useRef(0);
  const rafRef      = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = displayed;
    startRef.current = null;

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(timestamp: number) {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed  = timestamp - startRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased    = easeOutCubic(progress);
      const current  = Math.round(fromRef.current + (value - fromRef.current) * eased);
      setDisplayed(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={className} style={style}>
      {displayed}
    </span>
  );
}
