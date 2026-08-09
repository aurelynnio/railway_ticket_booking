"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

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
  showAisle?: boolean;
  aisleAfterCol?: number;
};

export function SeatMapInteractive({
  seats,
  selectedIds,
  onToggle,
  maxSeats,
  cols = 4,
  className,
  emptyMessage = "Chưa có sơ đồ ghế cho chuyến này.",
  showAisle = true,
  aisleAfterCol = 2,
}: SeatMapProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pulseSeatId, setPulseSeatId] = useState<string | null>(null);

  useGSAP(
    () => {
      if (reduced || !containerRef.current) return;
      gsap.fromTo(
        containerRef.current.querySelectorAll("[data-seat]"),
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
          stagger: 0.012,
        },
      );
    },
    { scope: containerRef, dependencies: [seats.length, reduced] },
  );

  if (seats.length === 0) {
    return (
      <div
        className={cn(
          "border border-dashed border-border bg-secondary/30 p-8 text-center text-sm text-ink-muted",
          className,
        )}
      >
        {emptyMessage}
      </div>
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
          { scale: 1.1, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" },
        );
      }
    }
    window.setTimeout(() => setPulseSeatId(null), 250);
  };

  const renderSeats = () => {
    const rows: React.ReactNode[] = [];
    const numRows = Math.ceil(seats.length / cols);
    let seatIndex = 0;

    for (let row = 0; row < numRows; row++) {
      const rowSeats: React.ReactNode[] = [];
      for (let col = 0; col < cols; col++) {
        if (showAisle && col === aisleAfterCol) {
          rowSeats.push(<div key="aisle" className="w-3 sm:w-5" aria-hidden />);
        }
        if (seatIndex < seats.length) {
          const seat = seats[seatIndex];
          const isSelected = selectedIds.includes(seat.id);
          const isTaken = seat.status === "taken" || seat.status === "disabled";
          const isPulsing = pulseSeatId === seat.id;
          const rowLabel = seat.label.replace(/[0-9]/g, "");
          const isFirstInRowGroup = col === 0 || (showAisle && col === aisleAfterCol);

          rowSeats.push(
            <button
              key={seat.id}
              type="button"
              data-seat
              data-seat-id={seat.id}
              disabled={isTaken}
              onClick={() => handleClick(seat)}
              aria-pressed={isSelected}
              aria-label={`Ghế ${seat.label}${isTaken ? " (đã bán)" : isSelected ? " (đang chọn)" : ""}`}
              title={`Ghế ${seat.label}${isTaken ? " - đã bán" : isSelected ? " - đang chọn" : " - trống"}`}
              className={cn(
                "group relative flex h-9 min-w-9 flex-col items-center justify-center border font-mono text-[11px] font-semibold tabular-nums transition-[color,background-color,border-color,box-shadow,transform] duration-150 sm:h-10 sm:min-w-10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                isTaken && "cursor-not-allowed border-border bg-muted/50 text-ink-muted/40 line-through",
                !isTaken && !isSelected && "border-border bg-card text-ink hover:border-primary hover:bg-primary-soft",
                isSelected && "border-primary bg-primary text-primary-foreground shadow-sm",
                isPulsing && "ring-2 ring-primary/30",
              )}
            >
              {isFirstInRowGroup && !isTaken ? (
                <span className={cn(
                  "absolute -left-0.5 -top-0.5 text-[8px] font-sans font-semibold uppercase",
                  isSelected ? "text-primary-foreground/60" : "text-ink-muted"
                )}>
                  {rowLabel}
                </span>
              ) : null}
              <span>{seat.label.replace(/^[A-Z]/, "")}</span>
            </button>
          );
          seatIndex++;
        }
      }
      rows.push(
        <div key={row} className="flex items-center justify-center gap-1.5">
          {rowSeats}
        </div>
      );
    }
    return rows;
  };

  return (
    <div
      ref={containerRef}
      className={cn("space-y-4", className)}
      role="grid"
      aria-label="Sơ đồ ghế"
    >
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-2 border border-border bg-secondary/50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
          <span className="inline-block h-2 w-8 bg-primary/20" aria-hidden />
          Đầu tàu
          <span className="inline-block h-2 w-8 bg-primary/20" aria-hidden />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 rounded-none border border-border bg-card p-4 sm:p-5">
        {renderSeats()}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-6 w-7 border border-border bg-card" aria-hidden />
          Còn trống
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-6 w-7 border border-primary bg-primary text-center text-[10px] font-mono font-semibold text-primary-foreground leading-6" aria-hidden>
            12
          </span>
          Đang chọn
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-6 w-7 border border-border bg-muted/50 text-center text-[10px] font-mono text-ink-muted/40 leading-[1.35rem] line-through" aria-hidden>
            08
          </span>
          Đã bán
        </span>
      </div>
    </div>
  );
}
