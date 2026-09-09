"use client";

import Link from "next/link";
import { MapPin, TrainFront, ArrowRight } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { STATIONS } from "@/lib/stations";

export default function RouteMapPage() {
  const totalDistance = STATIONS[STATIONS.length - 1]?.km ?? "—";
  const stationCount = STATIONS.length;
  const startStation = STATIONS[0];
  const endStation = STATIONS[STATIONS.length - 1];

  return (
    <AppLayout>
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            <span className="h-px w-10 bg-accent" />
            Lộ trình
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Bản đồ tuyến đường sắt
          </h1>
          <p className="mt-2 max-w-xl text-base text-ink-muted">
            Khám phá {stationCount} ga tàu trên tuyến Bắc-Nam, từ {startStation?.name} đến {endStation?.name}.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Visual map */}
        <Card variant="outlined" padding="lg" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-soft/30 via-transparent to-accent-soft/20" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <MapPin className="size-5" />
                </div>
                <p className="mt-2 font-display text-lg font-semibold text-ink">{startStation?.name}</p>
                <p className="text-xs text-ink-muted">Ga {startStation?.code}</p>
              </div>
              <div className="flex-1 px-4">
                <div className="relative h-1 rounded-full bg-border">
                  <div className="absolute inset-y-0 left-0 w-full rounded-full bg-gradient-to-r from-primary via-accent to-gold" />
                  <span className="absolute left-1/2 top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                    <TrainFront className="size-3.5 text-primary" />
                  </span>
                </div>
                <p className="mt-2 text-center text-xs text-ink-muted">
                  {totalDistance} <span className="mx-1 text-ink-subtle">·</span> {stationCount} ga
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-primary-foreground">
                  <MapPin className="size-5" />
                </div>
                <p className="mt-2 font-display text-lg font-semibold text-ink">{endStation?.name}</p>
                <p className="text-xs text-ink-muted">Ga {endStation?.code}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Station list */}
        <h2 className="mt-10 font-display text-2xl font-semibold text-ink">
          Tất cả ga tàu
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STATIONS.map((station) => (
            <Link
              key={station.code}
              href={`/search?from=${station.code}`}
              className="group"
            >
              <Card variant="outlined" padding="md" interactive>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <MapPin className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium text-ink">{station.name}</p>
                      <p className="text-xs text-ink-muted">Ga {station.code}</p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-ink-subtle transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
