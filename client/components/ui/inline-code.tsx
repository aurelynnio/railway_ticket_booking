import type { ReactNode } from "react";

export function InlineCode({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-xs text-ink-muted ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
