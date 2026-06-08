"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import { useAuthSession } from "@/hooks/auth.hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/order.hook";
import { formatCurrency, formatDateTime, formatOrderStatus } from "@/lib/formatters";

export default function ProfileOrdersPage() {
  const sessionQuery = useAuthSession();
  const [page, setPage] = useState(1);
  const sessionUserId = sessionQuery.data?.userId;

  const query = useOrders({
    page,
    limit: 10,
    userId: sessionUserId,
  }, Boolean(sessionUserId));

  const pagination = query.data?.pagination;

  return (
    <AppShell
      title="Profile Orders"
      description="Trang nay hien thi orders cua user hien tai, lay userId tu cookie-backed session."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-500">
            {sessionQuery.data?.email ?? "Dang tai session..."}
          </span>
          <Link
            className="text-sm font-medium text-amber-700 hover:underline"
            href="/profile"
          >
            Quay ve profile
          </Link>
        </div>
      }
    >
      <Panel title="Orders" description="Mỗi order dẫn tới route chi tiết /orders/[id].">
        {sessionQuery.isLoading ? <p className="text-sm text-zinc-600">Dang tai session...</p> : null}
        {sessionQuery.isError ? <p className="text-sm text-red-600">Khong doc duoc session hien tai. Dang chuyen ve login.</p> : null}
        {!sessionUserId && !sessionQuery.isLoading ? <p className="text-sm text-zinc-600">Can dang nhap de xem orders cua anh.</p> : null}
        {query.isLoading ? <p className="text-sm text-zinc-600">Dang tai orders...</p> : null}
        {query.isError ? <p className="text-sm text-red-600">Khong tai duoc orders.</p> : null}
        <div className="grid gap-4">
          {query.data?.data.map((order) => (
            <div key={order.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{order.ticketTitle}</p>
                  <p className="text-xs text-zinc-500">{order.id}</p>
                </div>
                <Badge variant="outline">{formatOrderStatus(order.status)}</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
                <p>Total: {formatCurrency(order.totalPrice)}</p>
                <p>Created: {formatDateTime(order.createdAt)}</p>
                <p>Seats: {order.seatLabels.join(", ") || "N/A"}</p>
                <p>Ticket code: {order.ticketCode ?? "Chua issue"}</p>
              </div>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href={`/orders/${order.id}`}>Mo chi tiet order</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
        {pagination ? (
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
            <span>
              Trang {pagination.page}/{Math.max(1, pagination.totalPages)} • Tong {pagination.total}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Truoc
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pagination.totalPages === 0 || pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPage((current) =>
                    pagination.totalPages === 0
                      ? current
                      : Math.min(pagination.totalPages, current + 1),
                  )
                }
              >
                Sau
              </Button>
            </div>
          </div>
        ) : null}
      </Panel>
    </AppShell>
  );
}
