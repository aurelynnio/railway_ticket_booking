"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import {
  EmptyState,
  PaginationBar,
  SectionHeading,
  StatCard,
  StatusBadge,
  compactId,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/auth.hook";
import { useOrders } from "@/hooks/order.hook";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusTone,
} from "@/lib/formatters";

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
              <article
                key={order.id}
                className="surface-panel grid gap-4 rounded-[1.85rem] px-5 py-5 lg:grid-cols-[1.15fr_0.85fr]"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-2xl font-semibold tracking-normal text-foreground">
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

                <div className="rounded-[1.6rem] bg-white/62 px-4 py-4 ring-1 ring-black/6">
                  <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                    Tổng tiền
                  </p>
                  <p className="mt-2 font-heading text-3xl font-semibold tracking-normal">
                    {formatCurrency(order.totalPrice)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cập nhật {formatDateTime(order.updatedAt)}
                  </p>
                  <div className="mt-4">
                    <Button asChild variant="outline">
                      <Link href={`/profile/orders/${order.id}`}>Mở chi tiết</Link>
                    </Button>
                  </div>
                </div>
              </article>
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
