"use client";

import { TrainFront } from "lucide-react";

import {
  MetaGrid,
  StatusBadge,
} from "@/components/railway-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatCurrency,
  formatDateTime,
  formatTicketStatus,
  getTicketStatusTone,
} from "@/lib/formatters";

import { TicketCard } from "@/components/ticket-card";

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

      <Card variant="outlined" padding="md">
        <CardHeader>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Tổng quan
            </p>
            <CardTitle>Hành trình & lịch chạy</CardTitle>
            <CardDescription>
              {ticket.journeyNote ?? "Chưa có ghi chú hành trình."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <MetaGrid
            columns={3}
            items={[
              { label: "Ga đi", value: ticket.departureStationName ?? ticket.departureStationCode ?? "—" },
              { label: "Ga đến", value: ticket.arrivalStationName ?? ticket.arrivalStationCode ?? "—" },
              { label: "Khởi hành", value: formatDateTime(ticket.dateStart) },
              { label: "Đến nơi", value: formatDateTime(ticket.dateEnd) },
              { label: "Trạng thái", value: formatTicketStatus(ticket.status) },
              { label: "Số hạng vé", value: String(ticket.ticketItems.length) },
            ]}
          />

          <div className="space-y-3 border-t border-border/70 pt-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="inline-flex items-center gap-1.5 font-heading text-sm font-semibold tracking-tight text-ink">
                <TrainFront className="size-3.5 text-brand" aria-hidden />
                Hạng vé đang mở
              </h3>
              <span className="text-xs text-ink-muted">
                Chọn hạng để xem giá & số chỗ còn
              </span>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {ticket.ticketItems.map((item) => {
                const isSelected = item.id === selectedTicketItemId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectItem(item.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "block w-full rounded-lg border px-4 py-4 text-left transition-colors",
                      isSelected
                        ? "border-brand/50 bg-brand-soft"
                        : "border-border bg-background hover:border-ink-muted hover:bg-muted/30",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-heading text-sm font-semibold tracking-tight text-ink">
                          {item.name ?? item.coachCode ?? "Hạng vé"}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {item.seatClass ?? "Chưa rõ hạng"} · {item.seatType ?? "Chưa rõ loại"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-heading text-base font-semibold text-ink">
                          {formatCurrency(item.priceFlash ?? item.priceOriginal)}
                        </p>
                        {item.priceFlash &&
                        item.priceOriginal &&
                        item.priceFlash < item.priceOriginal ? (
                          <p className="text-[11px] text-ink-muted line-through">
                            {formatCurrency(item.priceOriginal)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                      <span className="rounded-md border border-border/70 bg-card px-1.5 py-0.5">
                        Toa {item.coachCode ?? "—"}
                      </span>
                      <span>Còn {item.availableSeatLabels.length} chỗ</span>
                      {isSelected ? (
                        <StatusBadge label="Đang chọn" tone="brand" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
