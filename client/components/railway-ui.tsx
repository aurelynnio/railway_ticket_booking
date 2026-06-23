"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Tone = "brand" | "positive" | "warning" | "danger" | "muted";

const toneClasses: Record<Tone, string> = {
  brand: "bg-primary/10 text-primary",
  positive: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <Badge className={cn("border-0 px-2.5 py-1 ring-0 font-medium", toneClasses[tone])}>{label}</Badge>
  );
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
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1.5">
        {eyebrow ? (
          <div className="route-pill">
            <Sparkles className="size-3 text-primary" />
            {eyebrow}
          </div>
        ) : null}
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-semibold tracking-tight text-balance text-foreground sm:text-2xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
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
    <div className="surface-panel px-5 py-4">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {helper ? (
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="quiet-panel flex flex-col items-start gap-3 px-5 py-6">
      <div className="inline-flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
        <Sparkles className="size-4" />
      </div>
      <div className="space-y-1">
        <h3 className="font-heading text-base font-semibold tracking-tight">
          {title}
        </h3>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {href && cta ? (
        <Button asChild variant="outline">
          <Link href={href}>
            {cta}
            <ArrowRight />
          </Link>
        </Button>
      ) : null}
    </div>
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
        <div
          key={item.label}
          className="quiet-panel px-3.5 py-3"
        >
          <p className="text-xs font-medium text-muted-foreground">
            {item.label}
          </p>
          <div className="mt-1.5 text-sm leading-6 text-foreground">{item.value}</div>
        </div>
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
    <div className="surface-panel px-4 py-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </div>
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
    <div className="quiet-panel flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Trang {page}/{Math.max(1, totalPages)}. Tổng {total} bản ghi.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" disabled={page <= 1} onClick={onPrev}>
          Trước
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={totalPages === 0 || page >= totalPages}
          onClick={onNext}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
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
      className="surface-panel block px-5 py-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-heading text-base font-semibold tracking-tight text-foreground">
            {title}
          </p>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="mt-1 inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground">
          <ArrowRight className="size-3.5" />
        </div>
      </div>
    </Link>
  );
}

export function SeatCloud({ labels }: { labels: string[] }) {
  if (labels.length === 0) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
        >
          {label}
        </span>
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
