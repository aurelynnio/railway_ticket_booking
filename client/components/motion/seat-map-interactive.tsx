"use client";

/**
 * SeatMapInteractive — sơ đồ ghế với GSAP hover/select animation.
 *
 * Props:
 *  - seats: mảng seat { id, label, status, price }
 *  - selectedIds: danh sách id đang chọn
 *  - onToggle: callback khi click vào ghế
 *  - maxSeats: giới hạn tối đa ghế có thể chọn
 *  - cols: số cột trên sơ đồ
 */
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Armchair } from "lucide-react";
import { useRef, useState } from "react";

import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export type SeatStatus = "available" | "taken" | "selected" | "disabled";

export type Seat = {
  id: string;
  label: string;
  status: SeatStatus;
  price?: number;
};

type SeatMapProps = {
  seats: Seat[];
  selectedIds: string[];
  onToggle?: (seatId: string) => void;
  maxSeats?: number;
  cols?: number;
  className?: string;
  emptyMessage?: string;
};

export function SeatMapInteractive({
  seats,
  selectedIds,
  onToggle,
  maxSeats,
  cols = 4,
  className,
  emptyMessage = "Chưa có sơ đồ ghế cho chuyến này.",
}: SeatMapProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pulseSeatId, setPulseSeatId] = useState<string | null>(null);

  useGSAP(
    () => {
      if (reduced || !containerRef.current) return;
      gsap.fromTo(
        containerRef.current.querySelectorAll("[data-seat]"),
        { opacity: 0, scale: 0.85 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.35,
          ease: "back.out(1.4)",
          stagger: 0.015,
        },
      );
    },
    { scope: containerRef, dependencies: [seats.length, reduced] },
  );

  if (seats.length === 0) {
    return (
      <Card
        variant="flat"
        className={cn(
          "border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {emptyMessage}
      </Card>
    );
  }

  const handleClick = (seat: Seat) => {
    if (seat.status === "taken" || seat.status === "disabled") return;
    if (
      maxSeats !== undefined &&
      !selectedIds.includes(seat.id) &&
      selectedIds.length >= maxSeats
    ) {
      return;
    }
    setPulseSeatId(seat.id);
    onToggle?.(seat.id);
    if (!reduced) {
      const el = containerRef.current?.querySelector(`[data-seat-id="${seat.id}"]`);
      if (el) {
        gsap.fromTo(
          el,
          { scale: 1 },
          { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" },
        );
      }
    }
    window.setTimeout(() => setPulseSeatId(null), 300);
  };

  return (
    <div
      ref={containerRef}
      className={cn("space-y-3", className)}
      role="grid"
      aria-label="Sơ đồ ghế"
    >
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {seats.map((seat) => {
          const isSelected = selectedIds.includes(seat.id);
          const isTaken = seat.status === "taken" || seat.status === "disabled";
          const isPulsing = pulseSeatId === seat.id;
          return (
            <button
              key={seat.id}
              type="button"
              data-seat
              data-seat-id={seat.id}
              disabled={isTaken}
              onClick={() => handleClick(seat)}
              aria-pressed={isSelected}
              aria-label={`Ghế ${seat.label}${isTaken ? " (đã bán)" : isSelected ? " (đang chọn)" : ""}`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-md border text-xs font-medium transition-colors",
                "hover:border-brand hover:bg-brand-soft",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isTaken && "cursor-not-allowed border-border bg-muted/40 text-muted-foreground/60 line-through",
                !isTaken && !isSelected && "border-border bg-card text-foreground",
                isSelected && "border-brand bg-brand text-brand-foreground shadow-brand",
                isPulsing && "ring-2 ring-brand/40",
              )}
            >
              <Armchair className="size-3.5" aria-hidden />
              <span className="sr-only">{seat.label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded border border-border bg-card" aria-hidden />
          Còn trống
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded border border-brand bg-brand" aria-hidden />
          Đang chọn
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded border border-border bg-muted/40" aria-hidden />
          Đã bán
        </span>
      </div>
    </div>
  );
}
