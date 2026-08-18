"use client";

import { CalendarDays, Clock3, TrainFront } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type TicketCardProps = {
  title: string;
  trainNumber?: string | null;
  departureStationName?: string | null;
  departureStationCode?: string | null;
  arrivalStationName?: string | null;
  arrivalStationCode?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  passengerName?: string | null;
  seatLabel?: string | null;
  coachCode?: string | null;
  statusLabel?: string;
  statusTone?: "default" | "success" | "warning" | "destructive" | "secondary" | "brand" | "positive" | "danger" | "muted";
  className?: string;
  compact?: boolean;
};

const legacyToneMap: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  brand: "default",
  positive: "success",
  danger: "destructive",
  muted: "secondary",
};

function normalizeTone(tone: string | undefined) {
  if (!tone) return "secondary";
  if (tone in legacyToneMap) return legacyToneMap[tone];
  return tone as "default" | "success" | "warning" | "destructive" | "secondary";
}

export function TicketCard({
  title,
  trainNumber,
  departureStationName,
  departureStationCode,
  arrivalStationName,
  arrivalStationCode,
  dateStart,
  dateEnd,
  passengerName,
  seatLabel,
  coachCode,
  statusLabel,
  statusTone = "secondary",
  className,
  compact = false,
}: TicketCardProps) {
  const fromCode = departureStationCode ?? "—";
  const toCode = arrivalStationCode ?? "—";
  const fromName = departureStationName ?? departureStationCode ?? "—";
  const toName = arrivalStationName ?? arrivalStationCode ?? "—";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-sm border border-border bg-card",
        compact ? "" : "shadow-sm",
        className,
      )}
    >
      <div className={cn(
        "grid gap-0",
        compact ? "sm:grid-cols-[1fr_auto]" : "lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,280px)]"
      )}>
        <div className={cn("flex flex-col", compact ? "gap-4 p-5" : "gap-5 p-6 sm:p-7")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              {!compact ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                  Vé điện tử
                </p>
              ) : null}
              <h2 className={cn(
                "font-display font-semibold tracking-tight text-ink",
                compact ? "text-lg" : "text-xl sm:text-2xl"
              )}>
                {title}
              </h2>
              {trainNumber ? (
                <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
                  <TrainFront className="size-3.5 text-primary" aria-hidden />
                  Tàu <span className="font-mono font-semibold tracking-wider text-ink tabular-nums">{trainNumber}</span>
                </p>
              ) : null}
            </div>
            {statusLabel ? (
              <Badge variant={normalizeTone(statusTone)}>{statusLabel}</Badge>
            ) : null}
          </div>

          <div className="grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr]">
            <StationBlock
              label="Ga đi"
              code={fromCode}
              name={fromName}
              compact={compact}
            />
            <RouteTrack compact={compact} />
            <StationBlock
              label="Ga đến"
              code={toCode}
              name={toName}
              align="end"
              compact={compact}
            />
          </div>

          <div className={cn("grid gap-2", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4")}>
            <InfoLine
              icon={<CalendarDays className="size-3.5" aria-hidden />}
              label="Khởi hành"
              value={formatDateTime(dateStart)}
            />
            <InfoLine
              icon={<Clock3 className="size-3.5" aria-hidden />}
              label="Đến nơi"
              value={formatDateTime(dateEnd)}
            />
            {passengerName ? (
              <InfoLine
                icon={<TrainFront className="size-3.5" aria-hidden />}
                label="Hành khách"
                value={passengerName}
              />
            ) : null}
            {seatLabel || coachCode ? (
              <InfoLine
                icon={<TrainFront className="size-3.5" aria-hidden />}
                label="Toa · Ghế"
                value={
                  <span className="flex items-center gap-2">
                    {coachCode ? <span className="font-mono tabular-nums">{coachCode}</span> : null}
                    {coachCode && seatLabel ? <span className="text-ink-muted">·</span> : null}
                    {seatLabel ? <span className="font-mono font-semibold tabular-nums text-ink">{seatLabel}</span> : null}
                  </span>
                }
              />
            ) : null}
          </div>
        </div>

        {!compact ? (
          <>
            <div className="hidden bg-border lg:block" aria-hidden />

            <aside className="flex flex-col gap-4 bg-secondary/70 p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                Mã hành trình
              </p>
              <code className="break-all border border-border bg-card px-3 py-2 font-mono text-xs leading-relaxed text-ink tabular-nums">
                {trainNumber ?? "—"} · {fromCode} → {toCode}
              </code>
              <div className="mt-auto grid grid-cols-3 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                <div className="border border-border bg-card py-2">Vietrail</div>
                <div className="border border-border bg-card py-2">VN</div>
                <div className="border border-border bg-card py-2">e-Ticket</div>
              </div>
            </aside>
          </>
        ) : null}
      </div>
    </article>
  );
}

function StationBlock({
  label,
  code,
  name,
  align = "start",
  compact = false,
}: {
  label: string;
  code?: string;
  name: string;
  align?: "start" | "end";
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-1", align === "end" && "text-right")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
        {label}
      </p>
      <p className={cn(
        "font-display font-bold tracking-tight text-ink tabular-nums",
        compact ? "text-2xl" : "text-2xl sm:text-3xl"
      )}>
        {code}
      </p>
      <p className="text-xs text-ink-muted">{name}</p>
    </div>
  );
}

function RouteTrack({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="flex items-center justify-center self-center px-2"
      aria-hidden
    >
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-primary" />
        <div className="h-px w-12 sm:w-16 bg-primary/30" />
        <TrainFront className={cn("text-primary", compact ? "size-3.5" : "size-4")} />
        <div className="h-px w-12 sm:w-16 bg-primary/30" />
        <span className="size-2 rounded-full bg-primary" />
      </div>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 border border-border bg-secondary/40 px-3 py-2.5">
      <span className="mt-0.5 text-primary shrink-0">{icon}</span>
      <div className="min-w-0 space-y-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}
