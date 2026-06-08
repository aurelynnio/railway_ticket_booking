"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import { useAuthSession } from "@/hooks/auth.hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateOrder } from "@/hooks/order.hook";
import { useSeatMap, useTicket, useTicketAvailability } from "@/hooks/ticket.hook";
import { formatCurrency, formatDateTime, formatTicketStatus } from "@/lib/formatters";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ticketId = typeof params.id === "string" ? params.id : "";

  const ticketQuery = useTicket(ticketId);
  const availabilityQuery = useTicketAvailability(ticketId);
  const seatMapQuery = useSeatMap(ticketId);
  const createOrder = useCreateOrder();
  const sessionQuery = useAuthSession();
  const sessionUserId = sessionQuery.data?.userId;

  const [selectedTicketItemId, setSelectedTicketItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [seatLabels, setSeatLabels] = useState("");
  const [passengerName, setPassengerName] = useState("");
  const resolvedSelectedTicketItemId =
    selectedTicketItemId || ticketQuery.data?.ticketItems[0]?.id || "";

  const selectedItem = useMemo(
    () =>
      ticketQuery.data?.ticketItems.find(
        (item) => item.id === resolvedSelectedTicketItemId,
      ) ??
      ticketQuery.data?.ticketItems[0] ??
      null,
    [resolvedSelectedTicketItemId, ticketQuery.data?.ticketItems],
  );

  async function handleCreateOrder() {
    if (!ticketQuery.data || !selectedItem) {
      return;
    }

    const numericQuantity = Number(quantity);
    const unitPrice = selectedItem.priceFlash ?? selectedItem.priceOriginal ?? 0;

    const result = await createOrder.mutateAsync({
      userId: sessionUserId ?? "",
      ticketId: ticketQuery.data.id,
      ticketItemId: selectedItem.id,
      ticketTitle: ticketQuery.data.title ?? "Untitled ticket",
      trainNumber: ticketQuery.data.trainNumber,
      departureStationCode: ticketQuery.data.departureStationCode,
      departureStationName: ticketQuery.data.departureStationName,
      arrivalStationCode: ticketQuery.data.arrivalStationCode,
      arrivalStationName: ticketQuery.data.arrivalStationName,
      departureTime: ticketQuery.data.dateStart,
      arrivalTime: ticketQuery.data.dateEnd,
      coachCode: selectedItem.coachCode,
      seatClass: selectedItem.seatClass,
      seatType: selectedItem.seatType,
      quantity: Number.isNaN(numericQuantity) ? 1 : numericQuantity,
      unitPrice,
      seatLabels: seatLabels
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      passengers: passengerName
        ? [
            {
              fullName: passengerName,
              passengerType: "ADULT",
            },
          ]
        : [],
    });

    router.push(`/orders/${result.id}`);
  }

  return (
    <AppShell
      title="Ticket Detail"
      description="Trang nay ghep du lieu tu GET /tickets/:id, /availability va /seat-map, dong thoi cho phep tao order scaffold."
      actions={
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-700">
          <Link className="font-medium text-amber-700 hover:underline" href="/tickets">
            Quay lai danh sach
          </Link>
          {ticketQuery.data ? (
            <Badge variant="outline">{formatTicketStatus(ticketQuery.data.status)}</Badge>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Panel
          title={ticketQuery.data?.title ?? "Loading ticket"}
          description={ticketQuery.data?.trainNumber ?? "Dang tai thong tin hanh trinh"}
        >
          {ticketQuery.isLoading ? <p className="text-sm text-zinc-600">Dang tai chi tiet ticket...</p> : null}
          {ticketQuery.data ? (
            <div className="grid gap-3 text-sm text-zinc-700">
              <p>
                Hanh trinh: {ticketQuery.data.departureStationName ?? ticketQuery.data.departureStationCode ?? "?"} to{" "}
                {ticketQuery.data.arrivalStationName ?? ticketQuery.data.arrivalStationCode ?? "?"}
              </p>
              <p>Khoi hanh: {formatDateTime(ticketQuery.data.dateStart)}</p>
              <p>Den noi: {formatDateTime(ticketQuery.data.dateEnd)}</p>
              <p>Ghi chu: {ticketQuery.data.journeyNote ?? "N/A"}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {ticketQuery.data.ticketItems.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 ${
                      item.id === resolvedSelectedTicketItemId
                        ? "border-amber-400 bg-amber-50"
                        : "border-zinc-200 bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.name ?? item.coachCode ?? "Ticket item"}</p>
                        <p className="text-xs text-zinc-500">
                          {item.seatClass ?? "Unknown class"} • {item.seatType ?? "Unknown type"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          item.id === resolvedSelectedTicketItemId
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setSelectedTicketItemId(item.id)}
                      >
                        Chon
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-1 text-xs text-zinc-600">
                      <p>Gia flash: {formatCurrency(item.priceFlash)}</p>
                      <p>Gia goc: {formatCurrency(item.priceOriginal)}</p>
                      <p>Cho trong: {item.availableSeatLabels.length}</p>
                      <p>So ghe: {item.seatLabels.join(", ") || "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>

        <div className="grid gap-4">
          <Panel
            title="Availability"
            description="Snapshot tu GET /tickets/:ticketId/availability"
          >
            {availabilityQuery.isLoading ? <p className="text-sm text-zinc-600">Dang tai availability...</p> : null}
            {availabilityQuery.data ? (
              <div className="grid gap-2 text-sm text-zinc-700">
                <p>Sale open: {availabilityQuery.data.saleOpen ? "Yes" : "No"}</p>
                {availabilityQuery.data.items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-zinc-200 p-3">
                    <p className="font-medium">{item.name ?? item.coachCode ?? item.id}</p>
                    <p className="text-xs text-zinc-500">
                      Available {item.availableSeatLabels.length} / {item.seatLabels.length}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>

          <Panel
            title="Create Order"
            description="Order service hien la scaffold in-memory. User tao order se duoc lay tu session cookie hien tai."
          >
            <div className="grid gap-3">
              {sessionQuery.isLoading ? (
                <p className="text-sm text-zinc-600">Dang tai session...</p>
              ) : null}
              {sessionUserId ? (
                <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                  Dang tao order cho user `{sessionQuery.data?.email ?? sessionUserId}`
                </p>
              ) : (
                <p className="text-sm text-zinc-600">
                  Can dang nhap de tao order tu ticket nay.
                </p>
              )}
              <Input
                placeholder="Passenger full name"
                value={passengerName}
                onChange={(event) => setPassengerName(event.target.value)}
              />
              <Input
                placeholder="Seat labels, vd A1,A2"
                value={seatLabels}
                onChange={(event) => setSeatLabels(event.target.value)}
              />
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
              <Button
                type="button"
                disabled={!sessionUserId || !selectedItem || createOrder.isPending}
                onClick={() => void handleCreateOrder()}
              >
                {createOrder.isPending ? "Dang tao order..." : "Tao order"}
              </Button>
              {createOrder.isError ? (
                <p className="text-sm text-red-600">
                  Tao order that bai. Kiem tra session dang nhap, ticket item va orders-service.
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel title="Seat Map" description="Snapshot tu GET /tickets/:ticketId/seat-map">
            {seatMapQuery.isLoading ? <p className="text-sm text-zinc-600">Dang tai seat map...</p> : null}
            {seatMapQuery.data ? (
              <div className="grid gap-3 text-sm text-zinc-700">
                {seatMapQuery.data.items.map((item) => (
                  <div key={item.ticketItemId} className="rounded-xl border border-zinc-200 p-3">
                    <p className="font-medium">
                      {item.coachCode ?? "Coach"} • {item.seatClass ?? "Unknown"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Free: {item.availableSeatLabels.join(", ") || "N/A"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Occupied: {item.occupiedSeatLabels.join(", ") || "None"}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
