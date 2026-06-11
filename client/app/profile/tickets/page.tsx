"use client";

import { AppShell, Panel } from "@/components/app-shell";
import { EmptyState, SectionHeading, SeatCloud, StatusBadge } from "@/components/railway-ui";
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
      title="Issued tickets"
      description="Repo hien chua co endpoint ticket-by-user rieng, nen view nay duoc suy ra tu orders co `TicketIssued` de tao mot wallet manh lac."
    >
      <Panel
        title="Ticket wallet"
        description="Moi item dai dien cho mot order da issue, gom ma ve, route, ghe va QR payload de support di chuyen hay doi soat."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Travel wallet"
            title="Ve da phat hanh"
            description="The hien bo cueu thong tin toi thieu de user scan nhanh tren mobile: route, seat, ticket code va qr payload."
          />

          {!sessionUserId && !sessionQuery.isLoading ? (
            <EmptyState
              title="Can dang nhap"
              description="Khong co session hop le nen khong the doc ticket wallet cua user hien tai."
              href="/login"
              cta="Mo dang nhap"
            />
          ) : null}

          {tickets.length === 0 && sessionUserId ? (
            <EmptyState
              title="Chua co ve nao da issue"
              description="Khi order duoc issue ticket, no se xuat hien ngay trong wallet nay."
            />
          ) : null}

          <div className="grid gap-4">
            {tickets.map((order) => (
              <article
                key={order.id}
                className="surface-panel grid gap-5 rounded-[1.95rem] px-5 py-5 lg:grid-cols-[1.05fr_0.95fr]"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">
                        {order.ticketTitle}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.ticketCode ?? "No ticket code"}
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
                  <SeatCloud labels={order.seatLabels} />
                </div>

                <div className="rounded-[1.7rem] bg-white/62 px-4 py-4 ring-1 ring-black/6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Ticket payload
                  </p>
                  <p className="mt-3 font-heading text-2xl font-semibold tracking-[-0.03em]">
                    {formatCurrency(order.totalPrice)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Issue time gan nhat: {formatDateTime(order.updatedAt)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground break-all">
                    QR: {order.qrPayload ?? "Dang cap nhat"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Panel>
    </AppShell>
  );
}
