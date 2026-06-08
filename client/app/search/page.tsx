"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSearchTrips } from "@/hooks/search.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export default function SearchPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const query = useSearchTrips({
    from: from || undefined,
    to: to || undefined,
    date: date || undefined,
    page,
    limit: 10,
  });

  const pagination = query.data?.pagination;

  return (
    <AppShell
      title="Search Trips"
      description="Route nay map truc tiep den GET /search/trips va hien thi data phan trang tu search-service."
      actions={
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Ga di, vd: HN"
            value={from}
            onChange={(event) => {
              setPage(1);
              setFrom(event.target.value);
            }}
          />
          <Input
            placeholder="Ga den, vd: SG"
            value={to}
            onChange={(event) => {
              setPage(1);
              setTo(event.target.value);
            }}
          />
          <Input
            type="date"
            value={date}
            onChange={(event) => {
              setPage(1);
              setDate(event.target.value);
            }}
          />
          <Button type="button" variant="outline" onClick={() => setPage(1)}>
            Refresh
          </Button>
        </div>
      }
    >
      <Panel
        title="Ket qua"
        description="Neu anh chua nhap bo loc, route van lay danh sach theo trang tu backend."
      >
        {query.isLoading ? <p className="text-sm text-zinc-600">Dang tai du lieu...</p> : null}
        {query.isError ? (
          <p className="text-sm text-red-600">
            Khong tai duoc danh sach chuyen. Kiem tra api-gateway va search-service.
          </p>
        ) : null}
        <div className="grid gap-4">
          {query.data?.data.map((trip) => (
            <Card key={trip.ticketId} className="border border-zinc-200">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{trip.title ?? "Untitled Trip"}</CardTitle>
                    <CardDescription>
                      {trip.trainNumber ?? "No train number"} • {trip.from.name ?? trip.from.code ?? "?"} to{" "}
                      {trip.to.name ?? trip.to.code ?? "?"}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{trip.availableSeats} cho trong</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="grid gap-2 text-sm text-zinc-700">
                  <p>Khoi hanh: {formatDateTime(trip.dateStart)}</p>
                  <p>Den noi: {formatDateTime(trip.dateEnd)}</p>
                  <p>Gia tu: {formatCurrency(trip.minPrice)}</p>
                  <p>
                    Hang ghe:{" "}
                    {[...trip.seatClasses, ...trip.seatTypes].filter(Boolean).join(", ") || "N/A"}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/tickets/${trip.ticketId}`}>Xem ticket</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {query.data && query.data.data.length === 0 ? (
          <p className="text-sm text-zinc-600">Khong co ket qua nao khop bo loc hien tai.</p>
        ) : null}
        {pagination ? (
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
            <span>
              Trang {pagination.page}/{Math.max(pagination.totalPages, 1)} • Tong {pagination.total}
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
