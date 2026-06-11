"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Tone = "brand" | "positive" | "warning" | "danger" | "muted";

const toneClasses: Record<Tone, string> = {
  brand: "bg-foreground text-background",
  positive: "bg-muted text-foreground ring-1 ring-border",
  warning: "bg-muted text-foreground ring-1 ring-border",
  danger: "bg-secondary text-foreground ring-1 ring-border",
  muted: "bg-muted text-muted-foreground ring-1 ring-border",
};

export function StatusBadge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <Badge className={cn("border-0 ring-0", toneClasses[tone])}>{label}</Badge>
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
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <div className="route-pill">
            <Sparkles className="size-3.5 text-primary" />
            {eyebrow}
          </div>
        ) : null}
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-balance text-foreground sm:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
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
    <div className="surface-panel rounded-[1.8rem] px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground">
        {value}
      </p>
      {helper ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
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
    <div className="surface-panel flex flex-col items-start gap-4 rounded-[1.8rem] px-6 py-7">
      <div className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-foreground">
        <Sparkles className="size-5" />
      </div>
      <div className="space-y-1">
        <h3 className="font-heading text-lg font-semibold tracking-[-0.02em]">
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
          className="rounded-[1.35rem] bg-muted/60 px-4 py-4 ring-1 ring-border"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {item.label}
          </p>
          <div className="mt-2 text-sm leading-6 text-foreground">{item.value}</div>
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
    <div className="surface-panel rounded-[1.8rem] px-4 py-4">
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
    <div className="flex flex-col gap-3 rounded-[1.5rem] bg-muted/60 px-4 py-4 ring-1 ring-border sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Trang {page}/{Math.max(1, totalPages)}. Tong {total} ban ghi.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" disabled={page <= 1} onClick={onPrev}>
          Truoc
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
    <span className="rounded-full bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground ring-1 ring-border">
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
      className="surface-panel block rounded-[1.8rem] px-5 py-5 transition-colors hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="mt-1 inline-flex size-10 items-center justify-center rounded-[1rem] bg-muted text-foreground ring-1 ring-border">
          <ArrowRight className="size-4" />
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
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground ring-1 ring-border"
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
