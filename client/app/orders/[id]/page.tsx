"use client";

import { usePathname, useParams } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import {
  MetaGrid,
  SectionHeading,
  SeatCloud,
  StatusBadge,
  compactId,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import {
  useCancelOrder,
  useConfirmOrder,
  useIssueTicket,
  useMarkOrderPaid,
  useOrder,
  useOrderSummary,
} from "@/hooks/order.hook";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusTone,
} from "@/lib/formatters";

export default function OrderDetailPage() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const orderId = typeof params.id === "string" ? params.id : "";
  const isAdminView = pathname.startsWith("/admin");
  const isProfileView = pathname.startsWith("/profile");

  const orderQuery = useOrder(orderId);
  const summaryQuery = useOrderSummary(orderId);
  const markPaid = useMarkOrderPaid();
  const confirm = useConfirmOrder();
  const issueTicket = useIssueTicket();
  const cancelOrder = useCancelOrder();

  const isMutating =
    markPaid.isPending ||
    confirm.isPending ||
    issueTicket.isPending ||
    cancelOrder.isPending;

  const order = orderQuery.data;
  const summary = summaryQuery.data;

  return (
    <AppShell
      title={
        isProfileView
          ? "My order detail"
          : isAdminView
            ? "Order operations"
            : "Order detail"
      }
      description="Chi tiet order gom snapshot booking, seat labels, passenger payload, tong tien va cac status transition cua `orders-service`."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!orderId || isMutating}
            onClick={() => markPaid.mutate({ orderId })}
          >
            Mark paid
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!orderId || isMutating}
            onClick={() => confirm.mutate({ orderId })}
          >
            Confirm
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!orderId || isMutating}
            onClick={() => issueTicket.mutate({ orderId })}
          >
            Issue ticket
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!orderId || isMutating}
            onClick={() =>
              cancelOrder.mutate({ orderId, payload: { reason: "Cancelled from UI" } })
            }
          >
            Cancel
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title={order?.ticketTitle ?? "Order snapshot"}
          description="Ban ghi chinh tu `GET /orders/:id` gom route, ticket payload, passenger list va cac ma phat hanh."
        >
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Core record"
              title={order?.trainNumber ?? "Dang tai order"}
              description="Dai dien cho ban ghi order chinh trong MySQL, noi quan he ticket, ghe, hanh khach va ticket code."
              action={
                order ? (
                  <StatusBadge
                    label={formatOrderStatus(order.status)}
                    tone={getOrderStatusTone(order.status)}
                  />
                ) : null
              }
            />

            {order ? (
              <>
                <MetaGrid
                  items={[
                    { label: "Order ID", value: compactId(order.id) },
                    { label: "User ID", value: compactId(order.userId) },
                    {
                      label: "Route",
                      value: `${order.departureStationName ?? order.departureStationCode ?? "?"} den ${order.arrivalStationName ?? order.arrivalStationCode ?? "?"}`,
                    },
                    { label: "Departure", value: formatDateTime(order.departureTime) },
                    { label: "Arrival", value: formatDateTime(order.arrivalTime) },
                    { label: "Created", value: formatDateTime(order.createdAt) },
                  ]}
                />

                <div className="rounded-[1.7rem] bg-white/62 px-5 py-5 ring-1 ring-black/6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Seat allocation
                  </p>
                  <div className="mt-3">
                    <SeatCloud labels={order.seatLabels} />
                  </div>
                </div>

                <div className="rounded-[1.7rem] bg-white/62 px-5 py-5 ring-1 ring-black/6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Passenger manifest
                  </p>
                  <div className="mt-4 grid gap-3">
                    {order.passengers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Chua co passenger nao trong order nay.
                      </p>
                    ) : (
                      order.passengers.map((passenger, index) => (
                        <div
                          key={`${passenger.fullName}-${index}`}
                          className="rounded-[1.4rem] bg-white/72 px-4 py-4 ring-1 ring-black/6"
                        >
                          <p className="font-medium text-foreground">
                            {passenger.fullName}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {passenger.passengerType} •{" "}
                            {passenger.phoneNumber ?? "No phone"} •{" "}
                            {passenger.identityNumber ?? "No identity"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {orderQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Dang tai order...</p>
            ) : null}
            {orderQuery.isError ? (
              <p className="text-sm text-rose-700">
                Khong tai duoc order. Co the service chua san sang hoac order khong ton tai.
              </p>
            ) : null}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel
            title="Financial summary"
            description="Tong hop quantity, gia ve va ticket issue state tu `GET /orders/:id/summary`."
          >
            {summary ? (
              <MetaGrid
                items={[
                  { label: "Quantity", value: String(summary.quantity) },
                  { label: "Seat count", value: String(summary.seatCount) },
                  { label: "Passenger count", value: String(summary.passengerCount) },
                  { label: "Unit price", value: formatCurrency(summary.unitPrice) },
                  { label: "Total", value: formatCurrency(summary.totalPrice) },
                  { label: "Issued", value: summary.ticketIssued ? "Yes" : "No" },
                ]}
              />
            ) : null}
            {summaryQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Dang tai summary...</p>
            ) : null}
          </Panel>

          {order ? (
            <Panel
              title="Issuance payload"
              description="Cac field nay duoc dung cho downstream ticket delivery va support sau ban."
            >
              <MetaGrid
                items={[
                  { label: "Coach", value: order.coachCode ?? "N/A" },
                  { label: "Seat class", value: order.seatClass ?? "N/A" },
                  { label: "Seat type", value: order.seatType ?? "N/A" },
                  { label: "Ticket code", value: order.ticketCode ?? "Chua issue" },
                  { label: "QR payload", value: order.qrPayload ?? "Chua issue" },
                  { label: "Cancel reason", value: order.cancelReason ?? "N/A" },
                ]}
                columns={3}
              />
            </Panel>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
