import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetaGrid({
  items,
  columns = 2,
  className,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  columns?: 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
        className,
      )}
    >
      {items.map((item) => (
        <Card
          key={item.label}
          variant="flat"
          padding="md"
          className="gap-1.5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            {item.label}
          </p>
          <div className="text-sm leading-relaxed text-ink">{item.value}</div>
        </Card>
      ))}
    </div>
  );
}
