import { cn } from "@/lib/cn";

interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export function Spinner({ size = 20, color = "var(--color-ps-accent)", className }: SpinnerProps) {
  const r      = (size - 3) / 2;
  const circum = 2 * Math.PI * r;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("animate-spin", className)}
      aria-hidden="true"
      style={{ animationDuration: "0.7s" }}
    >
      {/* Track */}
      <circle
        cx={center} cy={center} r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeOpacity={0.15}
      />
      {/* Arc */}
      <circle
        cx={center} cy={center} r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={circum}
        strokeDashoffset={circum * 0.75}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
    </svg>
  );
}
