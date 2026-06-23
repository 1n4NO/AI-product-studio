"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

/* ─── Types ──────────────────────────────────── */

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

type Action =
  | { type: "ADD";    toast: Toast }
  | { type: "REMOVE"; id: string  };

/* ─── Reducer ────────────────────────────────── */

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case "ADD":    return [action.toast, ...state].slice(0, 5); // cap at 5
    case "REMOVE": return state.filter((t) => t.id !== action.id);
  }
}

/* ─── Context ────────────────────────────────── */

interface ToastContextValue {
  toasts: Toast[];
  toast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // useId gives a stable prefix but we need unique per-call IDs
  const counterRef = useRef(0);
  const prefix = useId();

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    dispatch({ type: "REMOVE", id });
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info", durationMs = 3500) => {
      const id = `${prefix}-${++counterRef.current}`;
      dispatch({ type: "ADD", toast: { id, message, variant, durationMs } });
      const timer = setTimeout(() => dismiss(id), durationMs);
      timers.current.set(id, timer);
    },
    [prefix, dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
