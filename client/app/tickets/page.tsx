"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTickets } from "@/hooks/ticket.hook";
import { formatDateTime, formatTicketStatus } from "@/lib/formatters";

export default function TicketsPage() {
  const [departureStationCode, setDepartureStationCode] = useState("");
  const [arrivalStationCode, setArrivalStationCode] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [page, setPage] = useState(1);

  const query = useTickets({
    departureStationCode: departureStationCode || undefined,
    arrivalStationCode: arrivalStationCode || undefined,
    dateStart: dateStart || undefined,
    page,
    limit: 10,
  });

  const pagination = query.data?.pagination;

  return (
    <AppShell
      title="Tickets Inventory"
      description="Trang nay doc truc tiep GET /tickets de xem danh sach resource ticket ma backend dang quan ly."
      actions={
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Departure code"
            value={departureStationCode}
            onChange={(event) => {
              setPage(1);
              setDepartureStationCode(event.target.value);
            }}
          />
          <Input
            placeholder="Arrival code"
            value={arrivalStationCode}
            onChange={(event) => {
              setPage(1);
              setArrivalStationCode(event.target.value);
            }}
          />
          <Input
            type="date"
            value={dateStart}
            onChange={(event) => {
              setPage(1);
              setDateStart(event.target.value);
            }}
          />
          <Button type="button" variant="outline" onClick={() => setPage(1)}>
            Refresh
          </Button>
        </div>
      }
    >
      <Panel
        title="Danh sach ticket"
        description="Ticket detail, availability va seat map deu duoc noi tiep tu day."
      >
        {query.isLoading ? <p className="text-sm text-zinc-600">Dang tai tickets...</p> : null}
        {query.isError ? (
          <p className="text-sm text-red-600">Khong tai duoc tickets. Kiem tra gateway va tickets-service.</p>
        ) : null}
        <div className="grid gap-4">
          {query.data?.data.map((ticket) => (
            <Card key={ticket.id} className="border border-zinc-200">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{ticket.title ?? "Untitled ticket"}</CardTitle>
                    <CardDescription>
                      {ticket.trainNumber ?? "No train number"} • {ticket.departureStationName ?? ticket.departureStationCode ?? "?"} to{" "}
                      {ticket.arrivalStationName ?? ticket.arrivalStationCode ?? "?"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{formatTicketStatus(ticket.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="grid gap-2 text-sm text-zinc-700">
                  <p>Khoi hanh: {formatDateTime(ticket.dateStart)}</p>
                  <p>Den noi: {formatDateTime(ticket.dateEnd)}</p>
                  <p>So toa/loai ghe: {ticket.ticketItems.length}</p>
                </div>
                <Button asChild>
                  <Link href={`/tickets/${ticket.id}`}>Chi tiet</Link>
                </Button>
              </CardContent>
            </Card>
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
