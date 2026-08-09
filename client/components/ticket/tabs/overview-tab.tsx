"use client";

import { TrainFront } from "lucide-react";

import { RouteLine } from "@/components/route-line";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetaGrid } from "@/components/railway-ui";
import { TicketCard } from "@/components/ticket-card";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatDateTime,
  formatTicketStatus,
  getTicketStatusTone,
} from "@/lib/formatters";

import type { TicketResponse } from "@/lib/api-types/ticket";

type Ticket = TicketResponse;

type Props = {
  ticket: Ticket;
  selectedTicketItemId: string;
  onSelectItem: (id: string) => void;
};

export function TicketOverviewTab({ ticket, selectedTicketItemId, onSelectItem }: Props) {
  return (
    <div className="grid gap-5">
      <TicketCard
        title={ticket.title ?? "Hành trình"}
        trainNumber={ticket.trainNumber}
        departureStationName={ticket.departureStationName}
        departureStationCode={ticket.departureStationCode}
        arrivalStationName={ticket.arrivalStationName}
        arrivalStationCode={ticket.arrivalStationCode}
        dateStart={ticket.dateStart}
        dateEnd={ticket.dateEnd}
        statusLabel={formatTicketStatus(ticket.status)}
        statusTone={getTicketStatusTone(ticket.status)}
      />

      <RouteLine className="px-4 py-3" compact aria-hidden />

      <Card variant="outlined" padding="lg">
        <CardHeader className="px-0 pt-0">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
              Tổng quan hành trình
            </p>
            <CardTitle>Thông tin chi tiết</CardTitle>
            {ticket.journeyNote ? (
              <p className="text-sm leading-relaxed text-ink-muted">
                {ticket.journeyNote}
              </p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="space-y-6">
            <MetaGrid
              columns={3}
              items={[
                {
                  label: "Ga đi",
                  value: (
                    <span>
                      <span className="font-mono font-semibold tabular-nums text-ink">
                        {ticket.departureStationCode ?? "—"}
                      </span>
                      <span className="text-ink-muted ml-1.5 text-xs">
                        {ticket.departureStationName ?? ""}
                      </span>
                    </span>
                  ),
                },
                {
                  label: "Ga đến",
                  value: (
                    <span>
                      <span className="font-mono font-semibold tabular-nums text-ink">
                        {ticket.arrivalStationCode ?? "—"}
                      </span>
                      <span className="text-ink-muted ml-1.5 text-xs">
                        {ticket.arrivalStationName ?? ""}
                      </span>
                    </span>
                  ),
                },
                {
                  label: "Khởi hành",
                  value: (
                    <span className="font-mono tabular-nums text-ink">
                      {formatDateTime(ticket.dateStart)}
                    </span>
                  ),
                },
                {
                  label: "Đến nơi",
                  value: (
                    <span className="font-mono tabular-nums text-ink">
                      {formatDateTime(ticket.dateEnd)}
                    </span>
                  ),
                },
                { label: "Trạng thái", value: formatTicketStatus(ticket.status) },
                {
                  label: "Số hạng vé",
                  value: (
                    <span className="font-mono font-semibold tabular-nums text-ink">
                      {ticket.ticketItems.length}
                    </span>
                  ),
                },
              ]}
            />

            <div className="soft-divider" />

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="inline-flex items-center gap-2 font-display text-base font-semibold tracking-tight text-ink">
                  <TrainFront className="size-4 text-primary" aria-hidden />
                  Chọn hạng vé
                </h3>
                <span className="text-xs text-ink-muted">
                  Chọn hạng để xem giá & số chỗ còn trống
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {ticket.ticketItems.map((item) => {
                  const isSelected = item.id === selectedTicketItemId;
                  const hasDiscount =
                    item.priceFlash != null &&
                    item.priceOriginal != null &&
                    item.priceFlash < item.priceOriginal;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectItem(item.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        "group w-full border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                        isSelected
                          ? "border-primary bg-primary-soft"
                          : "border-border bg-card hover:border-border-strong hover:bg-secondary/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <p className="font-display text-sm font-semibold tracking-tight text-ink">
                            {item.name ?? item.coachCode ?? "Hạng vé"}
                          </p>
                          <p className="text-xs text-ink-muted truncate">
                            {item.seatClass ?? "Chưa rõ hạng"} · {item.seatType ?? "Chưa rõ loại"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-base font-semibold tabular-nums text-ink">
                            {formatCurrency(item.priceFlash ?? item.priceOriginal)}
                          </p>
                          {hasDiscount ? (
                            <p className="text-[11px] text-ink-muted line-through font-mono tabular-nums">
                              {formatCurrency(item.priceOriginal)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center border border-border bg-card px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-ink">
                          Toa {item.coachCode ?? "—"}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          Còn <span className="font-mono font-semibold tabular-nums text-ink">{item.availableSeatLabels.length}</span> chỗ
                        </span>
                        {isSelected ? (
                          <Badge variant="default" className="ml-auto">Đang chọn</Badge>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
