"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrainFront,
  Wallet,
} from "lucide-react";

import { AppShell, Panel } from "@/components/app-shell";
import { BrandLogo } from "@/components/brand-logo";
import {
  EmptyState,
  StatusBadge,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchTrips } from "@/hooks/search.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

const taskCards = [
  {
    title: "Tìm hành trình",
    description: "Lọc theo điểm đi, điểm đến và ngày khởi hành.",
    href: "/search",
    icon: TrainFront,
  },
  {
    title: "Duyệt tồn vé",
    description: "So sánh tuyến, giá và số chỗ đang mở.",
    href: "/tickets",
    icon: Ticket,
  },
  {
    title: "Theo dõi booking",
    description: "Xem lại đơn đã đặt, thanh toán và vé đã phát hành.",
    href: "/profile/orders",
    icon: Wallet,
  },
] as const;

const journeySteps = [
  { label: "Chọn tuyến", helper: "Ga đi · ga đến · ngày" },
  { label: "Giữ chỗ", helper: "Chọn toa và ghế" },
  { label: "Thanh toán", helper: "VNPay · an toàn" },
  { label: "Nhận vé", helper: "QR điện tử" },
] as const;

const trustItems = [
  { icon: ShieldCheck, label: "Thanh toán bảo mật" },
  { icon: Ticket, label: "Hoàn vé trong 24h" },
  { icon: Sparkles, label: "Hỗ trợ 24/7" },
] as const;

export default function RootPage() {
  const tripsQuery = useSearchTrips({ page: 1, limit: 6 });
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
      title="Đặt vé tàu Bắc · Trung · Nam chỉ trong vài phút"
      description="Vietrail Way giúp bạn tra cứu tuyến, so sánh giá và giữ chỗ trên cùng một mạch — không cần chờ, không cần gọi điện."
      heroVariant="rich"
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
      <main id="main-content" className="page-section">
        <section
          aria-label="Thống kê nhanh"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatTile
            label="Chuyến đang mở"
            value={tripsQuery.isLoading ? "—" : String(trips.length)}
            accent="brand"
          />
          <StatTile
            label="Chỗ còn lại"
            value={tripsQuery.isLoading ? "—" : String(totalSeats)}
            accent="muted"
          />
          <StatTile
            label="Giá từ"
            value={tripsQuery.isLoading ? "—" : formatCurrency(lowestPrice)}
            accent="muted"
          />
          <StatTile
            label="Tuyến phủ sóng"
            value="36 ga"
            helper="Bắc · Trung · Nam"
            accent="muted"
          />
        </section>

        <section
          aria-label="Hành trình 4 bước"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {journeySteps.map((step, index) => (
            <article
              key={step.label}
              className="surface-panel flex flex-col gap-2 px-4 py-4"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md border border-border bg-brand-soft text-xs font-semibold text-brand">
                  0{index + 1}
                </span>
                <h3 className="font-heading text-sm font-semibold tracking-tight text-ink">
                  {step.label}
                </h3>
              </div>
              <p className="text-xs leading-5 text-ink-muted">{step.helper}</p>
            </article>
          ))}
        </section>

        {featuredTrip ? (
          <section
            aria-label="Tuyến nổi bật"
            className="surface-panel-strong flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                <TrainFront className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                  Tuyến nổi bật hôm nay
                </p>
                <p className="font-heading text-lg font-semibold tracking-tight text-ink">
                  {featuredTrip.from.name ?? featuredTrip.from.code ?? "?"} →{" "}
                  {featuredTrip.to.name ?? featuredTrip.to.code ?? "?"}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    {compactDate(featuredTrip.dateStart)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Ticket className="size-3" />
                    {featuredTrip.availableSeats} chỗ
                  </span>
                  <span className="font-medium text-ink">
                    Từ {formatCurrency(featuredTrip.minPrice)}
                  </span>
                </div>
              </div>
            </div>
            <Button asChild size="lg">
              <Link href={`/tickets/${featuredTrip.ticketId}`}>
                Xem vé
                <ArrowRight />
              </Link>
            </Button>
          </section>
        ) : null}

        {tripsQuery.isLoading ? (
          <Panel title="Chuyến đang mở bán" description="Đang tải dữ liệu…">
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="space-y-3 rounded-lg border border-border bg-card p-5"
                >
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : trips.length > 0 ? (
          <Panel
            title="Chuyến đang mở bán"
            description="Các hành trình nổi bật đang có chỗ, chọn nhanh để xem chi tiết."
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/tickets">
                  Xem tất cả
                  <ArrowRight />
                </Link>
              </Button>
            }
          >
            <div className="grid gap-3 lg:grid-cols-2">
              {trips.map((trip) => (
                <Link
                  key={trip.ticketId}
                  href={`/tickets/${trip.ticketId}`}
                  className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-ink-muted hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-heading text-base font-semibold tracking-tight text-ink">
                        {trip.from.name ?? trip.from.code ?? "?"} →{" "}
                        {trip.to.name ?? trip.to.code ?? "?"}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {trip.title ?? "Tuyến chưa đặt tên"}
                      </p>
                    </div>
                    <StatusBadge
                      label={trip.availableSeats > 0 ? "Đang bán" : "Hết chỗ"}
                      tone={trip.availableSeats > 0 ? "positive" : "danger"}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3" />
                      {compactDate(trip.dateStart)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3" />
                      {trip.trainNumber ?? "Đang cập nhật"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Ticket className="size-3" />
                      {trip.availableSeats} chỗ
                    </span>
                    <span className="ml-auto font-semibold text-ink">
                      {formatCurrency(trip.minPrice)}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                    Xem chi tiết <ArrowRight className="size-3" />
                  </span>
                </Link>
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

        <Panel
          title="Truy cập nhanh"
          description="Chọn tác vụ phổ biến nhất để bắt đầu."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {taskCards.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-ink-muted hover:bg-muted/40"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-brand-soft text-brand">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-heading text-sm font-semibold text-ink">
                      {item.title}
                    </p>
                    <p className="text-xs leading-5 text-ink-muted">
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                </Link>
              );
            })}
          </div>
        </Panel>

        <section
          aria-label="Cam kết dịch vụ"
          className="rounded-lg border border-border bg-card px-5 py-5"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
                <MapPin className="size-4" />
              </div>
              <div className="space-y-1">
                <p className="font-heading text-sm font-semibold text-ink">
                  Tối ưu cho hành trình Bắc – Trung – Nam
                </p>
                <p className="text-xs leading-5 text-ink-muted">
                  Hỗ trợ tuyến dài, nhiều điểm dừng, theo dõi đơn sau khi đặt chỗ.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {trustItems.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="route-pill"
                >
                  <Icon className="size-3" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function StatTile({
  label,
  value,
  helper,
  accent = "muted",
}: {
  label: string;
  value: string;
  helper?: string;
  accent?: "muted" | "brand";
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p
        className={
          accent === "brand"
            ? "mt-1.5 font-heading text-2xl font-bold tracking-tight text-brand"
            : "mt-1.5 font-heading text-2xl font-semibold tracking-tight text-ink"
        }
      >
        {value}
      </p>
      {helper ? (
        <p className="mt-0.5 text-xs leading-5 text-ink-muted">{helper}</p>
      ) : null}
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
