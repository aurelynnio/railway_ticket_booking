"use client";

import { Armchair } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/railway-ui";
import { cn } from "@/lib/utils";

import type { SeatMapResponse } from "@/lib/api-types/ticket";

type Props = {
  seatMap?: SeatMapResponse;
};

export function SeatMapTab({ seatMap }: Props) {
  if (!seatMap || seatMap.items.length === 0) {
    return (
      <EmptyState
        title="Chưa có sơ đồ ghế"
        description="Hạng vé này chưa được cấu hình sơ đồ ghế. Liên hệ quản trị viên để cập nhật."
      />
    );
  }

  return (
    <div className="grid gap-5">
      {seatMap.items.map((item) => {
        const total = item.seatLabels.length;
        const available = item.availableSeatLabels.length;
        const occupied = item.occupiedSeatLabels.length;
        const ratio = total > 0 ? Math.round((occupied / total) * 100) : 0;

        return (
          <Card key={item.ticketItemId} variant="outlined" padding="lg">
            <CardHeader className="px-0 pt-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                    Toa <span className="font-mono tabular-nums">{item.coachCode ?? "—"}</span>
                  </p>
                  <CardTitle>
                    {item.seatClass ?? "Chưa rõ hạng"} · {item.seatType ?? "Chưa rõ loại"}
                  </CardTitle>
                  <p className="text-sm text-ink-muted">
                    <span className="font-mono font-semibold tabular-nums text-success">{available}</span>
                    <span className="text-ink-muted"> chỗ trống / </span>
                    <span className="font-mono tabular-nums text-ink">{total}</span>
                    <span className="text-ink-muted"> tổng số ghế</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold tracking-tight text-ink tabular-nums">
                    {ratio}%
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                    Đã đặt
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0 space-y-5">
              <div className="h-1.5 w-full overflow-hidden bg-secondary">
                <div
                  className="h-full bg-primary transition-[width] duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }}
                  aria-hidden
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="flex flex-wrap gap-1.5">
                  {item.seatLabels.map((label) => {
                    const isAvailable = item.availableSeatLabels.includes(label);
                    return (
                      <span
                        key={label}
                        title={isAvailable ? `Ghế ${label} - còn trống` : `Ghế ${label} - đã đặt`}
                        className={cn(
                          "inline-flex h-8 min-w-10 items-center justify-center gap-1 border px-2 font-mono text-[11px] font-semibold tabular-nums transition-colors",
                          isAvailable
                            ? "border-border bg-card text-ink hover:border-primary hover:bg-primary-soft"
                            : "border-primary/30 bg-primary-soft text-primary",
                        )}
                      >
                        <Armchair className="size-3" aria-hidden />
                        {label}
                      </span>
                    );
                  })}
                </div>

                <div className="flex sm:flex-col gap-3 text-xs text-ink-muted">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-4 w-6 border border-border bg-card" aria-hidden />
                    Còn trống
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-4 w-6 border border-primary/30 bg-primary-soft" aria-hidden />
                    Đã đặt
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
