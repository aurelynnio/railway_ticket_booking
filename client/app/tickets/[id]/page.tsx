"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrainFront,
  CalendarDays,
  Clock,
  MapPin,
  Info,
} from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useTicket, useSeatMap } from "@/hooks/ticket.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = Array.isArray(params.id) ? params.id[0] : params.id;
  const ticketQuery = useTicket(ticketId);
  const seatMapQuery = useSeatMap(ticketId);
  const ticket = ticketQuery.data;
  const seatMap = seatMapQuery.data;

  if (ticketQuery.isLoading) {
    return (
      <AppLayout>
        <div className="p-10">
          <Skeleton className="h-60 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!ticket) {
    return (
      <AppLayout>
        <div className="p-20 text-center">
          <p className="font-display text-2xl font-semibold text-ink">
            Không tìm thấy chuyến tàu
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
        </div>
      </AppLayout>
    );
  }

  const totalAvailable = seatMap?.items?.reduce(
    (sum, item) => sum + (item.availableSeatLabels?.length ?? 0),
    0,
  ) ?? 0;

  return (
    <AppLayout>
      {/* Hero */}
      <div className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 text-primary-foreground/80 hover:text-primary-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="accent" className="font-mono">
              <TrainFront className="size-3" />
              Tàu {ticket.trainNumber ?? "—"}
            </Badge>
            <Badge variant={totalAvailable > 0 ? "success" : "destructive"}>
              {totalAvailable} chỗ trống
            </Badge>
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold text-primary-foreground sm:text-4xl">
            {ticket.departureStationName ?? ticket.departureStationCode} →{" "}
            {ticket.arrivalStationName ?? ticket.arrivalStationCode}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-primary-foreground/90">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" />
              <span className="font-mono tabular-nums">{formatDateTime(ticket.dateStart)}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="size-4" />
              <span className="font-mono tabular-nums">{formatDateTime(ticket.dateEnd)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <Tabs defaultValue="seats">
            <TabsList>
              <TabsTrigger value="seats">
                <MapPin className="size-3.5" />
                Chọn ghế
              </TabsTrigger>
              <TabsTrigger value="info">
                <Info className="size-3.5" />
                Thông tin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="seats" className="mt-6">
              <Card variant="outlined" padding="lg">
                <h3 className="font-display text-lg font-semibold text-ink">
                  Sơ đồ ghế
                </h3>
                <div className="mt-6 space-y-6">
                  {seatMap?.items?.map((item) => (
                    <div key={item.ticketItemId}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {item.seatClass ?? "Hạng ghế"} · Toa {item.coachCode ?? "—"}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {item.availableSeatLabels?.length ?? 0} / {item.seatLabels?.length ?? 0} chỗ trống
                          </p>
                        </div>
                        <Badge variant="outline">{item.seatType ?? "—"}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.seatLabels?.map((seat) => {
                          const isAvailable = item.availableSeatLabels?.includes(seat);
                          return (
                            <span
                              key={seat}
                              className={`flex size-10 items-center justify-center rounded-lg text-xs font-mono font-medium ${
                                isAvailable
                                  ? "bg-primary-soft text-primary cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                  : "bg-muted text-ink-subtle cursor-not-allowed"
                              }`}
                            >
                              {seat}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {(!seatMap?.items || seatMap.items.length === 0) && (
                    <p className="py-8 text-center text-sm text-ink-muted">
                      Chưa có dữ liệu ghế.
                    </p>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="info" className="mt-6">
              <Card variant="outlined" padding="lg">
                <h3 className="font-display text-lg font-semibold text-ink">
                  Thông tin chuyến
                </h3>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <InfoRow label="Ga đi" value={`${ticket.departureStationName} (${ticket.departureStationCode})`} />
                  <InfoRow label="Ga đến" value={`${ticket.arrivalStationName} (${ticket.arrivalStationCode})`} />
                  <InfoRow label="Khởi hành" value={formatDateTime(ticket.dateStart)} />
                  <InfoRow label="Đến" value={formatDateTime(ticket.dateEnd)} />
                  <InfoRow label="Số tàu" value={ticket.trainNumber ?? "—"} />
                  <InfoRow label="Trạng thái" value={ticket.status === 1 ? "Đang mở bán" : "Tạm dừng"} />
                </div>
                {ticket.journeyNote && (
                  <div className="mt-6 border-t border-border pt-5">
                    <p className="text-sm font-semibold text-ink">Ghi chú</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      {ticket.journeyNote}
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card variant="elevated" padding="lg" className="sticky top-6">
              <h3 className="font-display text-lg font-semibold text-ink">
                Tóm tắt
              </h3>
              <div className="mt-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-ink-muted">Ga đi</span>
                  <span className="text-sm font-medium text-ink">
                    {ticket.departureStationName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-ink-muted">Ga đến</span>
                  <span className="text-sm font-medium text-ink">
                    {ticket.arrivalStationName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-ink-muted">Ngày đi</span>
                  <span className="text-sm font-medium text-ink">
                    {formatDateTime(ticket.dateStart)}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-ink-muted">Giá từ</span>
                    <span className="font-display text-2xl font-bold tabular-nums text-primary">
                      {formatCurrency(ticket.ticketItems?.[0]?.priceOriginal ?? "0")}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="accent" size="lg" className="mt-6 w-full">
                Đặt vé ngay
              </Button>
              <p className="mt-3 text-center text-xs text-ink-muted">
                Miễn phí huỷ trong 24 giờ đầu
              </p>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
