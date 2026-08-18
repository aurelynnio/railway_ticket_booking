"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrainFront,
  Wallet,
} from "lucide-react";

import { AppShell, Panel } from "@/components/shell/app-shell";
import { AnimatedSection } from "@/components/motion/animated-section";
import { CountUp } from "@/components/motion/count-up";
import { TicketNotch } from "@/components/ticket/ticket-notch";
import {
  EmptyState,
} from "@/components/ui/railway-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSearchTrips,
  useStationSuggestions,
} from "@/hooks/search.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

const STATIONS = [
  { name: "Hà Nội", code: "HAN" },
  { name: "Huế", code: "HUE" },
  { name: "Đà Nẵng", code: "DAD" },
  { name: "Nha Trang", code: "NTR" },
  { name: "Sài Gòn", code: "SGN" },
] as const;

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
  const router = useRouter();
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const stationSuggestionsQuery = useStationSuggestions();
  const stationOptions =
    stationSuggestionsQuery.data && stationSuggestionsQuery.data.length > 0
      ? stationSuggestionsQuery.data
      : STATIONS;

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

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchFrom) params.set("from", searchFrom);
    if (searchTo) params.set("to", searchTo);
    if (searchDate) params.set("date", searchDate);
    const qs = params.toString();
    router.push(`/search${qs ? `?${qs}` : ""}`);
  };

  return (
    <AppShell
      title="Đặt vé tàu Bắc · Trung · Nam chỉ trong vài phút"
      description="Vietrail Way giúp bạn tra cứu tuyến, so sánh giá và giữ chỗ trên cùng một mạch — không cần chờ, không cần gọi điện."
      heroVariant="rich"
      actions={
        <>
          <Button asChild size="lg">
            <Link href="#home-search">
              Tìm chuyến ngay
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/route-map">
              <MapPin aria-hidden />
              Xem bản đồ tuyến
            </Link>
          </Button>
        </>
      }
    >
      <div className="page-section">
        <AnimatedSection
          as="section"
          id="home-search"
          variant="fadeUp"
          stagger
          aria-label="Tìm chuyến"
          className="-mt-2 scroll-mt-24"
        >
          <Card variant="outlined" className="px-5 py-5 sm:px-6 sm:py-6 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/20" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="eyebrow">Tìm chuyến ngay</span>
                  <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                    Tra cứu tuyến đường sắt
                  </h2>
                </div>
                <Badge variant="default" className="hidden sm:inline-flex">
                  <TrainFront className="size-3" />
                  {tripsQuery.isLoading ? "…" : `${trips.length} chuyến`}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto]">
                <label htmlFor="home-from" className="grid gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Ga đi</span>
                  <Select
                    id="home-from"
                    value={searchFrom}
                    onChange={(e) => setSearchFrom(e.target.value)}
                  >
                    <option value="">Chọn ga đi</option>
                    {stationOptions.map((station) => (
                      <option key={station.code ?? station.name} value={station.code ?? ""}>
                        {station.name} ({station.code})
                      </option>
                    ))}
                  </Select>
                </label>
                <label htmlFor="home-to" className="grid gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Ga đến</span>
                  <Select
                    id="home-to"
                    value={searchTo}
                    onChange={(e) => setSearchTo(e.target.value)}
                  >
                    <option value="">Chọn ga đến</option>
                    {stationOptions.map((station) => (
                      <option key={station.code ?? station.name} value={station.code ?? ""}>
                        {station.name} ({station.code})
                      </option>
                    ))}
                  </Select>
                </label>
                <label htmlFor="home-date" className="grid gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Ngày đi</span>
                  <Input
                    id="home-date"
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                  />
                </label>
                <div className="flex items-end">
                  <Button size="lg" onClick={handleSearch} className="w-full md:w-auto">
                    <SearchIcon className="size-4" />
                    Tìm chuyến
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </AnimatedSection>

        <AnimatedSection as="section" variant="fadeUp" stagger aria-label="Thống kê nhanh" className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Chuyến đang mở"
            value={tripsQuery.isLoading ? "—" : <CountUp to={trips.length} />}
            accent="primary"
          />
          <StatTile
            label="Chỗ còn lại"
            value={tripsQuery.isLoading ? "—" : <CountUp to={totalSeats} />}
          />
          <StatTile
            label="Giá từ"
            value={tripsQuery.isLoading ? "—" : lowestPrice ? formatCurrency(lowestPrice) : "—"}
            isPrice
          />
          <StatTile
            label="Tuyến phủ sóng"
            value="36 ga"
            helper="Bắc · Trung · Nam"
          />
        </AnimatedSection>

        <AnimatedSection as="section" variant="fadeUp" stagger aria-label="Hành trình 4 bước">
          <div className="space-y-4">
            <div>
              <span className="eyebrow">Quy trình đơn giản</span>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                Bốn bước đến vé tàu
              </h2>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute left-8 right-8 top-[22px] h-px bg-border" aria-hidden />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {journeySteps.map((step, index) => (
                  <div key={step.label} className="relative flex gap-3">
                    <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary-soft font-mono text-sm font-semibold tabular-nums text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="pt-0.5">
                      <h3 className="font-display text-base font-semibold tracking-tight text-ink">
                        {step.label}
                      </h3>
                      <p className="mt-0.5 text-sm text-ink-muted">{step.helper}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {featuredTrip ? (
          <AnimatedSection as="section" variant="fadeUp" delay={0.1} aria-label="Tuyến nổi bật">
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="eyebrow">Tuyến nổi bật</span>
                  <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                    Hành trình hôm nay
                  </h2>
                </div>
              </div>
              <TicketNotch dashed>
                <Card variant="outlined" className="iso-card-tilt px-5 py-5 sm:px-6 sm:py-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary/20 bg-primary-soft text-primary">
                        <TrainFront className="size-5" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Nổi bật</Badge>
                          <Badge variant={featuredTrip.availableSeats > 5 ? "success" : featuredTrip.availableSeats > 0 ? "warning" : "destructive"}>
                            {featuredTrip.availableSeats > 0 ? `${featuredTrip.availableSeats} chỗ trống` : "Hết chỗ"}
                          </Badge>
                        </div>
                        <h3 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                          {featuredTrip.from.name ?? featuredTrip.from.code ?? "?"} <span className="text-primary mx-1">→</span>{" "}
                          {featuredTrip.to.name ?? featuredTrip.to.code ?? "?"}
                        </h3>
                        <p className="text-sm text-ink-muted">
                          {featuredTrip.title ?? "Tuyến đường sắt Việt Nam"}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                          <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                            <CalendarDays className="size-3.5 text-primary" />
                            <span className="font-mono tabular-nums text-ink">{compactDate(featuredTrip.dateStart)}</span>
                          </span>
                          {featuredTrip.trainNumber ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                              <Clock3 className="size-3.5 text-primary" />
                              <span className="font-mono tabular-nums text-ink">{featuredTrip.trainNumber}</span>
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
                            <Ticket className="size-3.5 text-primary" />
                            Tàu <span className="font-mono tabular-nums text-ink">{featuredTrip.trainNumber ?? "—"}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">Giá từ</p>
                        <p className="font-mono text-3xl font-bold tabular-nums text-ink">
                          {formatCurrency(featuredTrip.minPrice)}
                        </p>
                      </div>
                      <Button asChild size="lg">
                        <Link href={`/tickets/${featuredTrip.ticketId}`}>
                          Xem chi tiết
                          <ArrowRight />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </TicketNotch>
            </div>
          </AnimatedSection>
        ) : null}

        {tripsQuery.isLoading ? (
          <Panel title="Chuyến đang mở bán" description="Đang tải dữ liệu…">
            <div className="grid gap-3 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="border border-border bg-card p-5"
                >
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : trips.length > 0 ? (
          <section aria-label="Chuyến đang mở bán" className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <span className="eyebrow">Tuyến phổ biến</span>
                <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  Chuyến đang mở bán
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Các hành trình nổi bật đang có chỗ, chọn nhanh để xem chi tiết.
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/tickets">
                  Xem tất cả
                  <ArrowRight />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {trips.map((trip) => (
                <Link
                  key={trip.ticketId}
                  href={`/tickets/${trip.ticketId}`}
                  className="iso-card-tilt group block border border-border bg-card p-5 transition-colors hover:border-border-strong hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                        {trip.from.name ?? trip.from.code ?? "?"} <span className="text-primary">→</span>{" "}
                        {trip.to.name ?? trip.to.code ?? "?"}
                      </h3>
                      <p className="text-sm text-ink-muted">
                        {trip.title ?? "Tuyến chưa đặt tên"}
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

                  <div className="my-4 h-px bg-border" />

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-ink-muted">
                      <CalendarDays className="size-3.5 text-primary" />
                      <span className="font-mono tabular-nums text-ink">{compactDate(trip.dateStart)}</span>
                    </span>
                    {trip.trainNumber ? (
                      <span className="inline-flex items-center gap-1.5 text-ink-muted">
                        <TrainFront className="size-3.5 text-primary" />
                        <span className="font-mono tabular-nums text-ink">{trip.trainNumber}</span>
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5 text-ink-muted">
                      <Ticket className="size-3.5 text-primary" />
                      <span className="text-ink">{trip.availableSeats} chỗ</span>
                    </span>
                    <span className="ml-auto font-mono text-lg font-bold tabular-nums text-ink">
                      {formatCurrency(trip.minPrice)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Xem chi tiết <ArrowRight className="size-3" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : !tripsQuery.isLoading ? (
          <EmptyState
            title="Chưa có chuyến nổi bật"
            description="Thử tìm theo ga đi, ga đến hoặc ngày khởi hành để xem lựa chọn phù hợp."
            href="/search"
            cta="Mở trang search"
            illustration="train-empty"
            illustrationTone="muted"
          />
        ) : null}

        <section aria-label="Truy cập nhanh" className="space-y-4">
          <div>
            <span className="eyebrow">Truy cập nhanh</span>
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Tác vụ phổ biến
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Chọn tác vụ để bắt đầu.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {taskCards.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="iso-card-tilt group flex items-start gap-4 border border-border bg-card p-5 transition-colors hover:border-border-strong hover:bg-muted/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/20 bg-primary-soft text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-display text-base font-semibold text-ink">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-muted">
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              );
            })}
          </div>
        </section>

        <section
          aria-label="Cam kết dịch vụ"
          className="border border-border bg-card px-5 py-5 sm:px-6 sm:py-6"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/20 bg-primary-soft text-primary">
                <MapPin className="size-4" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-semibold text-ink">
                  Tối ưu cho hành trình Bắc – Trung – Nam
                </h3>
                <p className="text-sm leading-relaxed text-ink-muted">
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
      </div>
    </AppShell>
  );
}

function StatTile({
  label,
  value,
  helper,
  accent,
  isPrice = false,
}: {
  label: string;
  value: React.ReactNode;
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
        className={
          "mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums " +
          (accent === "primary" ? "text-primary" : "text-ink") +
          (isPrice ? " font-mono" : "")
        }
      >
        {value}
      </p>
      {helper ? (
        <p className="mt-0.5 text-sm text-ink-muted">{helper}</p>
      ) : null}
    </div>
  );
}

function compactDate(value: string | null | undefined) {
  const formatted = formatDateTime(value);
  return formatted === "N/A" ? formatted : formatted.replace(", ", " · ");
}
