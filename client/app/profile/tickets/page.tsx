"use client";

import Link from "next/link";

import { AppShell, Panel } from "@/components/app-shell";
import { useAuthSession } from "@/hooks/auth.hook";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/hooks/order.hook";
import { OrderStatus } from "@/lib/api-types";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
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

  return (
    <AppShell
      title="Issued Tickets"
      description="Backend chua co endpoint tickets theo user, nen trang nay suy ra ticket da issue tu orders cua user dang dang nhap."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-500">
            {sessionQuery.data?.email ?? "Dang tai session..."}
          </span>
          <Link
            className="text-sm font-medium text-amber-700 hover:underline"
            href="/profile/orders"
          >
            Mo danh sach orders
          </Link>
        </div>
      }
    >
      <Panel
        title="Tickets da issue"
        description="Danh sach nay dua tren order.ticketCode va order.qrPayload."
      >
        {sessionQuery.isLoading ? (
          <p className="text-sm text-zinc-600">Dang tai session...</p>
        ) : null}
        {sessionQuery.isError ? (
          <p className="text-sm text-red-600">
            Khong doc duoc session hien tai. Dang chuyen ve login.
          </p>
        ) : null}
        {!sessionUserId && !sessionQuery.isLoading ? (
          <p className="text-sm text-zinc-600">
            Can dang nhap de xem issued tickets.
          </p>
        ) : null}
        {query.isLoading ? (
          <p className="text-sm text-zinc-600">Dang tai issued tickets...</p>
        ) : null}
        {query.isError ? (
          <p className="text-sm text-red-600">Khong tai duoc issued tickets.</p>
        ) : null}
        <div className="grid gap-4">
          {query.data?.data.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{order.ticketTitle}</p>
                  <p className="text-xs text-zinc-500">
                    {order.ticketCode ?? "No ticket code"}
                  </p>
                </div>
                <Badge variant="outline">
                  {formatOrderStatus(order.status)}
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
                <p>Total: {formatCurrency(order.totalPrice)}</p>
                <p>Issued at: {formatDateTime(order.updatedAt)}</p>
                <p>Seats: {order.seatLabels.join(", ") || "N/A"}</p>
                <p>QR payload: {order.qrPayload ?? "N/A"}</p>
                <p>Hello world</p>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Route:{" "}
                {order.departureStationName ??
                  order.departureStationCode ??
                  "?"}{" "}
                to {order.arrivalStationName ?? order.arrivalStationCode ?? "?"}
              </p>
            </div>
          ))}
        </div>
        {query.data && query.data.data.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Chua co ticket nao da issue cho user hien tai.
          </p>
        ) : null}
      </Panel>
    </AppShell>
  );
}
