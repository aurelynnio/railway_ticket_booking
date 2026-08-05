import type { ReactNode } from "react";
import { Asterisk } from "lucide-react";

import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  aside?: ReactNode;
  required?: boolean;
  descriptionId?: string;
  errorId?: string;
};

export function FormField({
  label,
  children,
  error,
  hint,
  htmlFor,
  className,
  aside,
  required = false,
  descriptionId,
  errorId,
}: FormFieldProps) {
  const hasError = Boolean(error);
  const describedBy =
    [hint ? descriptionId : null, hasError ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted"
        >
          {label}
          {required ? (
            <Asterisk
              className="size-3 text-brand"
              aria-hidden
              strokeWidth={3}
            />
          ) : null}
        </label>
        {aside}
      </div>
      <div data-describedby={describedBy}>{children}</div>
      {hasError ? (
        <p
          id={errorId}
          className="text-xs font-medium text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={descriptionId}
          className="text-xs leading-5 text-ink-muted"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
