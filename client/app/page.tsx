"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Ticket,
} from "lucide-react";

import { AppShell, Panel } from "@/components/app-shell";
import { EmptyState, StatusBadge } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { useSearchTrips } from "@/hooks/search.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

const taskCards = [
  {
    title: "Tìm hành trình",
    description: "Lọc theo điểm đi, điểm đến và ngày khởi hành.",
    href: "/search",
  },
  {
    title: "Duyệt tồn vé",
    description: "So sánh tuyến, giá và số chỗ đang mở.",
    href: "/tickets",
  },
  {
    title: "Theo dõi booking",
    description: "Xem lại đơn đã đặt, thanh toán và vé đã phát hành.",
    href: "/profile/orders",
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
        <div className="flex flex-wrap gap-2">
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
      {/* Hero: featured trip + quick stats */}
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="surface-panel-strong px-6 py-6">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  label={tripsQuery.isFetching ? "Đang cập nhật" : "Dữ liệu mới nhất"}
                  tone={tripsQuery.isFetching ? "warning" : "brand"}
                />
              </div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance text-foreground sm:text-3xl">
                Đặt vé tàu nhanh cho các tuyến Bắc Trung Nam.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Tìm chuyến, chọn hạng vé và đi tiếp vào chi tiết vé trong cùng
                một hành trình đặt chỗ.
              </p>
            </div>

            {featuredTrip ? (
              <div className="quiet-panel px-4 py-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Tuyến nổi bật
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {featuredTrip.from.name ?? featuredTrip.from.code ?? "?"} →{" "}
                      {featuredTrip.to.name ?? featuredTrip.to.code ?? "?"}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {compactDate(featuredTrip.dateStart)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Ticket className="size-3" />
                        {featuredTrip.availableSeats} chỗ
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Giá từ {formatCurrency(featuredTrip.minPrice)}
                      </span>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/tickets/${featuredTrip.ticketId}`}>
                      Xem vé
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <MiniStat
            label="Chuyến đang mở"
            value={String(trips.length)}
          />
          <MiniStat
            label="Chỗ còn lại"
            value={String(totalSeats)}
          />
          <MiniStat
            label="Giá từ"
            value={formatCurrency(lowestPrice)}
          />
        </div>
      </section>

      {/* Featured trips */}
      {trips.length > 0 ? (
        <Panel
          title="Chuyến đang mở bán"
          description="Các hành trình nổi bật đang có chỗ, chọn nhanh để xem chi tiết."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {trips.map((trip) => (
              <article
                key={trip.ticketId}
                className="quiet-panel px-5 py-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {trip.title ?? "Tuyến chưa đặt tên"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {trip.from.name ?? trip.from.code ?? "?"} →{" "}
                      {trip.to.name ?? trip.to.code ?? "?"}
                    </p>
                  </div>
                  <StatusBadge
                    label={trip.availableSeats > 0 ? "Đang bán" : "Hết chỗ"}
                    tone={trip.availableSeats > 0 ? "positive" : "danger"}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    {compactDate(trip.dateStart)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="size-3" />
                    {trip.trainNumber ?? compactTripCode(trip.ticketId)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Ticket className="size-3" />
                    {trip.availableSeats} chỗ
                  </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(trip.minPrice)}
                  </span>
                </div>
                <div className="mt-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/tickets/${trip.ticketId}`}>
                      Xem chi tiết
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      ) : !tripsQuery.isLoading ? (
        <EmptyState
          title="Chưa có chuyến nổi bật"
          description="Thử tìm theo ga đi, ga đến hoặc ngày khởi hành để xem lựa chọn phù hợp."
          href="/search"
          cta="Mở trang search"
        />
      ) : null}

      {/* Quick actions */}
      <Panel
        title="Truy cập nhanh"
        description="Chọn tác vụ phổ biến nhất để bắt đầu."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {taskCards.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="quiet-panel block px-5 py-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="surface-panel px-5 py-4">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 font-heading text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
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
