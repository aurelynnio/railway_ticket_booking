"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  /** ISO timestamp when the order was created */
  createdAt: string;
  /** Duration in minutes before expiry (default 10) */
  expiryMinutes?: number;
  className?: string;
}

function getRemainingMs(createdAt: string, expiryMinutes: number): number {
  const created = new Date(createdAt).getTime();
  const expiry = created + expiryMinutes * 60 * 1000;
  return Math.max(0, expiry - Date.now());
}

function formatMs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function CountdownTimer({
  createdAt,
  expiryMinutes = 10,
  className,
}: CountdownTimerProps) {
  const [remainingMs, setRemainingMs] = useState(() =>
    getRemainingMs(createdAt, expiryMinutes),
  );

  useEffect(() => {
    if (remainingMs <= 0) return;

    const interval = setInterval(() => {
      const remaining = getRemainingMs(createdAt, expiryMinutes);
      setRemainingMs(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, expiryMinutes, remainingMs]);

  const isExpired = remainingMs <= 0;
  const isUrgent = remainingMs < 2 * 60 * 1000; // less than 2 minutes

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium",
        isExpired
          ? "border-destructive/20 bg-destructive/8 text-destructive"
          : isUrgent
            ? "border-warning/25 bg-warning/8 text-warning animate-pulse"
            : "border-primary/20 bg-accent/50 text-accent-foreground",
        className,
      )}
      id="payment-countdown"
    >
      <Clock className="size-4 shrink-0" />
      {isExpired ? (
        <span>Đơn hàng đã hết hạn thanh toán</span>
      ) : (
        <span>
          Còn lại{" "}
          <span
            className={cn(
              "font-mono font-semibold tabular-nums",
              isUrgent ? "text-warning" : "text-primary",
            )}
          >
            {formatMs(remainingMs)}
          </span>{" "}
          để hoàn tất thanh toán
        </span>
      )}
    </div>
  );
}
