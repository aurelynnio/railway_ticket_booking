"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrainFront,
} from "lucide-react";

import { AppShell, Panel } from "@/components/app-shell";
import { EmptyState, SectionHeading, StatusBadge } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { useSearchTrips } from "@/hooks/search.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

const taskCards = [
  {
    title: "Tìm hành trình",
    description: "Vào trang search để lọc theo điểm đi, điểm đến và ngày khởi hành.",
    href: "/search",
  },
  {
    title: "Duyệt tồn vé",
    description: "Mở danh mục vé để so sánh tuyến, giá và số chỗ đang mở.",
    href: "/tickets",
  },
  {
    title: "Theo dõi booking",
    description: "Quay lại `profile/orders` để xem đơn đã tạo và trạng thái thanh toán.",
    href: "/profile/orders",
  },
] as const;

const experienceCards = [
  {
    title: "Storefront trước, công cụ sau",
    description:
      "Người dùng nhìn thấy tuyến, giá và khả năng đặt vé ngay từ trang đầu.",
    icon: ShieldCheck,
  },
  {
    title: "Flow đặt vé gọn",
    description:
      "Hero, search và ticket detail giữ cùng một nhịp nhận diện để user không bị đứt mạch khi đi sâu vào flow.",
    icon: Clock3,
  },
  {
    title: "Catalog có nhịp",
    description:
      "Card và spacing được đưa về nhẹ, ít border cứng và ưu tiên scan nhanh trên desktop lẫn mobile.",
    icon: Sparkles,
  },
] as const;

export default function RootPage() {
  const tripsQuery = useSearchTrips({ page: 1, limit: 4 });
  const trips = tripsQuery.data?.data ?? [];
  const featuredTrip = trips[0];
  const totalSeats = trips.reduce((total, trip) => total + trip.availableSeats, 0);
  const lowestPrice = trips.reduce<number | null>((min, trip) => {
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
      title="Đặt vé tàu nhanh cho các tuyến Bắc Trung Nam"
      description="Tra cứu chuyến đang mở, xem số chỗ còn lại, so sánh giá và đi thẳng tới chi tiết vé để giữ chỗ."
      actions={
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild size="lg">
            <Link href="/search">
              Bắt đầu tìm chuyến
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/tickets">Mở danh mục vé</Link>
          </Button>
        </div>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="surface-panel-strong relative overflow-hidden px-6 py-6">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="route-pill">Railway Hub</span>
                <StatusBadge
                  label={tripsQuery.isFetching ? "Đang cập nhật" : "Dữ liệu mới nhất"}
                  tone={tripsQuery.isFetching ? "warning" : "brand"}
                />
              </div>
              <div className="space-y-2">
                <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                  Đặt vé tàu nhanh cho các tuyến Bắc Trung Nam.
                </h2>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Tìm chuyến, chọn hạng vé và đi tiếp vào chi tiết vé trong cùng
                  một hành trình đặt chỗ.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 px-4 py-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.85fr))_auto] lg:items-end">
                <MetricPreview
                  label="Tuyến nổi bật"
                  value={
                    featuredTrip
                      ? `${featuredTrip.from.name ?? featuredTrip.from.code ?? "?"} - ${featuredTrip.to.name ?? featuredTrip.to.code ?? "?"}`
                      : "Đang chờ dữ liệu"
                  }
                />
                <MetricPreview
                  label="Khởi hành"
                  value={compactDate(featuredTrip?.dateStart)}
                />
                <MetricPreview
                  label="Giá từ"
                  value={formatCurrency(featuredTrip?.minPrice)}
                />
                <Button asChild className="lg:min-w-40">
                  <Link href="/search">
                    Tra cứu vé
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat
                label="Chuyến đang hiện"
                value={String(trips.length)}
                helper="Cập nhật theo kết quả của search service."
              />
              <MiniStat
                label="Chỗ còn lại"
                value={String(totalSeats)}
                helper="Tổng số chỗ trên các route đang được spotlight."
              />
              <MiniStat
                label="Giá mở đầu"
                value={formatCurrency(lowestPrice)}
                helper="Mức giá để quét nhanh offer đầu tiên."
              />
            </div>
          </div>
        </article>

        <article className="surface-panel px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <span className="route-pill">Bảng chuyến</span>
              <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                Chuyến đang mở bán
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Danh sách rút gọn để user thấy tồn vé đang sống trước khi vào trang
                search chi tiết.
              </p>
            </div>
            <TrainFront className="mt-1 size-4 text-primary" />
          </div>

          <div className="mt-4 grid gap-2">
            {tripsQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-md bg-muted/60"
                />
              ))
            ) : null}

            {!tripsQuery.isLoading && trips.length === 0 ? (
              <EmptyState
                title="Chưa có route nổi bật"
                description="Kiểm tra `search-service` nếu bạn muốn bảng chuyến này có dữ liệu live."
                href="/search"
                cta="Mở trang search"
              />
            ) : null}

            {trips.map((trip) => (
              <div
                key={trip.ticketId}
                className="rounded-md border border-border bg-muted/30 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {trip.title ?? "Tuyến chưa đặt tên"}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {(trip.from.name ?? trip.from.code ?? "?") +
                        " -> " +
                        (trip.to.name ?? trip.to.code ?? "?")}
                    </p>
                  </div>
                  <StatusBadge
                    label={trip.availableSeats > 0 ? "Đang mở bán" : "Hết chỗ"}
                    tone={trip.availableSeats > 0 ? "positive" : "danger"}
                  />
                </div>
                <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 text-primary" />
                    {compactDate(trip.dateStart)}
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-3.5 text-primary" />
                    {trip.trainNumber ?? compactTripCode(trip.ticketId)}
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <Ticket className="size-3.5 text-primary" />
                    {trip.availableSeats} chỗ
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <Panel
        title="Chuyến và hạng vé đang được spotlight"
        description="Các tuyến nổi bật được lấy từ dữ liệu tìm kiếm hiện có, kèm giá mở đầu và số chỗ còn lại."
      >
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Featured routes"
            title="Route được đẩy lên trước khi vào search"
            description="Mở nhanh những hành trình có dữ liệu mới nhất trước khi lọc chi tiết theo ga và ngày đi."
            action={
              <Button asChild variant="outline">
                <Link href="/search">
                  Xem tất cả
                  <ArrowRight />
                </Link>
              </Button>
            }
          />

          <div className="grid gap-4 lg:grid-cols-2">
            {trips.map((trip) => (
              <article
                key={trip.ticketId}
                className="surface-panel px-5 py-5"
              >
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label={trip.trainNumber ?? "Route live"} tone="brand" />
                  <StatusBadge
                    label={`${trip.availableSeats} chỗ`}
                    tone={trip.availableSeats > 0 ? "positive" : "danger"}
                  />
                </div>
                <div className="mt-4 space-y-1.5">
                  <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                    {trip.title ?? "Tuyến chưa đặt tên"}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {(trip.from.name ?? trip.from.code ?? "?") +
                      " -> " +
                      (trip.to.name ?? trip.to.code ?? "?")}
                  </p>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <InfoTile label="Khởi hành" value={compactDate(trip.dateStart)} />
                  <InfoTile label="Kết thúc" value={compactDate(trip.dateEnd)} />
                  <InfoTile label="Giá từ" value={formatCurrency(trip.minPrice)} />
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {trip.seatClasses.slice(0, 2).map((item) => (
                    <span
                      key={item}
                      className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                  {trip.seatTypes.slice(0, 2).map((item) => (
                    <span
                      key={item}
                      className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-5">
                  <Button asChild variant="outline">
                    <Link href={`/tickets/${trip.ticketId}`}>
                      Xem vé
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Panel>

      <Panel
        title="Đi vào đúng tác vụ"
        description="Chọn nhanh tác vụ phổ biến nhất: tìm hành trình, duyệt tồn vé hoặc kiểm tra đơn hàng."
      >
        <div className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            {taskCards.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="surface-panel block px-5 py-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-heading text-base font-semibold tracking-tight text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <span className="mt-1 inline-flex size-8 items-center justify-center rounded-md bg-muted text-foreground border border-border">
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {experienceCards.map((item) => (
              <article
                key={item.title}
                className="surface-panel px-5 py-4"
              >
                <div className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground border border-border">
                  <item.icon className="size-4" />
                </div>
                <h3 className="mt-4 font-heading text-base font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}

function MetricPreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <div className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground">
        {value}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-heading text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-foreground">{value}</p>
    </div>
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
