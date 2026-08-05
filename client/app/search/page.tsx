"use client";

import Link from "next/link";
import { type ReactNode, useDeferredValue, useState } from "react";
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

import { AppShell, Panel } from "@/components/app-shell";
import {
  EmptyState,
  PaginationBar,
  StatusBadge,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
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

export default function SearchPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortFilter>("recommended");

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
      <Panel
        title="Bộ lọc hành trình"
        description="Chọn tuyến, ngày và cách sắp xếp để thu hẹp danh sách."
        action={
          <StatusBadge
            label={query.isFetching ? "Đang đồng bộ" : "Kết quả mới"}
            tone={query.isFetching ? "warning" : "brand"}
          />
        }
      >
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
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            <span className="text-xs font-medium text-ink-muted">Đang lọc:</span>
            {activeFilterChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onClear}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-brand hover:text-brand"
              >
                {chip.label}
                <X className="size-3" aria-hidden />
              </button>
            ))}
          </div>
        ) : null}
      </Panel>

      <section
        aria-label="Kết quả tìm kiếm"
        className="grid gap-3 sm:grid-cols-3"
      >
        <SummaryStat
          label="Chuyến phù hợp"
          value={query.isLoading ? "—" : String(trips.length)}
          helper="Sau khi áp dụng bộ lọc"
        />
        <SummaryStat
          label="Chỗ trống tổng"
          value={query.isLoading ? "—" : String(availableSeats)}
          helper="Khả dụng ở thời điểm hiện tại"
        />
        <SummaryStat
          label="Giá từ"
          value={query.isLoading ? "—" : formatCurrency(cheapest)}
          helper="Một chiều, đã bao gồm thuế"
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">
              Kết quả hành trình
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              Quét nhanh thời gian, hạng ghế và mức giá trước khi mở chi tiết.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink-muted">
            <SearchIcon className="size-3.5 text-brand" aria-hidden />
            Kết quả tự cập nhật theo bộ lọc hiện tại.
          </div>
        </div>

        {query.isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-lg border border-border bg-card"
              />
            ))}
          </div>
        ) : null}

        {query.isError ? (
          <EmptyState
            title="Không tải được kết quả"
            description="Không thể tải kết quả lúc này. Vui lòng thử lại sau."
          />
        ) : null}

        {!query.isLoading && !query.isError && trips.length === 0 ? (
          <EmptyState
            title="Chưa có chuyến phù hợp"
            description="Thử đổi ga đi, ga đến hoặc bỏ ngày khởi hành để mở rộng tồn vé."
            href="/tickets"
            cta="Mở danh mục vé"
          />
        ) : null}

        <div className="grid gap-3">
          {trips.map((trip) => (
            <article
              key={trip.ticketId}
              className="surface-panel grid gap-4 px-5 py-5 transition-colors hover:border-ink-muted lg:grid-cols-[minmax(0,1fr)_220px] lg:items-stretch"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={trip.trainNumber ?? compactTripCode(trip.ticketId)}
                    tone="brand"
                  />
                  <StatusBadge
                    label={trip.availableSeats > 0 ? "Sẵn sàng đặt vé" : "Hết chỗ"}
                    tone={trip.availableSeats > 0 ? "positive" : "danger"}
                  />
                </div>

                <div className="space-y-1">
                  <h3 className="font-heading text-lg font-semibold tracking-tight text-ink sm:text-xl">
                    {trip.from.name ?? trip.from.code ?? "?"} →{" "}
                    {trip.to.name ?? trip.to.code ?? "?"}
                  </h3>
                  <p className="text-sm leading-6 text-ink-muted">
                    {trip.title ?? "Tuyến chưa đặt tên"}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <InfoTile
                    icon={<CalendarDays className="size-4 text-brand" aria-hidden />}
                    label="Khởi hành"
                    value={compactDate(trip.dateStart)}
                  />
                  <InfoTile
                    icon={<Clock3 className="size-4 text-brand" aria-hidden />}
                    label="Kết thúc"
                    value={compactDate(trip.dateEnd)}
                  />
                  <InfoTile
                    icon={<TrainFront className="size-4 text-brand" aria-hidden />}
                    label="Tàu"
                    value={trip.trainNumber ?? "Đang cập nhật"}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {trip.seatClasses.map((item) => (
                    <span
                      key={`${trip.ticketId}-${item}`}
                      className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                    >
                      {item}
                    </span>
                  ))}
                  {trip.seatTypes.map((item) => (
                    <span
                      key={`${trip.ticketId}-${item}-type`}
                      className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-ink"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between gap-3 rounded-lg border border-border/70 bg-secondary/55 px-4 py-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-ink-muted">Giá từ</p>
                  <p className="font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    {formatCurrency(trip.minPrice)}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {trip.availableSeats} chỗ đang mở
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-ink-muted">
                  <Row label="Mã tuyến" value={`${trip.from.code ?? "?"} → ${trip.to.code ?? "?"}`} />
                  <Row
                    label="Hạng ghế"
                    value={String(trip.seatClasses.length + trip.seatTypes.length)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/tickets/${trip.ticketId}`}>
                      Xem vé
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/tickets">Tất cả</Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

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
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

function SummaryStat({
  label,
  value,
  helper,
  tone = "muted",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "muted" | "brand";
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-heading text-2xl font-semibold tracking-tight",
          tone === "brand" ? "text-brand" : "text-ink",
        )}
      >
        {value}
      </p>
      {helper ? <p className="mt-0.5 text-xs leading-5 text-ink-muted">{helper}</p> : null}
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border/70 bg-background px-3.5 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-medium text-ink-muted">{label}</p>
      </div>
      <p className="mt-2 text-sm font-medium leading-6 text-ink">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="font-medium text-ink">{value}</span>
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
    <Link
      href={href}
      className="surface-panel group block rounded-lg px-5 py-5 transition-colors hover:border-ink-muted"
    >
      <div className="flex size-11 items-center justify-center rounded-lg bg-brand-soft text-brand">
        {icon}
      </div>
      <h3 className="mt-5 font-heading text-base font-semibold tracking-tight text-ink">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
        Mở <ArrowRight className="size-3" />
      </div>
    </Link>
  );
}

function compactDate(value: string | null | undefined) {
  const formatted = formatDateTime(value);
  return formatted === "N/A" ? formatted : formatted.replace(", ", " · ");
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
