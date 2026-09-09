import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  helper,
  className,
}: {
  label: string;
  value: string;
  helper?: string;
  className?: string;
}) {
  return (
    <Card variant="outlined" padding="lg" className={cn("gap-2", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p className="font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
        {value}
      </p>
      {helper ? (
        <p className="text-sm leading-relaxed text-ink-muted">{helper}</p>
      ) : null}
    </Card>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card variant="outlined" padding="lg" className={cn("gap-3", className)}>
      <Skeleton className="h-3 w-20 rounded-sm" />
      <Skeleton className="h-8 w-28 rounded-sm" />
      <Skeleton className="h-4 w-40 rounded-sm" />
    </Card>
  );
}
