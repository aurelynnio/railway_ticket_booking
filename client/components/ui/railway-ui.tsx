"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import {
  Illustration,
  type IllustrationName,
  type IllustrationTone,
} from "@/components/illustrations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type Tone = "default" | "success" | "warning" | "destructive" | "secondary";

const legacyToneMap: Record<string, Tone> = {
  brand: "default",
  positive: "success",
  danger: "destructive",
  muted: "secondary",
  neutral: "secondary",
};

function normalizeTone(tone: string | undefined): Tone {
  if (!tone) return "secondary";
  if (tone in legacyToneMap) return legacyToneMap[tone];
  if (tone === "default" || tone === "success" || tone === "warning" || tone === "destructive" || tone === "secondary") {
    return tone;
  }
  return "secondary";
}

export function StatusBadge({
  label,
  tone = "secondary",
}: {
  label: string;
  tone?: Tone | "brand" | "positive" | "danger" | "muted" | "neutral";
}) {
  const variant = normalizeTone(tone);
  return <Badge variant={variant}>{label}</Badge>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <div className="space-y-1.5">
          <h2 className="font-display text-xl font-semibold tracking-tight text-balance text-ink sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Card variant="outlined" padding="lg" className="gap-2">
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

export function EmptyState({
  title,
  description,
  href,
  cta,
  illustration,
  illustrationTone = "muted",
}: {
  title: string;
  description: string;
  href?: string;
  cta?: string;
  illustration?: IllustrationName;
  illustrationTone?: IllustrationTone;
}) {
  return (
    <Card
      variant="outlined"
      padding="xl"
      className="flex flex-col items-center gap-5 text-center"
    >
      {illustration ? (
        <Illustration
          name={illustration}
          size="sm"
          tone={illustrationTone}
          label={`Minh hoạ cho ${title}`}
        />
      ) : (
        <div className="inline-flex size-10 items-center justify-center rounded-sm border border-border bg-primary-soft text-primary">
          <Sparkles className="size-4" strokeWidth={1.5} />
        </div>
      )}
      <div className="space-y-2">
        <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
          {title}
        </h3>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted mx-auto">
          {description}
        </p>
      </div>
      {href && cta ? (
        <Button asChild variant="outline" size="sm">
          <Link href={href}>
            {cta}
            <ArrowRight className="size-3.5" strokeWidth={1.5} />
          </Link>
        </Button>
      ) : null}
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card variant="outlined" padding="lg" className="gap-3">
      <Skeleton className="h-3 w-20 rounded-sm" />
      <Skeleton className="h-8 w-28 rounded-sm" />
      <Skeleton className="h-4 w-40 rounded-sm" />
    </Card>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4 rounded-sm", i === 0 ? "w-32" : "w-24 flex-1")} />
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card variant="outlined" padding="lg" className="gap-3">
      <Skeleton className="h-5 w-1/3 rounded-sm" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4 rounded-sm", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </Card>
  );
}

export function MetaGrid({
  items,
  columns = 2,
}: {
  items: Array<{ label: string; value: ReactNode }>;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
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

export function FilterBar({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Card variant="outlined" padding="md">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </Card>
  );
}

export function PaginationBar({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <Card
      variant="flat"
      padding="md"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-ink-muted tabular-nums">
        Trang {page}/{Math.max(1, totalPages)}. Tổng {total} bản ghi.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" disabled={page <= 1} onClick={onPrev}>
          Trước
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={totalPages === 0 || page >= totalPages}
          onClick={onNext}
        >
          Sau
        </Button>
      </div>
    </Card>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-xs text-ink-muted border border-border">
      {children}
    </span>
  );
}

export function SurfaceLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block"
    >
      <Card interactive variant="outlined" padding="lg" className="gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-base font-semibold tracking-tight text-ink">
              {title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          </div>
          <div className="mt-0.5 inline-flex size-8 items-center justify-center rounded-sm bg-primary-soft text-primary">
            <ArrowRight className="size-3.5" strokeWidth={1.5} />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function NoticeBox({
  title,
  description,
  tone = "secondary",
}: {
  title: string;
  description: ReactNode;
  tone?: Tone | "positive" | "danger" | "muted" | "brand";
}) {
  const normalizedTone = normalizeTone(tone);
  const toneClass =
    normalizedTone === "success"
      ? "border-success/30 bg-success/5"
      : normalizedTone === "warning"
        ? "border-warning/30 bg-warning/5"
        : normalizedTone === "destructive"
          ? "border-destructive/30 bg-destructive/5"
          : "border-border bg-secondary/50";

  const illustrationName =
    normalizedTone === "success"
      ? "success-state"
      : normalizedTone === "destructive"
        ? "error-state"
        : null;

  const illustrationTone: IllustrationTone =
    normalizedTone === "success"
      ? "positive"
      : normalizedTone === "destructive"
        ? "danger"
        : normalizedTone === "warning"
          ? "warning"
          : "muted";

  return (
    <Card
      variant="flat"
      padding="md"
      className={cn(
        "flex flex-row items-start gap-3 border",
        toneClass,
      )}
    >
      {illustrationName ? (
        <Illustration
          name={illustrationName}
          size="sm"
          tone={illustrationTone}
          label={title}
        />
      ) : null}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <div className="text-sm leading-relaxed text-ink-muted">{description}</div>
      </div>
    </Card>
  );
}

export function DetailBlock({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Card variant="flat" padding="md" className="gap-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <div className="text-sm font-medium leading-relaxed text-ink">{value}</div>
      {hint ? <div className="text-xs leading-relaxed text-ink-muted">{hint}</div> : null}
    </Card>
  );
}

export function SeatCloud({ labels }: { labels: string[] }) {
  if (labels.length === 0) {
    return <span className="text-ink-muted">N/A</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <Badge key={label} variant="outline" className="font-mono tabular-nums">
          {label}
        </Badge>
      ))}
    </div>
  );
}

export function compactId(value: string | null | undefined) {
  if (!value) {
    return "N/A";
  }

  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
