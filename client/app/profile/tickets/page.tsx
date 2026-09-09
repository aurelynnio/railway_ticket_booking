"use client";

import Link from "next/link";
import { Ticket, ArrowRight, TrainFront, CalendarDays } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTickets } from "@/hooks/ticket.hook";
import { formatDateTime } from "@/lib/formatters";

export default function ProfileTicketsPage() {
  const query = useTickets({ page: 1, limit: 20 });
  const tickets = query.data?.data ?? [];

  return (
    <AppLayout>
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            <span className="h-px w-10 bg-accent" />
            Tài khoản
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Vé của tôi
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {tickets.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-16">
            <Ticket className="mx-auto size-12 text-ink-subtle" />
            <p className="mt-4 font-display text-xl font-semibold text-ink">
              Chưa có vé
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Vé điện tử sẽ xuất hiện ở đây sau khi thanh toán.
            </p>
            <Button asChild variant="accent" className="mt-5">
              <Link href="/search">
                Tìm chuyến
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {tickets.map((t) => (
              <Card key={t.id} variant="outlined" padding="lg" className="relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="default" className="font-mono">
                      <TrainFront className="size-3" />
                      {t.trainNumber ?? "—"}
                    </Badge>
                    <h3 className="mt-3 font-display text-xl font-semibold text-ink">
                      {t.departureStationName ?? t.departureStationCode} → {t.arrivalStationName ?? t.arrivalStationCode}
                    </h3>
                  </div>
                  <Badge variant={(t.ticketItems?.reduce((s, i) => s + (i.stockAvailable ?? 0), 0) ?? 0) > 0 ? "success" : "secondary"}>
                    {t.ticketItems?.reduce((s, i) => s + (i.stockAvailable ?? 0), 0) ?? 0} chỗ
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-ink-muted">
                    <CalendarDays className="size-4 text-primary" />
                    {formatDateTime(t.dateStart)}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="font-mono text-xs text-ink-subtle">
                    #{t.id?.slice(0, 10).toUpperCase()}
                  </span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/tickets/${t.id}`}>
                      Xem chi tiết
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
