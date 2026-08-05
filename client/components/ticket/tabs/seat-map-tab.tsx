"use client";

import { Armchair, ArmchairIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="grid gap-4">
      {seatMap.items.map((item) => {
        const total = item.seatLabels.length;
        const available = item.availableSeatLabels.length;
        const occupied = item.occupiedSeatLabels.length;
        const ratio = total > 0 ? Math.round((occupied / total) * 100) : 0;

        return (
          <Card key={item.ticketItemId} variant="outlined" padding="md">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Toa {item.coachCode ?? "—"}
                  </p>
                  <CardTitle>
                    {item.seatClass ?? "Chưa rõ hạng"} · {item.seatType ?? "Chưa rõ loại"}
                  </CardTitle>
                  <CardDescription>
                    {available} chỗ trống / {total} chỗ
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="font-heading text-2xl font-semibold tracking-tight text-ink">
                    {ratio}%
                  </p>
                  <p className="text-xs text-ink-muted">Đã đặt</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-brand"
                  style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }}
                  aria-hidden
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex flex-wrap gap-1.5">
                  {item.seatLabels.map((label) => {
                    const isAvailable = item.availableSeatLabels.includes(label);
                    return (
                      <span
                        key={label}
                        title={isAvailable ? `Ghế ${label} - còn trống` : `Ghế ${label} - đã đặt`}
                        className={cn(
                          "inline-flex h-8 min-w-10 items-center justify-center rounded-md border px-2 text-[11px] font-medium",
                          isAvailable
                            ? "border-border bg-card text-ink"
                            : "border-brand/30 bg-brand-soft text-brand",
                        )}
                      >
                        {isAvailable ? (
                          <Armchair className="size-3" aria-hidden />
                        ) : (
                          <ArmchairIcon className="size-3" aria-hidden />
                        )}
                        <span className="ml-1">{label}</span>
                      </span>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-1 text-xs text-ink-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-sm border border-border bg-card" aria-hidden />
                    Còn trống
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-brand" aria-hidden />
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
