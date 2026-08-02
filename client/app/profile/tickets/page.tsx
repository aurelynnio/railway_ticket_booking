"use client";

import { AppShell, Panel } from "@/components/app-shell";
import {
  DetailBlock,
  EmptyState,
  SectionHeading,
  SeatCloud,
  StatusBadge,
} from "@/components/railway-ui";
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
    <AppShell
      title="Vé đã phát hành"
      description="Xem các vé đã được phát hành từ đơn hàng hoàn tất của tài khoản hiện tại."
    >
      <Panel
        title="Ví vé"
        description="Mỗi vé hiển thị mã vé, tuyến, ghế và mã QR để tiện kiểm tra trước chuyến đi."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Travel wallet"
            title="Vé đã phát hành"
            description="Thông tin được gom gọn để bạn kiểm tra nhanh tuyến, ghế, mã vé và QR."
          />

          {!sessionUserId && !sessionQuery.isLoading ? (
            <EmptyState
              title="Cần đăng nhập"
              description="Bạn cần đăng nhập để xem ví vé của tài khoản hiện tại."
              href="/login"
              cta="Mở đăng nhập"
            />
          ) : null}

          {tickets.length === 0 && sessionUserId ? (
            <EmptyState
              title="Chưa có vé nào được phát hành"
              description="Khi đơn hàng được phát hành vé, vé sẽ xuất hiện tại đây."
            />
          ) : null}

          <div className="grid gap-4">
            {tickets.map((order) => (
              <article
                key={order.id}
                className="surface-panel grid gap-5 rounded-lg px-5 py-5 lg:grid-cols-[1.05fr_0.95fr]"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                        {order.ticketTitle}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.ticketCode ?? "Chưa có mã vé"}
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
                  <SeatCloud labels={order.seatLabels} />
                </div>

                <div className="grid gap-3">
                  <DetailBlock
                    label="Giá trị vé"
                    value={formatCurrency(order.totalPrice)}
                    hint={`Phát hành gần nhất: ${formatDateTime(order.updatedAt)}`}
                  />
                  <DetailBlock
                    label="QR"
                    value={<span className="break-all">{order.qrPayload ?? "Đang cập nhật"}</span>}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
