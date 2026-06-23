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
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1360px] gap-4 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <section className="surface-panel-strong flex min-h-[26rem] flex-col px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <TrainFront className="size-4" />
              </div>
              <div>
                <p className="font-heading text-sm font-semibold tracking-tight text-foreground">
                  Railway Hub
                </p>
                <p className="text-xs text-muted-foreground">
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
              <div className="space-y-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                  {title}
                </h1>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 px-5 py-5">
              {children}
            </div>

            {footer ? (
              <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm leading-6 text-muted-foreground">
                {footer}
              </div>
            ) : null}
          </div>
        </section>

        <aside className="surface-panel relative hidden min-h-[26rem] overflow-hidden lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6 px-5 py-5 xl:px-6 xl:py-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="route-pill">Khoang chờ tài khoản</span>
                <StatusBadge
                  label={tripsQuery.isFetching ? "Đang đồng bộ" : "Sẵn sàng đặt vé"}
                  tone={tripsQuery.isFetching ? "warning" : "brand"}
                />
              </div>
              <div className="space-y-2">
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-balance text-foreground">
                  Cùng một tài khoản để giữ chỗ, xem booking và đọc vé điện tử.
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Đăng nhập một lần để giữ chỗ, thanh toán và quay lại kiểm tra
                  hành trình khi cần.
                </p>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-lg border border-border bg-muted/30 px-5 py-5">
                <p className="text-xs font-medium text-muted-foreground">
                  Nhịp hỗ trợ
                </p>
                <div className="mt-3 grid gap-2">
                  {authHighlights.map((item) => (
                    <div
                      key={item}
                      className="rounded-md border border-border bg-background px-3.5 py-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                          <ShieldCheck className="size-3.5" />
                        </span>
                        <p className="text-sm leading-6 text-foreground">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 px-5 py-5">
                <p className="text-xs font-medium text-muted-foreground">
                  Dữ liệu hiện tại
                </p>
                <div className="mt-3 grid gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Chuyến đang hiện
                    </p>
                    <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-foreground">
                      {trips.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Chỗ đang mở
                    </p>
                    <p className="mt-1 font-heading text-2xl font-semibold tracking-tight text-foreground">
                      {visibleSeats}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Giá từ
                    </p>
                    <p className="mt-1 font-heading text-xl font-semibold tracking-tight text-foreground">
                      {formatCurrency(featuredTrip?.minPrice)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Lượt mở bán nổi bật
                  </p>
                  <p className="font-heading text-xl font-semibold tracking-tight text-foreground">
                    {featuredTrip?.title ?? "Đang chờ dữ liệu chuyến"}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {(featuredTrip?.from.name ?? featuredTrip?.from.code ?? "?") +
                      " -> " +
                      (featuredTrip?.to.name ?? featuredTrip?.to.code ?? "?")}
                  </p>
                </div>
                <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Ticket className="size-4" />
                </span>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                <div className="rounded-md border border-border bg-background px-3 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Tàu
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {featuredTrip?.trainNumber ?? compactTrainId(featuredTrip?.ticketId)}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background px-3 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Khởi hành
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {compactDate(featuredTrip?.dateStart)}
                  </p>
                </div>
                <div className="rounded-md border border-border bg-background px-3 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Chỗ còn
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
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
