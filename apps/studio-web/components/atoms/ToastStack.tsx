"use client";

import { useEffect, useRef, useState } from "react";
import { useToast, type Toast, type ToastVariant } from "@/lib/toast";
import { cn } from "@/lib/cn";

const ICONS: Record<ToastVariant, string> = {
  success: "✓",
  error:   "✕",
  warning: "⚠",
  info:    "ℹ",
};

const COLORS: Record<ToastVariant, { bar: string; icon: string }> = {
  success: { bar: "var(--color-ps-ok)",   icon: "var(--color-ps-ok)"   },
  error:   { bar: "var(--color-ps-err)",  icon: "var(--color-ps-err)"  },
  warning: { bar: "var(--color-ps-warn)", icon: "var(--color-ps-warn)" },
  info:    { bar: "var(--color-ps-accent)", icon: "var(--color-ps-accent-soft)" },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setLeaving(true);
    timerRef.current = setTimeout(onDismiss, 250);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const colors = COLORS[toast.variant];

  return (
    <div
      role="alert"
      aria-live="polite"
      onClick={dismiss}
      className={cn(
        "flex items-start gap-3 cursor-pointer select-none",
        "rounded-xl overflow-hidden border pl-0 pr-4 py-3",
        "transition-all duration-200 ease-out"
      )}
      style={{
        background:   "var(--color-ps-surface)",
        borderColor:  "var(--color-ps-border)",
        boxShadow:    "0 4px 24px rgba(0,0,0,0.35)",
        opacity:      visible && !leaving ? 1 : 0,
        transform:    visible && !leaving ? "translateX(0)" : "translateX(24px)",
        maxWidth:     "360px",
        minWidth:     "260px",
      }}
    >
      {/* Left accent bar */}
      <div className="w-1 self-stretch shrink-0 rounded-r-full" style={{ background: colors.bar }} />

      {/* Icon */}
      <span
        className="text-sm font-bold shrink-0 mt-0.5 w-4 text-center"
        style={{ color: colors.icon }}
      >
        {ICONS[toast.variant]}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm leading-snug" style={{ color: "var(--color-ps-ink)" }}>
        {toast.message}
      </p>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-1 right-0 h-[2px] rounded-full overflow-hidden">
        <div
          className="h-full origin-left"
          style={{
            background:  colors.bar,
            opacity:     0.4,
            animation:   `shrink ${toast.durationMs}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export function ToastStack() {
  const { toasts, dismiss } = useToast();

  return (
    <>
      <style>{`@keyframes shrink { from { transform: scaleX(1) } to { transform: scaleX(0) } }`}</style>
      <div
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-50 flex flex-col-reverse gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
          </div>
        ))}
      </div>
    </>
  );
}
