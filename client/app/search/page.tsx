"use client";

import Link from "next/link";
import { type ReactNode, useDeferredValue, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Search,
  Ticket,
  TrainFront,
  Wallet,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
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

  return (
    <AppShell
      title="Tìm vé theo tuyến, thời gian và nhu cầu đặt chỗ"
      description="Lọc theo ga đi, ga đến và ngày khởi hành để tìm các chuyến còn chỗ, giá phù hợp và đường dẫn đặt vé."
      actions={
        <div className="flex flex-wrap gap-2">
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
          >
            Xóa bộ lọc
          </Button>
          <Button asChild>
            <Link href="/tickets">
              Mở toàn bộ tồn vé
              <ArrowRight />
            </Link>
          </Button>
        </div>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="surface-panel px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Bộ lọc hành trình</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Chọn tuyến, ngày và cách sắp xếp để thu hẹp danh sách.
                </p>
              </div>
              <StatusBadge
                label={query.isFetching ? "Đang tải" : "Mới nhất"}
                tone={query.isFetching ? "warning" : "brand"}
              />
            </div>

            <div className="mt-5 grid gap-4">
              <Field label="Ga đi">
                <Select
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
              </Field>
              <Field label="Ga đến">
                <Select
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
              </Field>
              <Field label="Ngày đi">
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setPage(1);
                    setDate(event.target.value);
                  }}
                />
              </Field>
              <Field label="Sắp xếp">
                <Select
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
              </Field>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-border/75 pt-4">
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
              >
                Đặt lại
              </Button>
              <Button asChild>
                <Link href="/profile/orders">
                  Đơn của tôi
                  <Ticket className="size-4" />
                </Link>
              </Button>
            </div>
          </section>

          <section className="surface-panel overflow-hidden">
            <div className="grid grid-cols-3 xl:grid-cols-1">
              <SearchStat label="Chuyến" value={String(trips.length)} />
              <SearchStat label="Chỗ trống" value={String(availableSeats)} />
              <SearchStat label="Giá từ" value={formatCurrency(cheapest)} />
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Kết quả hành trình</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Quét nhanh thời gian, hạng ghế và mức giá trước khi mở chi tiết.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="size-4 text-primary" />
              Kết quả tự cập nhật theo bộ lọc hiện tại.
            </div>
          </div>

          {query.isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-48 animate-pulse rounded-lg bg-muted/60"
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
            />
          ) : null}

          <div className="grid gap-4">
            {trips.map((trip) => (
              <article
                key={trip.ticketId}
                className="surface-panel px-5 py-5 transition-colors hover:bg-muted/20"
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        label={trip.trainNumber ?? compactTripCode(trip.ticketId)}
                        tone="brand"
                      />
                      <StatusBadge
                        label={trip.availableSeats > 0 ? "Sẵn sàng đặt vé" : "Hết chỗ"}
                        tone={trip.availableSeats > 0 ? "positive" : "danger"}
                      />
                    </div>

                    <div className="space-y-2">
                      <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        {(trip.from.name ?? trip.from.code ?? "?") +
                          " -> " +
                          (trip.to.name ?? trip.to.code ?? "?")}
                      </h2>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {trip.title ?? "Tuyến chưa đặt tên"}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <InfoTile
                        icon={<CalendarDays className="size-4 text-primary" />}
                        label="Khởi hành"
                        value={compactDate(trip.dateStart)}
                      />
                      <InfoTile
                        icon={<Clock3 className="size-4 text-primary" />}
                        label="Kết thúc"
                        value={compactDate(trip.dateEnd)}
                      />
                      <InfoTile
                        icon={<TrainFront className="size-4 text-primary" />}
                        label="Tàu"
                        value={trip.trainNumber ?? "Đang cập nhật"}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {trip.seatClasses.map((item) => (
                        <span
                          key={`${trip.ticketId}-${item}`}
                          className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                        >
                          {item}
                        </span>
                      ))}
                      {trip.seatTypes.map((item) => (
                        <span
                          key={`${trip.ticketId}-${item}`}
                          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-secondary/55 px-4 py-4 lg:min-h-full">
                    <p className="text-xs font-medium text-muted-foreground">Giá từ</p>
                    <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
                      {formatCurrency(trip.minPrice)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {trip.availableSeats} chỗ đang mở
                    </p>
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <span>Mã tuyến</span>
                        <span className="font-medium text-foreground">
                          {(trip.from.code ?? "?") + " -> " + (trip.to.code ?? "?")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Nhãn ghế</span>
                        <span className="font-medium text-foreground">
                          {trip.seatClasses.length + trip.seatTypes.length}
                        </span>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button asChild className="flex-1">
                        <Link href={`/tickets/${trip.ticketId}`}>
                          Xem vé
                          <ArrowRight />
                        </Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/tickets">Danh mục</Link>
                      </Button>
                    </div>
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
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SupportCard
          icon={<Ticket className="size-5" />}
          title="Vé của tôi"
          description="Theo dõi đơn đã đặt và vé đã phát hành."
          href="/profile/orders"
        />
        <SupportCard
          icon={<Wallet className="size-5" />}
          title="Thanh toán"
          description="Kiểm tra giao dịch và trạng thái thanh toán."
          href="/payments"
        />
        <SupportCard
          icon={<TrainFront className="size-5" />}
          title="Danh mục vé"
          description="Xem thêm các tuyến đang mở bán."
          href="/tickets"
        />
      </section>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      {children}
    </label>
  );
}

function SearchStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-border/60 px-4 py-4 last:border-r-0 xl:border-r-0 xl:border-b xl:last:border-b-0">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
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
    <div className="rounded-lg border border-border/80 bg-background px-4 py-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-medium text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 text-sm leading-6 text-foreground">{value}</p>
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
      className="surface-panel block rounded-lg px-5 py-5 transition-colors hover:bg-muted/20"
    >
      <div className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        {icon}
      </div>
      <h3 className="mt-5 font-heading text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
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
