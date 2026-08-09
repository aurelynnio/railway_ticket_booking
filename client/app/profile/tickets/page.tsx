"use client";

import { ArrowRight, QrCode, MapPin, Train, Ticket } from "lucide-react";

import { Panel } from "@/components/app-shell";
import { TicketNotch } from "@/components/ticket-notch";
import {
  EmptyState,
  SeatCloud,
  StatusBadge,
} from "@/components/railway-ui";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useAuthSession } from "@/hooks/auth.hook";
import { useOrders } from "@/hooks/order.hook";
import { OrderStatus } from "@/lib/api-types";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusTone,
} from "@/lib/formatters";

export default function ProfileTicketsPage() {
  const sessionQuery = useAuthSession();
  const sessionUserId = sessionQuery.data?.userId;

  const query = useOrders(
    {
      page: 1,
      limit: 20,
      userId: sessionUserId,
      status: OrderStatus.TicketIssued,
    },
    Boolean(sessionUserId),
  );

  const tickets = query.data?.data ?? [];

  return (
    <Panel
      eyebrow="Ví vé"
      title="Vé đã phát hành"
      description="Xem các vé đã được phát hành từ đơn hàng hoàn tất. Mỗi vé hiển thị mã vé, tuyến, ghế và thông tin chuyến đi."
    >
      <div className="space-y-5">
        {!sessionUserId && !sessionQuery.isLoading ? (
          <EmptyState
            title="Cần đăng nhập"
            description="Bạn cần đăng nhập để xem ví vé của tài khoản hiện tại."
            href="/login"
            cta="Mở đăng nhập"
          />
        ) : null}

        {tickets.length === 0 && sessionUserId && !query.isLoading ? (
          <EmptyState
            title="Chưa có vé nào được phát hành"
            description="Khi đơn hàng được phát hành vé, vé sẽ xuất hiện tại đây."
            href="/search"
            cta="Tìm chuyến ngay"
          />
        ) : null}

        {query.isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-sm border border-border bg-muted/40" />
            ))}
          </div>
        ) : null}

        <div className="grid gap-4">
          {tickets.map((order) => (
            <TicketNotch key={order.id} dashed>
              <Card variant="outlined" padding="none" className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-[1fr_auto]">
                    <div className="p-5 md:p-6 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Train className="size-3.5 text-primary" strokeWidth={2} />
                            <span className="mono text-xs font-medium text-ink-muted">
                              {order.trainNumber ?? "N/A"}
                            </span>
                          </div>
                          <h3 className="font-display text-xl font-semibold tracking-tight text-ink">
                            {order.ticketTitle}
                          </h3>
                        </div>
                        <StatusBadge
                          label={formatOrderStatus(order.status)}
                          tone={getOrderStatusTone(order.status)}
                        />
                      </div>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                            <MapPin className="size-3" />
                            Đi
                          </div>
                          <p className="font-display text-base font-semibold text-ink">
                            {order.departureStationName ?? order.departureStationCode ?? "?"}
                          </p>
                          <p className="mono text-xs tabular-nums text-ink-muted">
                            {order.departureTime ? formatDateTime(order.departureTime) : "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center px-2">
                          <div className="h-px w-8 bg-border-strong" />
                          <ArrowRight className="size-4 text-primary mx-1" strokeWidth={1.5} />
                          <div className="h-px w-8 bg-border-strong" />
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                            Đến
                            <MapPin className="size-3" />
                          </div>
                          <p className="font-display text-base font-semibold text-ink">
                            {order.arrivalStationName ?? order.arrivalStationCode ?? "?"}
                          </p>
                          <p className="mono text-xs tabular-nums text-ink-muted">
                            {order.arrivalTime ? formatDateTime(order.arrivalTime) : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Ghế</span>
                          <SeatCloud labels={order.seatLabels} />
                        </div>
                        <div className="soft-divider hidden sm:block h-4 w-px" />
                        <Badge variant="outline" className="mono tabular-nums">
                          <Ticket className="size-3 mr-1" />
                          {order.ticketCode ?? "Chưa có mã"}
                        </Badge>
                      </div>
                    </div>

                    <div className="border-t border-border md:border-t-0 md:border-l bg-muted/30 p-5 md:p-6 flex flex-col justify-between gap-4 min-w-[200px]">
                      <div className="space-y-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                          Giá trị vé
                        </div>
                        <div className="font-display text-2xl font-semibold tabular-nums text-ink mono">
                          {formatCurrency(order.totalPrice)}
                        </div>
                        <div className="flex items-start gap-2">
                          <QrCode className="size-3.5 text-ink-muted shrink-0 mt-0.5" />
                          <p className="mono text-[10px] leading-relaxed text-ink-muted break-all">
                            {order.qrPayload ?? "Đang cập nhật QR"}
                          </p>
                        </div>
                      </div>
                      <div className="text-[11px] text-ink-muted mono tabular-nums">
                        Cập nhật: {formatDateTime(order.updatedAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TicketNotch>
          ))}
        </div>
      </div>
    </Panel>
  );
}
