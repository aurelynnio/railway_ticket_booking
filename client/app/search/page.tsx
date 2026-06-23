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

import { AppShell, Panel } from "@/components/app-shell";
import {
  EmptyState,
  PaginationBar,
  SectionHeading,
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            size="lg"
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
          <Button asChild size="lg">
            <Link href="/tickets">
              Mở toàn bộ tồn vé
              <ArrowRight />
            </Link>
          </Button>
        </div>
      }
    >
      <Panel
        title="Bộ lọc hành trình"
        description="Chọn điểm đi, điểm đến, ngày khởi hành và cách sắp xếp để thu hẹp danh sách chuyến."
      >
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.12fr)_19rem]">
            <div className="rounded-lg bg-muted/35 px-5 py-5 border border-border">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="route-pill">Tìm hành trình</span>
                  <StatusBadge
                    label={query.isFetching ? "Đang tải" : "Dữ liệu mới nhất"}
                    tone={query.isFetching ? "warning" : "brand"}
                  />
                </div>
                <div className="space-y-2">
                  <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-[3.4rem] sm:leading-[0.94]">
                    Tìm vé theo điểm đi, điểm đến và ngày khởi hành.
                  </h2>
                  <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                    So sánh nhanh giờ chạy, số ghế còn lại và mức giá phù hợp
                    trước khi chọn vé.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-lg bg-background border border-border xl:grid-cols-1">
              <SearchStat label="Chuyến" value={String(trips.length)} />
              <SearchStat label="Chỗ trống" value={String(availableSeats)} />
              <SearchStat label="Giá từ" value={formatCurrency(cheapest)} />
            </div>
          </div>

          <div className="grid gap-3 rounded-lg bg-muted/25 p-4 border border-border lg:grid-cols-2 xl:grid-cols-4">
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="size-4 text-primary" />
              Kết quả tự cập nhật theo bộ lọc đang chọn.
            </div>
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
                Đặt lại
              </Button>
              <Button asChild>
                <Link href="/profile/orders">
                  Đơn của tôi
                  <Ticket className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Kết quả hành trình"
        description="Mỗi kết quả hiển thị tuyến, tàu, giờ chạy, số chỗ còn lại, hạng ghế và giá mở đầu."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Kết quả"
            title="Chuyến phù hợp với lựa chọn của bạn"
            description="Chọn một hành trình để xem hạng ghế, giá và tiếp tục đặt chỗ."
            action={
              <Button asChild variant="outline">
                <Link href="/">Trang chủ</Link>
              </Button>
            }
          />

          {query.isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-52 animate-pulse rounded-lg bg-muted/60"
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
                className="surface-panel rounded-lg px-5 py-5"
              >
                <div className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
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
                        <h3 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-foreground">
                          {(trip.from.name ?? trip.from.code ?? "?") +
                            " -> " +
                            (trip.to.name ?? trip.to.code ?? "?")}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {trip.title ?? "Tuyến chưa đặt tên"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 px-4 py-4 border border-border xl:min-w-44">
                        <p className="text-xs font-medium text-muted-foreground">
                          Giá từ
                        </p>
                        <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
                          {formatCurrency(trip.minPrice)}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {trip.availableSeats} chỗ đang mở
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
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
                          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground border border-border"
                        >
                          {item}
                        </span>
                      ))}
                      {trip.seatTypes.map((item) => (
                        <span
                          key={`${trip.ticketId}-${item}`}
                          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground border border-border"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/25 px-5 py-5 border border-border">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Tóm tắt hành trình
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground">
                          Xem nhanh tuyến, giờ chạy và số ghế trước khi mở chi tiết.
                        </p>
                      </div>

                      <div className="rounded-lg bg-background px-4 py-4 border border-border">
                        <p className="text-xs font-medium text-muted-foreground">
                          Tóm tắt
                        </p>
                        <div className="mt-3 grid gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center justify-between gap-3">
                            <span>Route</span>
                            <span className="font-medium text-foreground">
                              {(trip.from.code ?? "?") + " -> " + (trip.to.code ?? "?")}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Chỗ trống</span>
                            <span className="font-medium text-foreground">
                              {trip.availableSeats}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Nhãn ghế</span>
                            <span className="font-medium text-foreground">
                              {trip.seatClasses.length + trip.seatTypes.length}
                            </span>
                          </div>
                        </div>
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
        </div>
      </Panel>

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
    <div className="border-b border-border px-4 py-4 last:border-b-0 xl:border-b xl:last:border-b-0">
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
    <div className="rounded-lg bg-muted/25 px-4 py-4 border border-border">
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
      className="surface-panel block rounded-lg px-5 py-5 transition-colors hover:bg-muted/50"
    >
      <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-foreground border border-border">
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
