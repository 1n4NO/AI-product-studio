"use client";

import { cn } from "@/lib/cn";

/* ── Single removable tag ── */
interface ConstraintTagProps {
  value: string;
  onRemove: () => void;
  className?: string;
}

export function ConstraintTag({ value, onRemove, className }: ConstraintTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px]",
        "bg-ps-raised border border-ps-border text-ps-ink-dim",
        className
      )}
    >
      {value}
      <button
        onClick={onRemove}
        aria-label={`Remove constraint: ${value}`}
        className="text-ps-ink-ghost hover:text-ps-err transition-colors leading-none"
      >
        ✕
      </button>
    </span>
  );
}

/* ── Editable list of constraint tags ── */
interface ConstraintListProps {
  constraints: string[];
  onChange: (constraints: string[]) => void;
  className?: string;
}

export function ConstraintList({ constraints, onChange, className }: ConstraintListProps) {
  function remove(index: number) {
    onChange(constraints.filter((_, i) => i !== index));
  }

  function addEmpty() {
    const value = window.prompt("Add constraint:");
    if (value?.trim()) {
      onChange([...constraints, value.trim()]);
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {constraints.map((c, i) => (
        <ConstraintTag key={i} value={c} onRemove={() => remove(i)} />
      ))}

      <button
        onClick={addEmpty}
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px]",
          "border border-dashed border-ps-border text-ps-ink-ghost",
          "hover:border-ps-ink-ghost hover:text-ps-ink-dim transition-colors"
        )}
      >
        + Add constraint
      </button>
    </div>
  );
}
