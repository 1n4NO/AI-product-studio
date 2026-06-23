import { cn } from "@/lib/cn";

interface ScoreRingProps {
  score: number;          // 0–100
  size?: number;          // px, default 110
  strokeWidth?: number;   // default 8
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return "var(--color-ps-ok)";
  if (score >= 60) return "var(--color-ps-accent)";
  if (score >= 40) return "var(--color-ps-warn)";
  return "var(--color-ps-err)";
}

export function ScoreRing({
  score,
  size = 110,
  strokeWidth = 8,
  className,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - clamped / 100);
  const center = size / 2;
  const color = scoreColor(clamped);

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
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--color-ps-border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-extrabold leading-none tabular-nums"
          style={{ fontSize: size * 0.25, color }}
        >
          {clamped}
        </span>
        <span
          className="text-ps-ink-ghost tracking-widest uppercase"
          style={{ fontSize: size * 0.08, marginTop: 2 }}
        >
          / 100
        </span>
      </div>
    </div>
  );
}
