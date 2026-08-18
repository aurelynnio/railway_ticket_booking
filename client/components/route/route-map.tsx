"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { IsoCuboid } from "@/components/iso/iso-cuboid";
import { iso } from "@/lib/iso/math";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { registerMotionPlugins } from "@/lib/motion/gsap-config";

registerMotionPlugins();

const STATIONS = [
  { code: "HAN", name: "Hà Nội", a: -60 },
  { code: "VIH", name: "Vinh", a: -36 },
  { code: "HUE", name: "Huế", a: -12 },
  { code: "DAD", name: "Đà Nẵng", a: 12 },
  { code: "NTR", name: "Nha Trang", a: 36 },
  { code: "SGN", name: "Sài Gòn", a: 60 },
] as const;

// Isometric track geometry
const B_CENTER = 0;
const B_OFF = 6; // track slab half-width (axis B)
const STATION_W = 9;
const STATION_D = 8;
const STATION_H = 7;

interface RouteMapProps {
  from?: string;
  to?: string;
  className?: string;
  compact?: boolean;
}

export function RouteMap({ from, to, className, compact = false }: RouteMapProps) {
  const reduced = useReducedMotion();
  const scopeRef = useRef<HTMLDivElement | null>(null);

  const fromIndex = STATIONS.findIndex((s) => s.code === from);
  const toIndex = STATIONS.findIndex((s) => s.code === to);
  const hasRoute = fromIndex !== -1 && toIndex !== -1;
  const routeStart = hasRoute ? Math.min(fromIndex, toIndex) : -1;
  const routeEnd = hasRoute ? Math.max(fromIndex, toIndex) : -1;

  // Track centerline screen endpoints
  const aMin = STATIONS[0].a;
  const aMax = STATIONS[STATIONS.length - 1].a;

  const trainFrom = hasRoute ? iso(STATIONS[routeStart].a + 4, B_CENTER, 0) : null;
  const trainTo = hasRoute ? iso(STATIONS[routeEnd].a + 4, B_CENTER, 0) : null;

  useGSAP(
    () => {
      if (
        reduced ||
        !scopeRef.current ||
        !trainFrom ||
        !trainTo
      ) {
        return;
      }
      const train = scopeRef.current.querySelector('[data-route-train]');
      if (!train) return;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          train,
          { x: trainFrom.x, y: trainFrom.y },
          {
            x: trainTo.x,
            y: trainTo.y,
            duration: 4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          },
        );
      }, scopeRef);
      return () => ctx.revert();
    },
    { scope: scopeRef, dependencies: [reduced, hasRoute, trainFrom?.x, trainTo?.x] },
  );

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

      <div ref={scopeRef} className="mt-4">
        <svg
          viewBox="-72 -52 154 104"
          width="100%"
          height="auto"
          role="img"
          aria-label="Bản đồ tuyến đường sắt Bắc – Trung – Nam"
        >
          {/* Isometric ground grid under the track */}
          <g stroke="var(--border)" strokeWidth={0.4} opacity={0.7} aria-hidden>
            {[-6, -3, 0, 3, 6].map((b) => {
              const p1 = iso(aMin - 4, b);
              const p2 = iso(aMax + 4, b);
              return <line key={`gx-${b}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
            })}
            {Array.from({ length: 9 }, (_, i) => aMin + i * 16).map((a) => {
              const p1 = iso(a, -B_OFF);
              const p2 = iso(a, B_OFF);
              return <line key={`gy-${a}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
            })}
          </g>

          {/* Track slab */}
          <IsoCuboid
            x={iso(aMin - 4, B_CENTER + B_OFF).x}
            y={iso(aMin - 4, B_CENTER + B_OFF).y}
            w={aMax - aMin + 8}
            d={B_OFF * 2}
            h={1.5}
            tone="track"
            strokeWidth={0.8}
          />

          {/* Rails + sleepers on the track surface */}
          <g aria-hidden>
            {[-1.8, 1.8].map((b) => {
              const p1 = iso(aMin - 2, b, 1.5);
              const p2 = iso(aMax + 2, b, 1.5);
              return (
                <line
                  key={`rail-${b}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="color-mix(in oklch, var(--ink) 45%, transparent)"
                  strokeWidth={1}
                  strokeLinecap="round"
                />
              );
            })}
            {STATIONS.map((s) => {
              const p1 = iso(s.a + 1, -2.6, 1.5);
              const p2 = iso(s.a + 1, 2.6, 1.5);
              return (
                <line
                  key={`sleeper-${s.code}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="color-mix(in oklch, var(--ink) 22%, transparent)"
                  strokeWidth={0.8}
                />
              );
            })}
          </g>

          {/* Active route highlight on the track centerline */}
          {hasRoute ? (
            <line
              x1={iso(STATIONS[routeStart].a, B_CENTER, 1.5).x}
              y1={iso(STATIONS[routeStart].a, B_CENTER, 1.5).y}
              x2={iso(STATIONS[routeEnd].a + STATION_W, B_CENTER, 1.5).x}
              y2={iso(STATIONS[routeEnd].a + STATION_W, B_CENTER, 1.5).y}
              stroke="var(--primary)"
              strokeWidth={3.2}
              strokeLinecap="round"
              opacity={0.85}
            />
          ) : null}

          {/* Stations */}
          {STATIONS.map((station, index) => {
            const isEndpoint =
              hasRoute && (index === routeStart || index === routeEnd);
            const isActive = hasRoute && index >= routeStart && index <= routeEnd;
            const tone = isEndpoint
              ? "brand"
              : isActive
                ? "brand-soft"
                : "surface";
            const base = iso(station.a, -STATION_D / 2);
            const labelPos = iso(station.a + STATION_W, -STATION_D / 2);

            return (
              <g key={station.code}>
                {/* station block */}
                <IsoCuboid
                  x={base.x}
                  y={base.y}
                  w={STATION_W}
                  d={STATION_D}
                  h={STATION_H}
                  tone={tone}
                  strokeWidth={0.8}
                />
                {/* label */}
                <g transform={`translate(${labelPos.x + 5}, ${labelPos.y - 3})`}>
                  <text
                    x={0}
                    y={0}
                    fill={isEndpoint ? "var(--primary)" : "var(--ink-muted)"}
                    style={{
                      font: "600 11px/1 var(--font-mono), ui-monospace, monospace",
                    }}
                  >
                    {station.code}
                  </text>
                  {!compact ? (
                    <text
                      x={0}
                      y={13}
                      fill={isEndpoint ? "var(--ink)" : "var(--ink-muted)"}
                      style={{
                        font: "500 11px/1 var(--font-sans), system-ui, sans-serif",
                      }}
                    >
                      {station.name}
                    </text>
                  ) : null}
                </g>
              </g>
            );
          })}

          {/* Moving train on the active route */}
          {hasRoute && trainFrom && trainTo ? (
            <g data-route-train>
              <IsoCuboid x={-4} y={-3} w={7} d={4} h={3.4} tone="amber" strokeWidth={0.6} />
            </g>
          ) : null}
        </svg>
      </div>

      {hasRoute ? (
        <div className="mt-4 flex items-center gap-2 border border-primary/20 bg-primary-soft px-3 py-2">
          <span className="inline-block size-2.5 rounded-full bg-primary" aria-hidden />
          <p className="text-xs font-medium text-ink">
            {STATIONS[fromIndex]?.name} → {STATIONS[toIndex]?.name}
          </p>
        </div>
      ) : null}
    </Card>
  );
}