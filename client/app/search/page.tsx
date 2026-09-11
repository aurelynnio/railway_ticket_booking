"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useDeferredValue } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  CalendarDays,
  Filter,
  MapPin,
  Search as SearchIcon,
  TrainFront,
  Sun,
  Sunset,
  Moon,
  Armchair,
  Bed,
} from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchTrips, useStationSuggestions } from "@/hooks/search.hook";
import { formatCurrency } from "@/lib/formatters";
import { STATIONS } from "@/lib/stations";
import { cn } from "@/lib/utils";

type SortFilter = "recommended" | "price" | "departure";
type TimeFilter = "all" | "morning" | "afternoon" | "evening";
type SeatFilter = "all" | "seat" | "sleeper";

const sortOptions: Array<{ label: string; value: SortFilter }> = [
  { label: "Phù hợp nhất", value: "recommended" },
  { label: "Giá thấp trước", value: "price" },
  { label: "Khởi hành sớm", value: "departure" },
];

function SearchPageContent() {
  const params = useSearchParams();
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");
  const [date, setDate] = useState(params.get("date") ?? "");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortFilter>("recommended");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [seatFilter, setSeatFilter] = useState<SeatFilter>("all");

  useEffect(() => {
    const t = setTimeout(() => {
      setFrom(params.get("from") ?? "");
      setTo(params.get("to") ?? "");
      setDate(params.get("date") ?? "");
    }, 0);
    return () => clearTimeout(t);
  }, [params]);

  const dFrom = useDeferredValue(from);
  const dTo = useDeferredValue(to);
  const dDate = useDeferredValue(date);
  const dPage = useDeferredValue(page);

  const stationQuery = useStationSuggestions();
  const stations = stationQuery.data?.length ? stationQuery.data : STATIONS;

  const query = useSearchTrips({
    from: dFrom || undefined,
    to: dTo || undefined,
    date: dDate || undefined,
    sort,
    timeOfDay: timeFilter === "all" ? undefined : timeFilter,
    seatClass: seatFilter === "all" ? undefined : seatFilter,
    page: dPage,
    limit: 10,
  });

  const trips = query.data?.data ?? [];
  const pagination = query.data?.pagination;
  const hasFilter = Boolean(from || to || date || timeFilter !== "all" || seatFilter !== "all");

  const clearAll = () => {
    setFrom("");
    setTo("");
    setDate("");
    setTimeFilter("all");
    setSeatFilter("all");
    setSort("recommended");
    setPage(1);
  };

  return (
    <AppLayout>
      {/* Page header */}
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            <span className="h-px w-10 bg-accent" />
            Tìm kiếm
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Tìm chuyến tàu
          </h1>
          <p className="mt-2 max-w-xl text-base text-ink-muted">
            Lọc theo ga đi, ga đến, ngày khởi hành và hạng ghế để tìm chuyến phù hợp nhất.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter bar */}
        <Card variant="outlined" padding="lg" className="mb-8">
          <div className="grid gap-3 items-end sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_1fr_1fr_auto]">
            <FilterField label="Ga đi">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                <Select
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                >
                  <option value="">Tất cả ga đi</option>
                  {stations.map((s) => (
                    <option key={s.code} value={s.code ?? ""}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </Select>
              </div>
            </FilterField>

            <button
              type="button"
              onClick={() => {
                setFrom(to);
                setTo(from);
                setPage(1);
              }}
              className="flex size-11 items-center justify-center rounded-lg bg-card text-ink-muted shadow-sm transition-colors hover:shadow-md hover:text-primary"
              aria-label="Đổi ga"
            >
              <ArrowLeftRight className="size-4" />
            </button>

            <FilterField label="Ga đến">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
                <Select
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                >
                  <option value="">Tất cả ga đến</option>
                  {stations.map((s) => (
                    <option key={s.code} value={s.code ?? ""}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </Select>
              </div>
            </FilterField>

            <FilterField label="Ngày đi">
              <div className="relative">
                <DatePicker
                  value={date}
                  onChange={(v) => {
                    setDate(v);
                    setPage(1);
                  }}
                  placeholder="Tất cả ngày"
                  minDate={new Date()}
                  className="pl-9"
                  icon={<CalendarDays className="size-4 shrink-0 text-ink-muted" />}
                />
              </div>
            </FilterField>

            <FilterField label="Sắp xếp">
              <Select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortFilter);
                  setPage(1);
                }}
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </FilterField>

            <Button
              variant="outline"
              onClick={clearAll}
              disabled={!hasFilter && sort === "recommended"}
              className="gap-2"
            >
              <Filter className="size-3.5" />
              Đặt lại
            </Button>
          </div>

          {/* Secondary filters */}
          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Giờ:
              </span>
              {([
                { v: "all", l: "Tất cả", i: null },
                { v: "morning", l: "Sáng", i: Sun },
                { v: "afternoon", l: "Chiều", i: Sunset },
                { v: "evening", l: "Tối", i: Moon },
              ] as const).map((t) => (
                <button
                  key={t.v}
                  onClick={() => {
                    setTimeFilter(t.v);
                    setPage(1);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    timeFilter === t.v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-ink-muted hover:text-ink"
                  )}
                >
                  {t.i && <t.i className="size-3" />}
                  {t.l}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Ghế:
              </span>
              {([
                { v: "all", l: "Tất cả", i: null },
                { v: "seat", l: "Ngồi", i: Armchair },
                { v: "sleeper", l: "Nằm", i: Bed },
              ] as const).map((s) => (
                <button
                  key={s.v}
                  onClick={() => {
                    setSeatFilter(s.v);
                    setPage(1);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    seatFilter === s.v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-ink-muted hover:text-ink"
                  )}
                >
                  {s.i && <s.i className="size-3" />}
                  {s.l}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Results summary */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <SearchIcon className="size-4 text-primary" />
            <span>
              <span className="font-semibold text-ink">
                {pagination?.total ?? trips.length}
              </span>{" "}
              chuyến phù hợp
            </span>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <span className="text-sm text-ink-muted">
                Trang {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Sau
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        {query.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="mt-4 h-16 w-full" />
                <Skeleton className="mt-4 h-10 w-32" />
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <Card variant="outlined" padding="lg" className="text-center">
            <p className="font-display text-lg font-semibold text-ink">
              Không tải được kết quả
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Vui lòng kiểm tra đường truyền và thử lại.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => query.refetch()}>
              Thử lại
            </Button>
          </Card>
        ) : trips.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-16">
            <TrainFront className="mx-auto size-12 text-ink-subtle" />
            <p className="mt-4 font-display text-xl font-semibold text-ink">
              Không tìm thấy chuyến phù hợp
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Thử thay đổi ngày hoặc xóa bộ lọc.
            </p>
            <Button variant="outline" className="mt-5" onClick={clearAll}>
              Xóa bộ lọc
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <Link key={trip.ticketId} href={`/tickets/${trip.ticketId}`} className="group block">
                <Card variant="outlined" padding="lg" interactive className="transition-all hover:shadow-md">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                    {/* Route info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="default" className="font-mono">
                          <TrainFront className="size-3" />
                          Tàu {trip.trainNumber ?? "—"}
                        </Badge>
                        <Badge
                          variant={
                            trip.availableSeats > 5
                              ? "success"
                              : trip.availableSeats > 0
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {trip.availableSeats > 0
                            ? `${trip.availableSeats} chỗ`
                            : "Hết chỗ"}
                        </Badge>
                        {trip.title && (
                          <span className="text-xs text-ink-muted">{trip.title}</span>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <div>
                          <p className="font-display text-2xl font-semibold tabular-nums text-ink">
                            {extractTime(trip.dateStart)}
                          </p>
                          <p className="text-sm font-medium text-ink">
                            {trip.from.name ?? trip.from.code}
                          </p>
                        </div>
                        <div className="flex flex-1 flex-col items-center">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
                            {calcDuration(trip.dateStart, trip.dateEnd)}
                          </span>
                          <div className="mt-1.5 flex w-full max-w-[160px] items-center gap-1">
                            <span className="size-2 rounded-full border-2 border-primary bg-primary-soft" />
                            <div className="h-px flex-1 bg-border" />
                            <span className="size-2 rounded-full border-2 border-primary bg-primary" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-2xl font-semibold tabular-nums text-ink">
                            {extractTime(trip.dateEnd)}
                          </p>
                          <p className="text-sm font-medium text-ink">
                            {trip.to.name ?? trip.to.code}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {trip.seatClasses?.map((c: string) => (
                          <Badge key={c} variant="outline" className="text-[11px]">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex flex-col items-start gap-3 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 lg:items-end">
                      <div className="text-left lg:text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                          Giá từ
                        </p>
                        <p className="font-display text-3xl font-bold tabular-nums text-primary">
                          {formatCurrency(trip.minPrice)}
                        </p>
                      </div>
                      <Button asChild variant="accent" size="lg" className="w-full gap-2 lg:w-auto">
                        <Link href={`/tickets/${trip.ticketId}`}>
                          Chọn vé
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function extractTime(value: string | null | undefined): string {
  if (!value) return "—:—";
  try {
    return new Date(value).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—:—";
  }
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
