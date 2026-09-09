"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  TrainFront,
} from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTickets } from "@/hooks/ticket.hook";
import { useStationSuggestions } from "@/hooks/search.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { STATIONS } from "@/lib/stations";

export default function TicketsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const stationQuery = useStationSuggestions();
  const stations = stationQuery.data?.length ? stationQuery.data : STATIONS;

  const query = useTickets({ page, limit: 12 });
  const tickets = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  const filtered = tickets.filter(
    (t) =>
      (!from || t.departureStationCode === from) && (!to || t.arrivalStationCode === to)
  );

  return (
    <AppLayout>
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            <span className="h-px w-10 bg-accent" />
            Danh mục
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Vé tàu đang mở bán
          </h1>
          <p className="mt-2 max-w-xl text-base text-ink-muted">
            Tất cả các chuyến tàu hiện có thể đặt vé trực tuyến.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Quick filter */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-ink-muted" />
            <Select value={from} onChange={(e) => setFrom(e.target.value)} className="w-44">
              <option value="">Tất cả ga đi</option>
              {stations.map((s) => (
                <option key={s.code} value={s.code ?? ""}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-ink-muted" />
            <Select value={to} onChange={(e) => setTo(e.target.value)} className="w-44">
              <option value="">Tất cả ga đến</option>
              {stations.map((s) => (
                <option key={s.code} value={s.code ?? ""}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Grid */}
        {query.isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="mt-4 h-12 w-full" />
                <Skeleton className="mt-4 h-8 w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-16">
            <TrainFront className="mx-auto size-12 text-ink-subtle" />
            <p className="mt-4 font-display text-xl font-semibold text-ink">
              Không có vé phù hợp
            </p>
            <p className="mt-2 text-sm text-ink-muted">Thử thay đổi bộ lọc.</p>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="group"
              >
                <Card variant="outlined" padding="lg" interactive className="flex h-full flex-col">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="font-mono">
                      <TrainFront className="size-3" />
                      {ticket.trainNumber ?? "—"}
                    </Badge>
                    <Badge
                      variant={
                        (ticket.ticketItems?.reduce((s, i) => s + (i.stockAvailable ?? 0), 0) ?? 0) > 5
                          ? "success"
                          : (ticket.ticketItems?.reduce((s, i) => s + (i.stockAvailable ?? 0), 0) ?? 0) > 0
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {(ticket.ticketItems?.reduce((s, i) => s + (i.stockAvailable ?? 0), 0) ?? 0) > 0 ? "Còn chỗ" : "Hết chỗ"}
                    </Badge>
                  </div>

                  <div className="mt-5 space-y-1">
                    <p className="font-display text-lg font-semibold text-ink">
                      {ticket.departureStationName ?? ticket.departureStationCode}{" "}
                      <span className="text-primary">→</span>{" "}
                      {ticket.arrivalStationName ?? ticket.arrivalStationCode}
                    </p>
                    {ticket.title && (
                      <p className="text-sm text-ink-muted">{ticket.title}</p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-ink-muted">
                      <CalendarDays className="size-3.5 text-primary" />
                      <span className="font-mono tabular-nums text-ink">
                        {compactDate(ticket.dateStart)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-ink-muted">
                      <Clock3 className="size-3.5 text-primary" />
                      <span className="font-mono tabular-nums text-ink">
                        {calcDuration(ticket.dateStart, ticket.dateEnd)}
                      </span>
                    </span>
                  </div>

                  <div className="mt-auto flex items-end justify-between pt-5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                        Giá từ
                      </p>
                      <p className="font-display text-2xl font-bold tabular-nums text-primary">
                        {formatCurrency(ticket.ticketItems?.[0]?.priceOriginal ?? "0")}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Chi tiết <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trang trước
            </Button>
            <span className="text-sm text-ink-muted">
              {page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              Trang sau
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function compactDate(value: string | null | undefined) {
  const f = formatDateTime(value);
  return f === "N/A" ? f : f.split(",")[0];
}

function calcDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return "—";
  try {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h === 0) return `${m}p`;
    if (m === 0) return `${h}h`;
    return `${h}h${m}p`;
  } catch {
    return "—";
  }
}
