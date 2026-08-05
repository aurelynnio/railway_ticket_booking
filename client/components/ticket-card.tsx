"use client";

import { CalendarDays, Clock3, TrainFront, User2 } from "lucide-react";

import { StatusBadge } from "@/components/railway-ui";
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
  statusTone?: "brand" | "positive" | "warning" | "danger" | "muted";
  className?: string;
};

/**
 * Visual ticket card - decorative perforation in the middle,
 * used as a hero on ticket detail and confirmed ticket pages.
 */
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
  statusTone = "muted",
  className,
}: TicketCardProps) {
  const fromName = departureStationName ?? departureStationCode ?? "—";
  const toName = arrivalStationName ?? arrivalStationCode ?? "—";

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.4fr)_1px_minmax(0,1fr)]">
        <div className="flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Vé điện tử
              </p>
              <h2 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {title}
              </h2>
              {trainNumber ? (
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted">
                  <TrainFront className="size-3.5 text-brand" aria-hidden />
                  Tàu {trainNumber}
                </p>
              ) : null}
            </div>
            {statusLabel ? (
              <StatusBadge label={statusLabel} tone={statusTone} />
            ) : null}
          </div>

          <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <StationBlock
              label="Ga đi"
              code={departureStationCode ?? undefined}
              name={fromName}
            />
            <RouteTrack />
            <StationBlock
              label="Ga đến"
              code={arrivalStationCode ?? undefined}
              name={toName}
              align="end"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
                icon={<User2 className="size-3.5" aria-hidden />}
                label="Hành khách"
                value={passengerName}
              />
            ) : null}
            {seatLabel || coachCode ? (
              <InfoLine
                icon={<TrainFront className="size-3.5" aria-hidden />}
                label="Toa / Ghế"
                value={[coachCode, seatLabel].filter(Boolean).join(" · ")}
              />
            ) : null}
          </div>
        </div>

        <div
          className="hidden bg-border lg:block"
          aria-hidden
        />

        <aside className="flex flex-col gap-4 bg-secondary/55 p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Mã hành trình
          </p>
          <code className="break-all rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-ink">
            {trainNumber ?? "—"} · {departureStationCode ?? "—"} → {arrivalStationCode ?? "—"}
          </code>
          <div className="mt-auto grid grid-cols-3 gap-2 text-center text-[10px] font-medium uppercase tracking-wider text-ink-muted">
            <div className="rounded-md border border-border/80 bg-card py-1.5">Vietrail</div>
            <div className="rounded-md border border-border/80 bg-card py-1.5">VN</div>
            <div className="rounded-md border border-border/80 bg-card py-1.5">e-Ticket</div>
          </div>
        </aside>
      </div>
    </article>
  );
}

function StationBlock({
  label,
  code,
  name,
  align = "start",
}: {
  label: string;
  code?: string;
  name: string;
  align?: "start" | "end";
}) {
  return (
    <div className={cn("space-y-1.5", align === "end" && "text-right")}>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p className="font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {code ?? name}
      </p>
      <p className="text-xs text-ink-muted">{name}</p>
    </div>
  );
}

function RouteTrack() {
  return (
    <div
      className="flex items-center justify-center self-center"
      aria-hidden
    >
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-brand" />
        <div className="transit-line h-px w-16 rounded-full" />
        <TrainFront className="size-4 text-brand" />
        <div className="transit-line h-px w-16 rounded-full" />
        <span className="size-2 rounded-full bg-brand" />
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
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-border/70 bg-background px-3.5 py-2.5">
      <span className="mt-0.5 text-brand">{icon}</span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}
