"use client";

import Link from "next/link";
import {
  Ticket,
  ArrowRight,
  TrainFront,
  CalendarDays,
  MapPin,
  Clock,
  Printer,
} from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/order.hook";
import { OrderStatus } from "@/lib/api-types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { TicketQRCode } from "@/components/ticket/qr-code";

export default function ProfileTicketsPage() {
  // Fetch orders that are paid or confirmed or have tickets issued
  const query = useOrders({ page: 1, limit: 50 });
  const allOrders = query.data?.data ?? [];

  // Filter for orders where ticket is issued or paid
  const issuedOrders = allOrders.filter((order) =>
    [OrderStatus.Paid, OrderStatus.Confirmed, OrderStatus.TicketIssued].includes(
      order.status
    )
  );

  return (
    <AppLayout>
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            <span className="h-px w-10 bg-accent" />
            Tài khoản
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Vé tàu của tôi
          </h1>
          <p className="mt-2 max-w-xl text-base text-ink-muted">
            Danh sách vé điện tử đã thanh toán. Xuất trình mã QR tại cửa soát vé ga tàu.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {query.isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="mt-4 h-24 w-full" />
              </div>
            ))}
          </div>
        ) : issuedOrders.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-16">
            <Ticket className="mx-auto size-12 text-ink-subtle" />
            <p className="mt-4 font-display text-xl font-semibold text-ink">
              Chưa có vé điện tử
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Vé điện tử sẽ tự động xuất hiện ở đây sau khi bạn hoàn tất thanh toán.
            </p>
            <Button asChild variant="accent" className="mt-5">
              <Link href="/search">
                Tìm chuyến tàu ngay
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {issuedOrders.map((order) => {
              const ticketCode =
                order.ticketCode || `TCK-${order.id.slice(0, 8).toUpperCase()}`;
              const qrValue =
                order.qrPayload ||
                JSON.stringify({
                  orderId: order.id,
                  ticketCode,
                  train: order.trainNumber,
                  seats: order.seatLabels,
                });

              return (
                <Card
                  key={order.id}
                  variant="outlined"
                  padding="none"
                  className="overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-all shadow-sm"
                >
                  {/* Top Bar */}
                  <div className="bg-primary/95 px-5 py-3 text-primary-foreground flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrainFront className="size-4 text-accent" />
                      <span className="font-mono text-sm font-bold">
                        Tàu {order.trainNumber ?? "—"}
                      </span>
                      <span className="text-primary-foreground/60 text-xs">·</span>
                      <span className="text-xs text-primary-foreground/90">
                        Toa {order.coachCode ?? "—"} ({order.seatClass ?? "Tiêu chuẩn"})
                      </span>
                    </div>
                    <Badge variant="accent" className="font-mono text-xs font-bold">
                      {ticketCode}
                    </Badge>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div>
                        <p className="font-display text-lg font-bold text-ink">
                          {order.departureStationName ?? order.departureStationCode} →{" "}
                          {order.arrivalStationName ?? order.arrivalStationCode}
                        </p>
                        <p className="font-mono text-xs text-primary font-medium mt-1">
                          Khởi hành: {formatDateTime(order.departureTime)}
                        </p>
                      </div>

                      <div className="space-y-1 text-xs text-ink-muted border-t border-border pt-3">
                        <p>
                          Chỗ ngồi:{" "}
                          <span className="font-mono font-bold text-ink text-sm">
                            {order.seatLabels?.length > 0
                              ? order.seatLabels.join(", ")
                              : `${order.quantity} vé`}
                          </span>
                        </p>
                        {order.passengers && order.passengers.length > 0 && (
                          <p>
                            Hành khách:{" "}
                            <span className="font-medium text-ink">
                              {order.passengers.map((p) => p.fullName).join(", ")}
                            </span>
                          </p>
                        )}
                        <p>
                          Tổng tiền:{" "}
                          <span className="font-mono font-semibold text-primary">
                            {formatCurrency(order.totalPrice ?? "0")}
                          </span>
                        </p>
                      </div>

                      <div className="pt-2 flex items-center gap-3">
                        <Button asChild variant="accent" size="sm">
                          <Link href={`/orders/${order.id}`}>
                            Xem thẻ lên tàu
                            <ArrowRight className="size-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/20 border border-border shrink-0">
                      <TicketQRCode value={qrValue} size={110} />
                      <span className="mt-1 text-[10px] text-ink-muted">Mã vé QR</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
