"use client";

/**
 * TicketNotch — mô-típ chữ ký "mép vé".
 *
 * Bọc nội dung bằng khung có mép bấm lỗ (dashed) + 2 vòng khuyết tròn
 * ở hai đầu. Dùng cho card vé, ticket detail, order summary.
 *
 * Props:
 *  - dashed: nếu true, thêm đường dashed ngang chia 2 phần (boarding / passenger)
 *  - className: truyền thẳng vào wrapper
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TicketNotchProps = {
  children: ReactNode;
  dashed?: boolean;
  className?: string;
};

export function TicketNotch({ children, dashed = false, className }: TicketNotchProps) {
  return (
    <div className={cn("ticket-notch", className)}>
      <div className="relative overflow-hidden rounded-lg border border-border bg-card">
        {dashed ? (
          <div
            className="pointer-events-none absolute inset-x-8 top-1/2 border-t border-dashed border-border-strong/70"
            aria-hidden
          />
        ) : null}
        {children}
      </div>
    </div>
  );
}
