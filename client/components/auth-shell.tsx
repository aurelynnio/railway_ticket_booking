"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Dot, ShieldCheck, Ticket, TrainFront } from "lucide-react";

import { StatusBadge } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { useSearchTrips } from "@/hooks/search.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

const authHighlights = [
  "Session cookie được nhận qua gateway, không phụ thuộc localStorage.",
  "Hồ sơ, đơn hàng và thanh toán tự động nối theo tài khoản đang đăng nhập.",
  "Flow local vẫn hiện token preview khi backend cho phép để test nhanh.",
];

const cityStops = ["Hà Nội", "Huế", "Đà Nẵng", "Nha Trang", "Sài Gòn"];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const tripsQuery = useSearchTrips({ page: 1, limit: 3 });
  const trips = tripsQuery.data?.data ?? [];
  const featuredTrip = trips[0];
  const visibleSeats = trips.reduce((total, trip) => total + trip.availableSeats, 0);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1360px] gap-4 lg:grid-cols-[minmax(0,31rem)_minmax(0,1fr)]">
        <section className="surface-panel-strong flex min-h-[26rem] flex-col rounded-[2rem] px-5 py-5 sm:px-7 sm:py-7">
          <div className="flex items-start justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-[1.1rem] bg-primary text-primary-foreground">
                <TrainFront className="size-5" />
              </div>
              <div>
                <p className="font-heading text-lg font-semibold tracking-normal text-foreground">
                  Railway Hub
                </p>
                <p className="text-[11px] uppercase tracking-normal text-muted-foreground">
                  Truy cập tài khoản
                </p>
              </div>
            </Link>
            <Button asChild size="sm" variant="outline">
              <Link href="/search">Duyệt không cần đăng nhập</Link>
            </Button>
          </div>

          <div className="mt-8 flex-1 space-y-6">
            <div className="space-y-3">
              <div className="route-pill">{eyebrow}</div>
              <div className="space-y-3">
                <h1 className="font-heading text-4xl font-semibold tracking-normal text-balance text-foreground sm:text-[3rem]">
                  {title}
                </h1>
                <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
                  {description}
                </p>
              </div>
            </div>

            <div className="rounded-[1.7rem] bg-muted/30 px-5 py-5 ring-1 ring-border">
              {children}
            </div>

            {footer ? (
              <div className="rounded-[1.45rem] bg-muted/45 px-4 py-4 text-sm leading-6 text-muted-foreground ring-1 ring-border">
                {footer}
              </div>
            ) : null}
          </div>
        </section>

        <aside className="surface-panel relative overflow-hidden hidden min-h-[26rem] rounded-[2rem] lg:flex lg:flex-col lg:justify-between lg:overflow-hidden">
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-[0.06] dark:opacity-[0.02]"
            src="/imgs/railway.png"
            alt=""
            aria-hidden="true"
          />
          <div className="relative space-y-6 px-5 py-5 xl:px-6 xl:py-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="route-pill">Khoang chờ tài khoản</span>
                <StatusBadge
                  label={tripsQuery.isFetching ? "Đang đồng bộ" : "Sẵn sàng đặt vé"}
                  tone={tripsQuery.isFetching ? "warning" : "brand"}
                />
              </div>
              <div className="space-y-2">
                <h2 className="font-heading text-[2rem] font-semibold tracking-normal text-balance text-foreground">
                  Cùng một tài khoản để giữ chỗ, xem booking và đọc vé điện tử.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  Đăng nhập một lần để giữ chỗ, thanh toán và quay lại kiểm tra
                  hành trình khi cần.
                </p>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.7rem] bg-muted/35 px-5 py-5 ring-1 ring-border">
                <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                  Nhịp hỗ trợ
                </p>
                <div className="mt-4 grid gap-3">
                  {authHighlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.2rem] bg-background px-4 py-4 ring-1 ring-border"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-9 items-center justify-center rounded-[0.95rem] bg-primary text-primary-foreground">
                          <ShieldCheck className="size-4" />
                        </span>
                        <p className="text-sm leading-6 text-foreground">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.7rem] bg-muted/35 px-5 py-5 ring-1 ring-border">
                <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                  Dữ liệu hiện tại
                </p>
                <div className="mt-4 grid gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                      Chuyến đang hiện
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold tracking-normal text-foreground">
                      {trips.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                      Chỗ đang mở
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold tracking-normal text-foreground">
                      {visibleSeats}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                      Giá từ
                    </p>
                    <p className="mt-2 font-heading text-2xl font-semibold tracking-normal text-foreground">
                      {formatCurrency(featuredTrip?.minPrice)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.7rem] bg-muted/25 px-5 py-5 ring-1 ring-border">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                    Lượt mở bán nổi bật
                  </p>
                  <p className="font-heading text-2xl font-semibold tracking-normal text-foreground">
                    {featuredTrip?.title ?? "Đang chờ dữ liệu chuyến"}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {(featuredTrip?.from.name ?? featuredTrip?.from.code ?? "?") +
                      " -> " +
                      (featuredTrip?.to.name ?? featuredTrip?.to.code ?? "?")}
                  </p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground">
                  <Ticket className="size-4.5" />
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-[1.2rem] bg-background px-4 py-4 ring-1 ring-border">
                    <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                      Tàu
                    </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {featuredTrip?.trainNumber ?? compactTrainId(featuredTrip?.ticketId)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-background px-4 py-4 ring-1 ring-border">
                    <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                      Khởi hành
                    </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {compactDate(featuredTrip?.dateStart)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-background px-4 py-4 ring-1 ring-border">
                    <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                      Chỗ còn
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {featuredTrip?.availableSeats ?? 0} chỗ
                    </p>
                  </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border px-5 py-4 xl:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {cityStops.map((city, index) => (
                  <span key={city} className="inline-flex items-center gap-2">
                    {index > 0 ? <Dot className="size-4" /> : null}
                    {city}
                  </span>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">Hỗ trợ 24/7</div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function compactDate(value: string | null | undefined) {
  const formatted = formatDateTime(value);
  return formatted === "N/A" ? formatted : formatted.replace(", ", " · ");
}

function compactTrainId(value: string | null | undefined) {
  if (!value) {
    return "Đang cập nhật";
  }

  if (value.length <= 10) {
    return value;
  }

  return value.slice(0, 8).toUpperCase();
}
