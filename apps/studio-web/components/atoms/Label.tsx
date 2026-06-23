import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "block text-[11px] font-medium text-ps-ink-dim tracking-wide",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-ps-err" aria-hidden="true">*</span>
      )}
    </label>
  );
}
