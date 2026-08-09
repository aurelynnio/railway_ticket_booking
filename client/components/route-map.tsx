"use client";

import { TrainFront } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATIONS = [
  { code: "HAN", name: "Hà Nội", x: 50, y: 15 },
  { code: "VIH", name: "Vinh", x: 50, y: 30 },
  { code: "HUE", name: "Huế", x: 50, y: 48 },
  { code: "DAD", name: "Đà Nẵng", x: 50, y: 58 },
  { code: "NTR", name: "Nha Trang", x: 50, y: 75 },
  { code: "SGN", name: "Sài Gòn", x: 50, y: 90 },
];

interface RouteMapProps {
  from?: string;
  to?: string;
  className?: string;
  compact?: boolean;
}

export function RouteMap({ from, to, className, compact = false }: RouteMapProps) {
  const fromIndex = STATIONS.findIndex((s) => s.code === from);
  const toIndex = STATIONS.findIndex((s) => s.code === to);
  const hasRoute = fromIndex !== -1 && toIndex !== -1;
  const routeStart = hasRoute ? Math.min(fromIndex, toIndex) : -1;
  const routeEnd = hasRoute ? Math.max(fromIndex, toIndex) : -1;

  return (
    <Card
      variant="flat"
      className={cn(
        "relative overflow-hidden border border-border/70 bg-secondary/40",
        compact ? "px-4 py-4" : "px-5 py-6",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
        Bản đồ tuyến đường
      </p>

      <div className="mt-4 flex items-stretch gap-4">
        <div className="relative flex flex-col items-center" style={{ minHeight: compact ? 180 : 260 }}>
          <div className="absolute inset-x-[50%] top-3 bottom-3 w-0.5 -translate-x-1/2 bg-border" />
          {hasRoute ? (
            <div
              className="absolute inset-x-[50%] w-0.5 -translate-x-1/2 bg-primary transition-[height] duration-500"
              style={{
                top: `calc(${STATIONS[routeStart]?.y ?? 0}% + 0.25rem)`,
                height: `calc(${(STATIONS[routeEnd]?.y ?? 0) - (STATIONS[routeStart]?.y ?? 0)}% - 0.25rem)`,
              }}
            />
          ) : null}
          {STATIONS.map((station, index) => {
            const isFrom = station.code === from;
            const isTo = station.code === to;
            const isActive =
              hasRoute && index >= routeStart && index <= routeEnd;
            const isEndpoint = isFrom || isTo;

            return (
              <div
                key={station.code}
                className="absolute flex items-center gap-3"
                style={{ top: `calc(${station.y}% - 0.5rem)` }}
              >
                <div
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,border-color,box-shadow,transform] duration-300",
                    isEndpoint
                      ? "border-primary bg-primary"
                      : isActive
                        ? "border-primary/60 bg-primary/20"
                        : "border-border bg-background",
                  )}
                >
                  {isEndpoint ? (
                    <div className="size-1.5 rounded-full bg-primary-foreground" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative flex-1" style={{ minHeight: compact ? 180 : 260 }}>
          {STATIONS.map((station) => {
            const isFrom = station.code === from;
            const isTo = station.code === to;
            const isEndpoint = isFrom || isTo;

            return (
              <div
                key={station.code}
                className="absolute flex items-center gap-2"
                style={{ top: `calc(${station.y}% - 0.75rem)` }}
              >
                <div>
                  <span
                    className={cn(
                      "text-xs font-semibold font-mono tabular-nums",
                      isEndpoint ? "text-primary" : "text-ink-muted",
                    )}
                  >
                    {station.code}
                  </span>
                  {!compact ? (
                    <p
                      className={cn(
                        "text-xs",
                        isEndpoint ? "font-medium text-ink" : "text-ink-muted",
                      )}
                    >
                      {station.name}
                    </p>
                  ) : null}
                </div>
                {isFrom ? (
                  <Badge variant="default" className="text-[10px]">Khởi hành</Badge>
                ) : isTo ? (
                  <Badge variant="success" className="text-[10px]">Đến nơi</Badge>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {hasRoute ? (
        <div className="mt-4 flex items-center gap-2 border border-primary/20 bg-primary-soft px-3 py-2">
          <TrainFront className="size-3.5 text-primary" />
          <p className="text-xs font-medium text-ink">
            {STATIONS[fromIndex]?.name} → {STATIONS[toIndex]?.name}
          </p>
        </div>
      ) : null}
    </Card>
  );
}
