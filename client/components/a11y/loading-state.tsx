"use client";

/**
 * LoadingState — wrapper component với aria-busy, role status, live region.
 * Dùng cho skeleton + content switch, page transition, button submitting.
 *
 * Props:
 *  - loading: true = đang loading, false = đã có nội dung
 *  - label: text cho screen reader (mặc định: "Đang tải")
 *  - children: nội dung chính
 *  - fallback: skeleton/placeholder khi loading
 */
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type LoadingStateProps = {
  loading: boolean;
  label?: string;
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  /** Render thẻ HTML bọc ngoài (mặc định: div) */
  as?: "div" | "section" | "article" | "aside";
  /** Độ trễ tối thiểu trước khi hiển thị fallback (ms) — tránh flash khi data load nhanh */
  minDelay?: number;
};

export function LoadingState({
  loading,
  label = "Đang tải",
  children,
  fallback,
  className,
  as: Tag = "div",
  minDelay = 200,
}: LoadingStateProps) {
  const [delayedLoading, setDelayedLoading] = useState(loading);

  useEffect(() => {
    if (!loading) {
      setDelayedLoading(false);
      return;
    }
    const timer = window.setTimeout(() => setDelayedLoading(true), minDelay);
    return () => window.clearTimeout(timer);
  }, [loading, minDelay]);

  return (
    <Tag
      aria-busy={loading}
      aria-live="polite"
      aria-atomic="true"
      className={cn(className)}
    >
      {delayedLoading && loading ? (
        <span className="sr-only">{label}</span>
      ) : null}
      {delayedLoading && loading ? (fallback ?? children) : children}
    </Tag>
  );
}
