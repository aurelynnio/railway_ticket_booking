"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, ExternalLink, Receipt, MapPin, Clock, Users, Train } from "lucide-react";

import { Panel } from "@/components/app-shell";
import {
  EmptyState,
  PaginationBar,
  StatusBadge,
  compactId,
} from "@/components/railway-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useAuthSession } from "@/hooks/auth.hook";
import { useOrders } from "@/hooks/order.hook";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusTone,
} from "@/lib/formatters";
import { OrderResponse } from "@/lib/api-types";

export default function ProfileOrdersPage() {
  const sessionQuery = useAuthSession();
  const [page, setPage] = useState(1);
  const sessionUserId = sessionQuery.data?.userId;

  const query = useOrders(
    {
      page,
      limit: 8,
      userId: sessionUserId,
    },
    Boolean(sessionUserId),
  );

  const orders = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <Panel
      eyebrow="Lịch sử"
      title="Đơn hàng của tôi"
      description="Theo dõi đơn hàng, trạng thái thanh toán và chi tiết vé đã đặt."
      action={
        orders.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            id="export-orders-csv"
            onClick={() => exportOrdersToCsv(orders)}
            className="gap-2"
          >
            <Download className="size-3.5" />
            Xuất CSV
          </Button>
        ) : null
      }
    >
      <div className="space-y-5">
        {!sessionUserId && !sessionQuery.isLoading ? (
          <EmptyState
            title="Cần đăng nhập"
            description="Bạn cần đăng nhập để xem đơn hàng cá nhân."
            href="/login"
            cta="Mở đăng nhập"
          />
        ) : null}

        {query.isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-sm border border-border bg-muted/40" />
            ))}
          </div>
        ) : null}

        {!query.isLoading && !query.isError && orders.length === 0 && sessionUserId ? (
          <EmptyState
            title="Chưa có đơn hàng nào"
            description="Bạn chưa có đơn hàng nào. Tìm chuyến và đặt vé ngay."
            href="/search"
            cta="Tìm chuyến ngay"
          />
        ) : null}

        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} variant="outlined" padding="none" className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-[1fr_auto]">
                  <div className="p-5 md:p-6 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Receipt className="size-3.5 text-ink-muted" />
                          <span className="mono text-xs font-medium tabular-nums text-ink-muted">
                            Đơn #{compactId(order.id)}
                          </span>
                          {order.trainNumber ? (
                            <>
                              <span className="text-ink-muted">·</span>
                              <span className="mono text-xs font-medium text-ink-muted flex items-center gap-1">
                                <Train className="size-3" />
                                {order.trainNumber}
                              </span>
                            </>
                          ) : null}
                        </div>
                        <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                          {order.ticketTitle}
                        </h3>
                      </div>
                      <StatusBadge
                        label={formatOrderStatus(order.status)}
                        tone={getOrderStatusTone(order.status)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="text-ink font-medium">
                            {order.departureStationName ?? order.departureStationCode ?? "?"}
                          </span>
                          <span className="text-ink-muted mx-1">→</span>
                          <span className="text-ink font-medium">
                            {order.arrivalStationName ?? order.arrivalStationCode ?? "?"}
                          </span>
                        </div>
                      </div>
                      {order.departureTime ? (
                        <div className="flex items-center gap-2">
                          <Clock className="size-3.5 text-ink-muted shrink-0" />
                          <span className="mono text-xs tabular-nums text-ink-muted">
                            {formatDateTime(order.departureTime)}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-ink-muted shrink-0" />
                        <span className="text-sm text-ink-muted">
                          {order.quantity} vé
                          {order.seatLabels.length > 0 ? (
                            <span className="ml-2 inline-flex flex-wrap gap-1">
                              {order.seatLabels.map((seat) => (
                                <Badge key={seat} variant="outline" className="mono tabular-nums text-[10px] h-5">
                                  {seat}
                                </Badge>
                              ))}
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="mono text-xs tabular-nums text-ink-muted">
                          Đặt lúc: {formatDateTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border md:border-t-0 md:border-l bg-muted/30 p-5 md:p-6 flex flex-col justify-between gap-4 min-w-[180px]">
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                        Tổng tiền
                      </div>
                      <div className="font-display text-2xl font-semibold tabular-nums text-ink mono">
                        {formatCurrency(order.totalPrice)}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="gap-1.5 w-full">
                      <Link href={`/profile/orders/${order.id}`}>
                        Chi tiết
                        <ExternalLink className="size-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {pagination ? (
          <PaginationBar
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPrev={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() =>
              setPage((current) =>
                pagination.totalPages === 0
                  ? current
                  : Math.min(pagination.totalPages, current + 1),
              )
            }
          />
        ) : null}
      </div>
    </Panel>
  );
}

function exportOrdersToCsv(orders: OrderResponse[]) {
  const headers = [
    "Order ID",
    "Ticket Title",
    "Route",
    "Departure Time",
    "Arrival Time",
    "Train Number",
    "Seat Labels",
    "Passengers",
    "Quantity",
    "Unit Price",
    "Total Price",
    "Status",
    "Ticket Code",
    "Created At",
  ];

  const rows = orders.map((order) => [
    order.id,
    order.ticketTitle,
    `${order.departureStationName ?? order.departureStationCode ?? "?"} -> ${order.arrivalStationName ?? order.arrivalStationCode ?? "?"}`,
    order.departureTime ?? "",
    order.arrivalTime ?? "",
    order.trainNumber ?? "",
    order.seatLabels.join(" | "),
    order.passengers.map((p) => p.fullName).join(" | "),
    String(order.quantity),
    String(order.unitPrice),
    String(order.totalPrice),
    String(order.status),
    order.ticketCode ?? "",
    order.createdAt,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `orders-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
