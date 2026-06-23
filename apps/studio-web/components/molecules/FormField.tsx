"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { Textarea } from "@/components/atoms/Textarea";
import { cn } from "@/lib/cn";

interface BaseProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}

interface InputFieldProps extends BaseProps {
  as?: "input";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

interface TextareaFieldProps extends BaseProps {
  as: "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

type FormFieldProps = InputFieldProps | TextareaFieldProps;

export function FormField(props: FormFieldProps) {
  const { id, label, required, error, hint, className } = props;

  const control: ReactNode =
    props.as === "textarea" ? (
      <Textarea
        id={id}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        rows={props.rows ?? 3}
        hasError={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={!!error}
      />
    ) : (
      <Input
        id={id}
        type={(props as InputFieldProps).type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={(props as InputFieldProps).placeholder}
        hasError={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        aria-invalid={!!error}
      />
    );

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>

      {control}

      {error && (
        <p id={`${id}-error`} className="text-[11px] text-ps-err" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={`${id}-hint`} className="text-[11px] text-ps-ink-ghost">
          {hint}
        </p>
      )}
    </div>
  );
}
