"use client";

import { useParams } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useCancelOrder,
  useConfirmOrder,
  useIssueTicket,
  useMarkOrderPaid,
  useOrder,
  useOrderSummary,
} from "@/hooks/order.hook";
import { formatCurrency, formatDateTime, formatOrderStatus } from "@/lib/formatters";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = typeof params.id === "string" ? params.id : "";

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

  return (
    <AppShell
      title="Order Detail"
      description="Trang nay noi vao GET /orders/:id va GET /orders/:id/summary, kem cac action status de test backend scaffold."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!orderId || isMutating}
            onClick={() => markPaid.mutate({ orderId })}
          >
            Mark Paid
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
            Issue Ticket
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!orderId || isMutating}
            onClick={() => cancelOrder.mutate({ orderId, payload: { reason: "Cancelled from UI" } })}
          >
            Cancel
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Order snapshot" description="Response tu GET /orders/:id">
          {orderQuery.isLoading ? <p className="text-sm text-zinc-600">Dang tai order...</p> : null}
          {orderQuery.data ? (
            <div className="grid gap-3 text-sm text-zinc-700">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">{formatOrderStatus(orderQuery.data.status)}</Badge>
                <span className="font-mono text-xs text-zinc-500">{orderQuery.data.id}</span>
              </div>
              <p>User ID: {orderQuery.data.userId}</p>
              <p>Ticket title: {orderQuery.data.ticketTitle}</p>
              <p>Train: {orderQuery.data.trainNumber ?? "N/A"}</p>
              <p>
                Route: {orderQuery.data.departureStationName ?? orderQuery.data.departureStationCode ?? "?"} to{" "}
                {orderQuery.data.arrivalStationName ?? orderQuery.data.arrivalStationCode ?? "?"}
              </p>
              <p>Departure: {formatDateTime(orderQuery.data.departureTime)}</p>
              <p>Arrival: {formatDateTime(orderQuery.data.arrivalTime)}</p>
              <p>Seat labels: {orderQuery.data.seatLabels.join(", ") || "N/A"}</p>
              <p>Ticket code: {orderQuery.data.ticketCode ?? "Chua issue"}</p>
              <p>QR payload: {orderQuery.data.qrPayload ?? "Chua issue"}</p>
              <p>Created at: {formatDateTime(orderQuery.data.createdAt)}</p>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="font-medium">Passengers</p>
                <div className="mt-2 grid gap-2">
                  {orderQuery.data.passengers.length === 0 ? (
                    <p className="text-xs text-zinc-500">Chua co passenger.</p>
                  ) : (
                    orderQuery.data.passengers.map((passenger, index) => (
                      <div key={`${passenger.fullName}-${index}`} className="rounded-xl border border-zinc-200 bg-white p-3">
                        <p>{passenger.fullName}</p>
                        <p className="text-xs text-zinc-500">
                          {passenger.passengerType} • {passenger.phoneNumber ?? "No phone"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
          {orderQuery.isError ? (
            <p className="text-sm text-red-600">Khong tai duoc order. Co the order da bi mat sau khi restart service.</p>
          ) : null}
        </Panel>

        <Panel title="Order summary" description="Response tu GET /orders/:id/summary">
          {summaryQuery.isLoading ? <p className="text-sm text-zinc-600">Dang tai summary...</p> : null}
          {summaryQuery.data ? (
            <div className="grid gap-3 text-sm text-zinc-700">
              <p>Quantity: {summaryQuery.data.quantity}</p>
              <p>Unit price: {formatCurrency(summaryQuery.data.unitPrice)}</p>
              <p>Total price: {formatCurrency(summaryQuery.data.totalPrice)}</p>
              <p>Seat count: {summaryQuery.data.seatCount}</p>
              <p>Passenger count: {summaryQuery.data.passengerCount}</p>
              <p>Issued: {summaryQuery.data.ticketIssued ? "Yes" : "No"}</p>
            </div>
          ) : null}
        </Panel>
      </div>
    </AppShell>
  );
}
