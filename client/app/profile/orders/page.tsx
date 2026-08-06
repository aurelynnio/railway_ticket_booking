"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import {
  DetailBlock,
  EmptyState,
  PaginationBar,
  SectionHeading,
  StatCard,
  StatusBadge,
  compactId,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";
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
    <AppShell
      title="Đơn của tôi"
      description="Theo dõi đơn hàng của tài khoản đang đăng nhập, gồm trạng thái, tổng tiền và chi tiết vé đã chọn."
      actions={
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <StatCard
              label="Session email"
              value={sessionQuery.data?.email ?? "Guest"}
              helper="Tài khoản đang đăng nhập."
            />
            <StatCard
              label="Đơn hiển thị"
              value={String(orders.length)}
              helper="Số đơn đang có trong trang hiện tại."
            />
          </div>
          {orders.length > 0 ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                id="export-orders-csv"
                onClick={() => exportOrdersToCsv(orders)}
              >
                <Download className="size-4" />
                Xuất CSV
              </Button>
            </div>
          ) : null}
        </div>
      }
    >
      <Panel
        title="Lịch sử đặt vé"
        description="Xem lại tuyến đã đặt, ghế đã chọn, tổng tiền và thời điểm cập nhật gần nhất."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Account history"
            title="Lịch sử đặt vé"
            description="Mỗi đơn có đường dẫn riêng để mở chi tiết khi cần kiểm tra trạng thái."
          />

          {!sessionUserId && !sessionQuery.isLoading ? (
            <EmptyState
              title="Can dang nhap"
              description="Bạn cần đăng nhập để xem đơn hàng cá nhân."
              href="/login"
              cta="Mở đăng nhập"
            />
          ) : null}

          <div className="grid gap-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="grid gap-4 px-5 py-5 lg:grid-cols-[1.15fr_0.85fr]"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                        {order.ticketTitle}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {compactId(order.id)} • {compactId(order.ticketCode)}
                      </p>
                    </div>
                    <StatusBadge
                      label={formatOrderStatus(order.status)}
                      tone={getOrderStatusTone(order.status)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.departureStationName ?? order.departureStationCode ?? "?"} đến{" "}
                    {order.arrivalStationName ?? order.arrivalStationCode ?? "?"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ghế: {order.seatLabels.join(", ") || "Chưa chọn"}
                  </p>
                </div>

                <div className="grid gap-3">
                  <DetailBlock
                    label="Tổng tiền"
                    value={formatCurrency(order.totalPrice)}
                    hint={`Cập nhật ${formatDateTime(order.updatedAt)}`}
                  />
                  <div className="mt-4">
                    <Button asChild variant="outline">
                      <Link href={`/profile/orders/${order.id}`}>Mở chi tiết</Link>
                    </Button>
                  </div>
                </div>
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
    </AppShell>
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
