"use client";

import type { Tone } from "@product-studio/shared-types";
import { cn } from "@/lib/cn";

const TONES: { value: Tone; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Authoritative and polished" },
  { value: "friendly",     label: "Friendly",     description: "Warm and approachable" },
  { value: "bold",         label: "Bold",         description: "Direct and high-energy" },
  { value: "playful",      label: "Playful",      description: "Light and creative" },
  { value: "minimal",      label: "Minimal",      description: "Stripped back, calm" },
];

interface ToneSelectorProps {
  value: Tone;
  onChange: (tone: Tone) => void;
  className?: string;
}

export function ToneSelector({ value, onChange, className }: ToneSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Content tone"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {TONES.map((tone) => {
        const selected = tone.value === value;
        return (
          <button
            key={tone.value}
            role="radio"
            aria-checked={selected}
            title={tone.description}
            onClick={() => onChange(tone.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors",
              selected
                ? "bg-ps-accent-dim border-ps-accent text-ps-accent-soft"
                : "bg-transparent border-ps-border text-ps-ink-ghost hover:border-ps-ink-ghost hover:text-ps-ink-dim"
            )}
          >
            {tone.label}
          </button>
        );
      })}
    </div>
  );
}
