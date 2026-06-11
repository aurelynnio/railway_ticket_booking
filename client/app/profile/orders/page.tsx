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
      title="My orders"
      description="Danh sach order cua user dang dang nhap, lay `userId` tu session cookie-backed roi query nguoc ve `orders-service`."
      actions={
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard
            label="Session email"
            value={sessionQuery.data?.email ?? "Guest"}
            helper="Nguon du lieu user hien tai tu auth session."
          />
          <StatCard
            label="Orders on page"
            value={String(orders.length)}
            helper="So order hien thi trong viewport profile."
          />
        </div>
      }
    >
      <Panel
        title="Personal order feed"
        description="Card layout uu tien thoi gian, tong tien, seat labels va diem chuyen sang order detail."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Account history"
            title="Lich su dat ve"
            description="Moi order giu o mot card rieng de de scan tren mobile hon so voi bang ops."
          />

          {!sessionUserId && !sessionQuery.isLoading ? (
            <EmptyState
              title="Can dang nhap"
              description="Can co session hop le moi co the xem orders ca nhan."
              href="/login"
              cta="Mo dang nhap"
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
                      <p className="font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">
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
                    {order.departureStationName ?? order.departureStationCode ?? "?"} den{" "}
                    {order.arrivalStationName ?? order.arrivalStationCode ?? "?"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ghe: {order.seatLabels.join(", ") || "Chua chon"}
                  </p>
                </div>

                <div className="rounded-[1.6rem] bg-white/62 px-4 py-4 ring-1 ring-black/6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Financials
                  </p>
                  <p className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em]">
                    {formatCurrency(order.totalPrice)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cap nhat {formatDateTime(order.updatedAt)}
                  </p>
                  <div className="mt-4">
                    <Button asChild variant="outline">
                      <Link href={`/profile/orders/${order.id}`}>Mo chi tiet</Link>
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
