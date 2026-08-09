"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode, useDeferredValue, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Filter,
  Search as SearchIcon,
  Ticket,
  TrainFront,
  Wallet,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { AnimatedSection } from "@/components/motion/animated-section";
import { TicketNotch } from "@/components/ticket-notch";
import {
  EmptyState,
  PaginationBar,
} from "@/components/railway-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useSearchTrips,
  useStationSuggestions,
} from "@/hooks/search.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type SortFilter = "recommended" | "price" | "departure";

export const STATIONS = [
  { name: "Hà Nội", code: "HAN" },
  { name: "Huế", code: "HUE" },
  { name: "Đà Nẵng", code: "DAD" },
  { name: "Nha Trang", code: "NTR" },
  { name: "Sài Gòn", code: "SGN" },
] as const;

const sortOptions: Array<{ label: string; value: SortFilter }> = [
  { label: "Phù hợp nhất", value: "recommended" },
  { label: "Giá thấp trước", value: "price" },
  { label: "Khởi hành sớm", value: "departure" },
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(() => searchParams.get("from") ?? "");
  const [to, setTo] = useState(() => searchParams.get("to") ?? "");
  const [date, setDate] = useState(() => searchParams.get("date") ?? "");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortFilter>("recommended");

  useEffect(() => {
    const urlFrom = searchParams.get("from") ?? "";
    const urlTo = searchParams.get("to") ?? "";
    const urlDate = searchParams.get("date") ?? "";
    const timer = window.setTimeout(() => {
      setFrom(urlFrom);
      setTo(urlTo);
      setDate(urlDate);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const deferredFrom = useDeferredValue(from);
  const deferredTo = useDeferredValue(to);
  const deferredDate = useDeferredValue(date);
  const deferredPage = useDeferredValue(page);

  const query = useSearchTrips({
    from: deferredFrom || undefined,
    to: deferredTo || undefined,
    date: deferredDate || undefined,
    page: deferredPage,
    limit: 8,
  });
  const stationSuggestionsQuery = useStationSuggestions();
  const stationOptions =
    stationSuggestionsQuery.data && stationSuggestionsQuery.data.length > 0
      ? stationSuggestionsQuery.data
      : STATIONS;

  const trips = [...(query.data?.data ?? [])].sort((left, right) => {
    if (sort === "price") {
      return (left.minPrice ?? Number.MAX_SAFE_INTEGER) - (right.minPrice ?? Number.MAX_SAFE_INTEGER);
    }

    if (sort === "departure") {
      return compareDate(left.dateStart, right.dateStart);
    }

    return right.availableSeats - left.availableSeats;
  });

  const pagination = query.data?.pagination;
  const availableSeats = trips.reduce((total, trip) => total + trip.availableSeats, 0);
  const cheapest = trips.reduce<number | null>((min, trip) => {
    if (trip.minPrice === null) {
      return min;
    }
    if (min === null || trip.minPrice < min) {
      return trip.minPrice;
    }
    return min;
  }, null);

  const hasActiveFilter = Boolean(from || to || date);
  const activeFilterChips = [
    from && { label: `Ga đi: ${getStationName(stationOptions, from)}`, onClear: () => setFrom("") },
    to && { label: `Ga đến: ${getStationName(stationOptions, to)}`, onClear: () => setTo("") },
    date && { label: `Ngày đi: ${formatDate(date)}`, onClear: () => setDate("") },
  ].filter(Boolean) as Array<{ label: string; onClear: () => void }>;

  return (
    <AppShell
      title="Tìm vé theo tuyến, thời gian và nhu cầu đặt chỗ"
      description="Lọc theo ga đi, ga đến và ngày khởi hành để tìm các chuyến còn chỗ, giá phù hợp và đường dẫn đặt vé."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/tickets">Danh mục vé</Link>
          </Button>
          <Button asChild>
            <Link href="/profile/orders">
              Đơn của tôi
              <ArrowRight />
            </Link>
          </Button>
        </div>
      }
    >
      <Card
        variant="outlined"
        className="px-5 py-5 sm:px-6 sm:py-6 xl:sticky xl:top-20 xl:z-20 xl:shadow-sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <span className="eyebrow">Bộ lọc hành trình</span>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl">
                Tìm chuyến tàu
              </h2>
              <p className="text-sm text-ink-muted">
                Chọn tuyến, ngày và cách sắp xếp để thu hẹp danh sách.
              </p>
            </div>
            <Badge variant={query.isFetching ? "warning" : "default"} className="shrink-0">
              {query.isFetching ? "Đang đồng bộ" : "Kết quả mới"}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto]">
            <FilterField label="Ga đi" htmlFor="filter-from">
              <Select
                id="filter-from"
                value={from}
                onChange={(event) => {
                  setPage(1);
                  setFrom(event.target.value);
                }}
              >
                <option value="">Tất cả ga đi</option>
                {stationOptions.map((station) => (
                  <option key={station.code ?? station.name} value={station.code ?? ""}>
                    {station.name} ({station.code})
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Ga đến" htmlFor="filter-to">
              <Select
                id="filter-to"
                value={to}
                onChange={(event) => {
                  setPage(1);
                  setTo(event.target.value);
                }}
              >
                <option value="">Tất cả ga đến</option>
                {stationOptions.map((station) => (
                  <option key={station.code ?? station.name} value={station.code ?? ""}>
                    {station.name} ({station.code})
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Ngày đi" htmlFor="filter-date">
              <Input
                id="filter-date"
                type="date"
                value={date}
                onChange={(event) => {
                  setPage(1);
                  setDate(event.target.value);
                }}
              />
            </FilterField>
            <FilterField label="Sắp xếp" htmlFor="filter-sort">
              <Select
                id="filter-sort"
                value={sort}
                onChange={(event) => {
                  setPage(1);
                  setSort(event.target.value as SortFilter);
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FilterField>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFrom("");
                  setTo("");
                  setDate("");
                  setPage(1);
                  setSort("recommended");
                }}
                disabled={!hasActiveFilter && sort === "recommended"}
                className="w-full"
              >
                <Filter className="size-3.5" aria-hidden />
                Đặt lại
              </Button>
            </div>
          </div>

          {activeFilterChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Đang lọc:</span>
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={chip.onClear}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-primary hover:text-primary"
                >
                  {chip.label}
                  <X className="size-3" aria-hidden />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </Card>

      <section
        aria-label="Tóm tắt kết quả"
        className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3"
      >
        <SummaryStat
          label="Chuyến phù hợp"
          value={query.isLoading ? "—" : String(trips.length)}
          helper="Sau khi áp dụng bộ lọc"
          accent="primary"
        />
        <SummaryStat
          label="Chỗ trống tổng"
          value={query.isLoading ? "—" : String(availableSeats)}
          helper="Khả dụng ở thời điểm hiện tại"
        />
        <SummaryStat
          label="Giá từ"
          value={query.isLoading ? "—" : cheapest !== null ? formatCurrency(cheapest) : "—"}
          helper="Một chiều, đã bao gồm thuế"
          isPrice
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="eyebrow">Kết quả</span>
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Hành trình phù hợp
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Quét nhanh thời gian, hạng ghế và mức giá trước khi mở chi tiết.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink-muted">
            <SearchIcon className="size-3.5 text-primary" aria-hidden />
            Kết quả tự cập nhật theo bộ lọc hiện tại.
          </div>
        </div>

        {query.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse border border-border bg-card"
              />
            ))}
          </div>
        ) : null}

        {query.isError ? (
          <EmptyState
            title="Không tải được kết quả"
            description="Không thể tải kết quả lúc này. Vui lòng thử lại sau."
            illustration="error-state"
            illustrationTone="danger"
          />
        ) : null}

        {!query.isLoading && !query.isError && trips.length === 0 ? (
          <EmptyState
            title="Chưa có chuyến phù hợp"
            description="Thử đổi ga đi, ga đến hoặc bỏ ngày khởi hành để mở rộng tồn vé."
            href="/tickets"
            cta="Mở danh mục vé"
            illustration="search-empty"
            illustrationTone="muted"
          />
        ) : null}

        <AnimatedSection
          scopeKey={`results-${trips.length}-${deferredPage}-${sort}`}
          className="grid gap-3"
        >
          {trips.map((trip) => {
            const availabilityBadge =
              trip.availableSeats === 0
                ? { variant: "destructive" as const, label: "Hết chỗ" }
                : trip.availableSeats <= 5
                  ? { variant: "warning" as const, label: `Sắp hết — ${trip.availableSeats} chỗ` }
                  : { variant: "success" as const, label: "Còn chỗ" };

            return (
              <TicketNotch key={trip.ticketId}>
                <Card
                  interactive
                  padding="lg"
                  className="lg:grid-cols-[minmax(0,1fr)_200px] lg:items-stretch"
                >
                  <div className="flex flex-col gap-4 lg:pr-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default" className="font-mono tabular-nums">
                        <TrainFront className="size-3" />
                        {trip.trainNumber ?? compactTripCode(trip.ticketId)}
                      </Badge>
                      <Badge variant={availabilityBadge.variant}>
                        {availabilityBadge.label}
                      </Badge>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Khởi hành</p>
                        <p className="font-mono text-2xl font-bold tabular-nums text-ink">
                          {extractTime(trip.dateStart)}
                        </p>
                        <p className="text-sm font-medium text-ink">
                          {trip.from.name ?? trip.from.code ?? "?"}
                        </p>
                        <p className="text-xs text-ink-subtle font-mono tabular-nums">
                          {trip.from.code ?? ""}
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-1 sm:px-4">
                        <div className="flex w-full items-center gap-2">
                          <span className="h-2 w-2 rounded-full border-2 border-primary bg-primary-soft" />
                          <div className="h-px flex-1 bg-border-strong relative">
                            <span className="absolute inset-x-0 top-0 h-px bg-primary/40" style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--primary) 0, var(--primary) 4px, transparent 4px, transparent 8px)" }} />
                          </div>
                          <span className="h-2 w-2 rounded-full border-2 border-primary bg-primary" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-subtle">
                          {calcDuration(trip.dateStart, trip.dateEnd)}
                        </span>
                      </div>

                      <div className="space-y-1 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Đến</p>
                        <p className="font-mono text-2xl font-bold tabular-nums text-ink">
                          {extractTime(trip.dateEnd)}
                        </p>
                        <p className="text-sm font-medium text-ink">
                          {trip.to.name ?? trip.to.code ?? "?"}
                        </p>
                        <p className="text-xs text-ink-subtle font-mono tabular-nums">
                          {trip.to.code ?? ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-ink-muted">
                        <CalendarDays className="size-3.5 text-primary" />
                        <span className="font-mono tabular-nums text-ink">{compactDate(trip.dateStart)}</span>
                      </span>
                      {trip.trainNumber ? (
                        <span className="inline-flex items-center gap-1.5 text-ink-muted">
                          <Clock3 className="size-3.5 text-primary" />
                          <span className="text-ink">{trip.title ?? "Tàu khách"}</span>
                        </span>
                      ) : null}
                      <div className="flex flex-wrap gap-1.5">
                        {trip.seatClasses.map((item) => (
                          <Badge key={`${trip.ticketId}-${item}`} variant="outline">
                            {item}
                          </Badge>
                        ))}
                        {trip.seatTypes.map((item) => (
                          <Badge key={`${trip.ticketId}-${item}-type`} variant="secondary">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-4 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Giá từ</p>
                      <p className="font-mono text-3xl font-bold tabular-nums text-ink leading-none">
                        {formatCurrency(trip.minPrice)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        <span className="font-medium text-ink">{trip.availableSeats}</span> chỗ đang mở
                      </p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-ink-muted">
                        <span>Mã tuyến</span>
                        <span className="font-mono tabular-nums font-medium text-ink">
                          {trip.from.code ?? "?"} → {trip.to.code ?? "?"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-ink-muted">
                        <span>Hạng ghế</span>
                        <span className="font-medium text-ink">
                          {trip.seatClasses.length + trip.seatTypes.length} lựa chọn
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button asChild size="lg" className="w-full">
                        <Link href={`/tickets/${trip.ticketId}`}>
                          Chọn chuyến
                          <ArrowRight />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </TicketNotch>
            );
          })}
        </AnimatedSection>

        {pagination ? (
          <PaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPrev={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() =>
              setPage((current) =>
                pagination.totalPages === 0
                  ? current
                  : Math.min(pagination.totalPages, current + 1),
              )
            }
          />
        ) : null}
      </section>

      <section
        aria-label="Truy cập nhanh"
        className="grid gap-3 md:grid-cols-3"
      >
        <SupportCard
          icon={<Ticket className="size-5" aria-hidden />}
          title="Vé của tôi"
          description="Theo dõi đơn đã đặt và vé đã phát hành."
          href="/profile/orders"
        />
        <SupportCard
          icon={<Wallet className="size-5" aria-hidden />}
          title="Thanh toán"
          description="Kiểm tra giao dịch và trạng thái thanh toán."
          href="/payments"
        />
        <SupportCard
          icon={<TrainFront className="size-5" aria-hidden />}
          title="Danh mục vé"
          description="Xem thêm các tuyến đang mở bán."
          href="/tickets"
        />
      </section>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  );
}

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

function SummaryStat({
  label,
  value,
  helper,
  accent,
  isPrice = false,
}: {
  label: string;
  value: string;
  helper?: string;
  accent?: "primary";
  isPrice?: boolean;
}) {
  return (
    <div className="bg-card px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums",
          accent === "primary" ? "text-primary" : "text-ink",
          isPrice && "font-mono",
        )}
      >
        {value}
      </p>
      {helper ? <p className="mt-0.5 text-sm text-ink-muted">{helper}</p> : null}
    </div>
  );
}

function SupportCard({
  icon,
  title,
  description,
  href,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <Card interactive padding="lg">
        <div className="flex h-11 w-11 items-center justify-center border border-primary/20 bg-primary-soft text-primary">
          {icon}
        </div>
        <h3 className="mt-5 font-display text-base font-semibold tracking-tight text-ink">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover/card:opacity-100">
          Mở <ArrowRight className="size-3" />
        </div>
      </Card>
    </Link>
  );
}

function compactDate(value: string | null | undefined) {
  const formatted = formatDateTime(value);
  return formatted === "N/A" ? formatted : formatted.replace(", ", " · ");
}

function extractTime(value: string | null | undefined): string {
  if (!value) return "—:—";
  try {
    const d = new Date(value);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "—:—";
  }
}

function calcDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return "—";
  try {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours === 0) return `${mins}p`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}p`;
  } catch {
    return "—";
  }
}

function compactTripCode(value: string) {
  if (value.length <= 8) {
    return value;
  }
  return value.slice(0, 8).toUpperCase();
}

function compareDate(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  const leftTime = left ? new Date(left).getTime() : Number.MAX_SAFE_INTEGER;
  const rightTime = right ? new Date(right).getTime() : Number.MAX_SAFE_INTEGER;
  return leftTime - rightTime;
}

function getStationName(
  options: ReadonlyArray<{ name?: string | null; code?: string | null }>,
  code: string,
) {
  const match = options.find((station) => station.code === code);
  if (!match) {
    return code;
  }
  return `${match.name ?? match.code ?? code} (${match.code ?? code})`;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
}
