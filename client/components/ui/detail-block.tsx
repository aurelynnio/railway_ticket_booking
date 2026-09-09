import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DetailBlock({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <Card variant="flat" padding="md" className={cn("gap-1.5", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <div className="text-sm font-medium leading-relaxed text-ink">{value}</div>
      {hint ? <div className="text-xs leading-relaxed text-ink-muted">{hint}</div> : null}
    </Card>
  );
}
