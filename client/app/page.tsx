"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  ShieldCheck,
  Ticket,
  TrainFront,
  Wallet,
  ChevronRight,
  Search,
  ArrowLeftRight,
} from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchTrips, useStationSuggestions } from "@/hooks/search.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { STATIONS } from "@/lib/stations";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  const stationQuery = useStationSuggestions();
  const stations = stationQuery.data?.length ? stationQuery.data : STATIONS;

  const tripsQuery = useSearchTrips({ page: 1, limit: 4 });
  const trips = tripsQuery.data?.data ?? [];
  const featured = trips[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (date) params.set("date", date);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <AppLayout>
      {/* ===== HERO — Editorial, no blur blobs ===== */}
      <section className="relative overflow-hidden bg-primary">
        {/* Subtle grain texture instead of blur blobs */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "256px 256px",
          }}
        />
        {/* Decorative railway lines — SVG, not gradient blobs */}
        <svg
          className="absolute bottom-0 left-0 h-40 w-full text-white/[0.06]"
          viewBox="0 0 1200 160"
          preserveAspectRatio="none"
          fill="none"
        >
          <path d="M0 120 Q300 80 600 110 T1200 90" stroke="currentColor" strokeWidth="2" />
          <path d="M0 135 Q300 95 600 125 T1200 105" stroke="currentColor" strokeWidth="1.5" />
          {Array.from({ length: 24 }).map((_, i) => (
            <line
              key={i}
              x1={i * 50 + 10}
              y1="100"
              x2={i * 50 + 10}
              y2="145"
              stroke="currentColor"
              strokeWidth="3"
            />
          ))}
        </svg>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pb-32 lg:pt-28">
          {/* Left-aligned editorial layout, not centered SaaS */}
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="stamp text-gold">Mùa cao điểm 2026</span>
              <span className="text-xs font-medium text-white/50">
                Đặt sớm tiết kiệm đến 20%
              </span>
            </div>

            <h1 className="mt-8 font-display text-[clamp(2.75rem,7vw,5rem)] font-bold leading-[0.98] tracking-[-0.03em] text-white">
              Khám phá Việt Nam
              <br />
              <span className="hand-underline text-gold">qua cửa sổ tàu hỏa</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/70">
              Đặt vé tàu Bắc – Trung – Nam trong vài cú chạm. Ghế ngồi mềm,
              giường nằm tiện nghi, thanh toán VNPay an toàn.
            </p>
          </div>

          {/* Search bar — clean, no excessive shadow */}
          <div className="mt-12 max-w-4xl">
            <Card
              variant="outlined"
              padding="none"
              className="overflow-visible bg-white/[0.07] backdrop-blur-sm"
            >
              <form onSubmit={handleSearch} className="p-2">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_1fr_auto]">
                  <div className="relative">
                    <Select
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      placeholder="Điểm đi"
                      className="bg-white/10 pl-10 text-white shadow-sm [&>svg]:text-white/50 data-[placeholder]:text-white/50"
                    >
                      <option value="">Điểm đi</option>
                      {stations.map((s) => (
                        <option key={s.code} value={s.code ?? ""}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </Select>
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/50" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFrom(to);
                      setTo(from);
                    }}
                    className="flex size-11 items-center justify-center rounded-lg bg-white/10 text-white/60 shadow-sm transition-colors hover:bg-white/15 hover:text-white"
                    aria-label="Đổi điểm đi và đến"
                  >
                    <ArrowLeftRight className="size-4" />
                  </button>
                  <div className="relative">
                    <Select
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="Điểm đến"
                      className="bg-white/10 pl-10 text-white shadow-sm [&>svg]:text-white/50 data-[placeholder]:text-white/50"
                    >
                      <option value="">Điểm đến</option>
                      {stations.map((s) => (
                        <option key={s.code} value={s.code ?? ""}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </Select>
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/50" />
                  </div>
                  <div className="relative">
                    <DatePicker
                      value={date}
                      onChange={setDate}
                      placeholder="Ngày đi"
                      minDate={new Date()}
                      className="bg-white/10 pl-10 text-white shadow-sm data-[placeholder]:text-white/50 [&>svg]:text-white/50"
                      icon={<CalendarDays className="size-4 shrink-0 text-white/50" />}
                    />
                  </div>
                  <Button type="submit" size="lg" variant="accent" className="gap-2 shadow-md">
                    <Search className="size-4" />
                    <span className="hidden sm:inline">Tìm</span>
                  </Button>
                </div>
              </form>
            </Card>

            {/* Stats — left-aligned, vertical dividers, magazine feel */}
            <div className="mt-10 flex flex-wrap items-start gap-x-10 gap-y-4">
              {[
                { value: String(STATIONS.length), label: "Ga tàu trên tuyến Bắc-Nam" },
                { value: STATIONS[STATIONS.length - 1]?.km ?? "—", label: "Tổng chiều dài đường sắt" },
                { value: "24/7", label: "Hỗ trợ khách hàng" },
              ].map((s, i) => (
                <div key={s.label} className="flex items-start gap-4">
                  {i > 0 && <span className="mt-1 h-10 w-px bg-white/15" />}
                  <div>
                    <p className="font-display text-3xl font-bold tabular-nums text-white sm:text-4xl">
                      {s.value}
                    </p>
                    <p className="mt-0.5 text-xs text-white/50">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED TRIP — with big magazine number ===== */}
      {featured && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div className="relative space-y-5">
              {/* Big magazine number background */}
              <span className="mag-number pointer-events-none absolute -left-4 -top-8 select-none">
                01
              </span>
              <div className="relative">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
                  <span className="h-px w-10 bg-accent" />
                  Tuyến nổi bật trong tuần
                </span>
                <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
                  {featured.from.name ?? featured.from.code}
                  <span className="mx-3 text-accent">→</span>
                  {featured.to.name ?? featured.to.code}
                </h2>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-ink-muted">
                  {featured.title ?? "Hành trình xuyên miền đất nước, ngắm cảnh từ cửa sổ tàu hỏa. Những cung đường đẹp nhất Việt Nam."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
                  <CalendarDays className="size-4 text-primary" />
                  <span className="font-mono tabular-nums text-ink">
                    {compactDate(featured.dateStart)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
                  <TrainFront className="size-4 text-primary" />
                  <span className="font-mono tabular-nums text-ink">
                    Tàu {featured.trainNumber ?? "—"}
                  </span>
                </span>
                <Badge
                  variant={
                    featured.availableSeats > 5
                      ? "success"
                      : featured.availableSeats > 0
                        ? "warning"
                        : "destructive"
                  }
                >
                  {featured.availableSeats > 0
                    ? `${featured.availableSeats} chỗ trống`
                    : "Hết chỗ"}
                </Badge>
              </div>

              <div className="flex items-end gap-3 pt-2">
                <span className="pb-1.5 text-sm text-ink-muted">Giá từ</span>
                <span className="font-display text-5xl font-bold tabular-nums leading-none text-primary">
                  {formatCurrency(featured.minPrice)}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button asChild size="lg" variant="accent">
                  <Link href={`/tickets/${featured.ticketId}`}>
                    Đặt vé ngay
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <span className="tilted-tag text-xs text-ink-subtle">
                  ← Hành trình ưa chuộng
                </span>
              </div>
            </div>

            {/* Visual card — no blur glow behind, just clean card with stamp */}
            <div className="relative">
              <Card variant="elevated" padding="lg" className="relative">
                {/* Stamp decoration */}
                <div className="absolute -right-3 -top-3 z-10">
                  <span className="stamp bg-accent text-white">Nổi bật</span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-ink-subtle">
                      #{featured.ticketId.slice(0, 8).toUpperCase()}
                    </span>
                    <Badge variant="outline">{calcDuration(featured.dateStart, featured.dateEnd)}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-4xl font-bold tabular-nums text-ink">
                        {extractTime(featured.dateStart)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        {featured.from.name ?? featured.from.code}
                      </p>
                      <p className="text-xs text-ink-subtle">
                        Ga {featured.from.code}
                      </p>
                    </div>
                    <div className="flex flex-1 flex-col items-center px-4">
                      <TrainFront className="size-5 text-accent" />
                      <div className="mt-2 flex w-full items-center gap-1">
                        <span className="size-2.5 rounded-full border-2 border-primary bg-primary-soft" />
                        <div className="h-px flex-1 border-t border-dashed border-border" />
                        <span className="size-2.5 rounded-full border-2 border-primary bg-primary" />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-4xl font-bold tabular-nums text-ink">
                        {extractTime(featured.dateEnd)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-ink">
                        {featured.to.name ?? featured.to.code}
                      </p>
                      <p className="text-xs text-ink-subtle">
                        Ga {featured.to.code}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 border-t border-border pt-4">
                    {featured.seatClasses?.map((c: string) => (
                      <Badge key={c} variant="outline" className="text-[11px]">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* ===== WHY US — varied card styles, not identical ===== */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
                <span className="h-px w-10 bg-accent" />
                Vì sao chọn chúng tôi
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Trải nghiệm đặt vé
                <br />
                <span className="text-ink-muted">khác biệt</span>
              </h2>
            </div>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {/* Card 1 — dark filled */}
            <div className="rounded-2xl bg-primary p-7 text-primary-foreground">
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/10">
                <Ticket className="size-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">
                Giữ chỗ tức thì
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Chọn ghế và giữ chỗ trong 10 phút. Không cần gọi điện, không cần chờ đợi.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-white/50">
                <span className="font-mono">10:00</span>
                <span>phút giữ chỗ</span>
              </div>
            </div>

            {/* Card 2 — outlined with accent border */}
            <div className="rounded-2xl border-2 border-accent/30 bg-card p-7">
              <div className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink">
                Thanh toán an toàn
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                VNPay chuẩn PCI DSS. Mọi giao dịch được mã hóa và giám sát 24/7.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <Badge variant="accent" className="text-[10px]">PCI DSS</Badge>
                <Badge variant="outline" className="text-[10px]">Mã hóa 256-bit</Badge>
              </div>
            </div>

            {/* Card 3 — gold tinted */}
            <div className="rounded-2xl border border-gold/30 bg-gold-soft/50 p-7">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gold text-white">
                <Wallet className="size-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink">
                Vé điện tử QR
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Vé xuất hiện ngay trong tài khoản. Quét QR lên tàu, không cần in giấy.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-ink-subtle">
                <span className="font-mono">QR</span>
                <span>quét mã lên tàu</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== POPULAR ROUTES — numbered, magazine style ===== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
              <span className="h-px w-10 bg-accent" />
              Tuyến phổ biến
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Chuyến đang mở bán
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/tickets">
              Xem tất cả
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>

        {tripsQuery.isLoading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="mt-3 h-4 w-1/2" />
                <Skeleton className="mt-5 h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {trips.map((trip, idx) => (
              <Link key={trip.ticketId} href={`/tickets/${trip.ticketId}`} className="group">
                <Card variant="outlined" padding="lg" interactive className="relative h-full overflow-hidden">
                  {/* Number badge */}
                  <span className="absolute right-5 top-5 font-display text-5xl font-bold tabular-nums text-ink/[0.06]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl font-semibold tracking-tight text-ink">
                        {trip.from.name ?? trip.from.code}{" "}
                        <span className="text-accent">→</span>{" "}
                        {trip.to.name ?? trip.to.code}
                      </h3>
                      <p className="mt-1 text-sm text-ink-muted">
                        {trip.title ?? "Tuyến đường sắt"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        trip.availableSeats > 5
                          ? "success"
                          : trip.availableSeats > 0
                            ? "warning"
                            : "destructive"
                      }
                      className="shrink-0"
                    >
                      {trip.availableSeats > 0 ? "Còn chỗ" : "Hết chỗ"}
                    </Badge>
                  </div>

                  <div className="my-5 h-px bg-border" />

                  <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <span className="inline-flex items-center gap-2 text-ink-muted">
                      <CalendarDays className="size-4 text-primary" />
                      <span className="font-mono tabular-nums text-ink">
                        {compactDate(trip.dateStart)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-ink-muted">
                      <Clock3 className="size-4 text-primary" />
                      <span className="font-mono tabular-nums text-ink">
                        {calcDuration(trip.dateStart, trip.dateEnd)}
                      </span>
                    </span>
                    <span className="ml-auto font-display text-2xl font-bold tabular-nums text-primary">
                      {formatCurrency(trip.minPrice)}
                    </span>
                  </div>

                  <div className="relative mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Xem chi tiết <ArrowRight className="size-3.5" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== CTA — clean, no blur blobs ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 sm:px-16">
          {/* Subtle pattern instead of blur blobs */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(45deg, white 25%, transparent 25%), linear-gradient(-45deg, white 25%, transparent 25%)",
              backgroundSize: "20px 20px",
            }}
          />
          {/* Decorative circle outline */}
          <div className="absolute -right-20 -top-20 size-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-16 -left-16 size-48 rounded-full border border-white/[0.07]" />

          <div className="relative max-w-2xl">
            <span className="stamp text-gold">Bắt đầu ngay</span>
            <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              Sẵn sàng cho hành trình
              <br />
              <span className="text-gold">tiếp theo?</span>
            </h2>
            <p className="mt-4 max-w-lg text-base text-white/70">
              Đặt vé ngay hôm nay. Đổi trả miễn phí trong 24 giờ đầu.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/search">
                  Tìm chuyến
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/route-map">Xem lộ trình</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

/* Helper functions */
function compactDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function extractTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcDuration(start: string | null | undefined, end: string | null | undefined) {
  if (!start || !end) return "—";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}
