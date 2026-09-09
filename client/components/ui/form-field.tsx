import * as React from "react";
import { Asterisk } from "lucide-react";

import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  aside?: React.ReactNode;
  required?: boolean;
  descriptionId?: string;
  errorId?: string;
};

/**
 * Form field wrapper (Direction B, a11y): wires `aria-describedby` (hint +
 * error) and `aria-invalid` onto the child control automatically via id-based
 * cloning, so screen readers announce validation state without call-site work.
 */
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
  const generatedId = React.useId();
  const resolvedDescriptionId = descriptionId ?? `${generatedId}-hint`;
  const resolvedErrorId = errorId ?? `${generatedId}-error`;
  const describedBy =
    [hint ? resolvedDescriptionId : null, hasError ? resolvedErrorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const child = React.isValidElement<
    React.HTMLAttributes<HTMLElement> & { id?: string }
  >(children)
    ? React.cloneElement(children, {
        id: htmlFor && !children.props.id ? htmlFor : children.props.id,
        "aria-describedby":
          children.props["aria-describedby"] ?? describedBy,
        "aria-invalid":
          children.props["aria-invalid"] ?? (hasError || undefined),
      })
    : children;

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="inline-flex items-center gap-1 text-sm font-medium text-ink"
        >
          {label}
          {required ? (
            <Asterisk
              className="size-2.5 text-primary"
              aria-hidden
              strokeWidth={3}
            />
          ) : null}
        </label>
        {aside}
      </div>
      <div data-describedby={describedBy}>{child}</div>
      {hasError ? (
        <p
          id={resolvedErrorId}
          className="text-xs font-medium text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={resolvedDescriptionId}
          className="text-xs leading-relaxed text-ink-muted"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
