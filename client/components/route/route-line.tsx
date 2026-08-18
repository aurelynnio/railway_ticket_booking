"use client";

import { TrainFront } from "lucide-react";

import { IsoCuboid } from "@/components/iso/iso-cuboid";
import { cn } from "@/lib/utils";

type RouteLineStation = {
  code?: string | null;
  label?: string | null;
};

type RouteLineProps = {
  stations?: RouteLineStation[];
  activeFrom?: string | null;
  activeTo?: string | null;
  animated?: boolean;
  compact?: boolean;
  className?: string;
  showLabels?: boolean;
};

const DEFAULT_STATIONS: RouteLineStation[] = [
  { code: "HAN", label: "Hà Nội" },
  { code: "VIH", label: "Vinh" },
  { code: "HUE", label: "Huế" },
  { code: "DAD", label: "Đà Nẵng" },
  { code: "NTR", label: "Nha Trang" },
  { code: "SGN", label: "Sài Gòn" },
];

function indexOfCode(stations: RouteLineStation[], code?: string | null) {
  if (!code) return -1;
  return stations.findIndex((s) => s.code === code);
}

export function RouteLine({
  stations = DEFAULT_STATIONS,
  activeFrom,
  activeTo,
  animated = false,
  compact = false,
  showLabels = false,
  className,
}: RouteLineProps) {
  const safeStations = stations.length > 0 ? stations : DEFAULT_STATIONS;
  const fromIndex = indexOfCode(safeStations, activeFrom);
  const toIndex = indexOfCode(safeStations, activeTo);
  const hasRoute = fromIndex !== -1 && toIndex !== -1;
  const routeStart = hasRoute ? Math.min(fromIndex, toIndex) : -1;
  const routeEnd = hasRoute ? Math.max(fromIndex, toIndex) : -1;

  return (
    <div
      className={cn(
        "relative w-full",
        compact ? "py-2" : "py-3",
        className,
      )}
      role="img"
      aria-label="Tuyến đường Bắc – Trung – Nam"
    >
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" aria-hidden />
      {hasRoute ? (
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-[width] duration-500"
          style={{
            left: `${(routeStart / (safeStations.length - 1)) * 100}%`,
            width: `${((routeEnd - routeStart) / (safeStations.length - 1)) * 100}%`,
          }}
          aria-hidden
        />
      ) : null}

      <div className="relative flex items-center justify-between">
        {safeStations.map((station, index) => {
          const isEndpoint =
            hasRoute && (index === routeStart || index === routeEnd);
          const isActive = hasRoute && index >= routeStart && index <= routeEnd;
          return (
            <div
              key={station.code ?? station.label ?? index}
              className="relative flex flex-col items-center"
            >
              <svg
                width={compact ? 14 : 16}
                height={compact ? 12 : 14}
                viewBox="-6.5 -6.5 15 13.5"
                aria-hidden
              >
                <IsoCuboid
                  x={0}
                  y={0}
                  w={6}
                  d={5}
                  h={isEndpoint ? 3.6 : isActive ? 3 : 2.4}
                  tone={isEndpoint ? "brand" : isActive ? "brand-soft" : "surface"}
                  strokeWidth={0.7}
                />
              </svg>
              {showLabels ? (
                <span
                  className={cn(
                    "absolute top-4 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider",
                    isEndpoint ? "text-primary" : "text-ink-muted",
                  )}
                >
                  {station.label ?? station.code ?? ""}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {animated ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2" aria-hidden>
          <div className="route-train">
            <TrainFront className="size-4 text-primary" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
