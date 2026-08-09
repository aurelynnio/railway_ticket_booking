"use client";

/**
 * CountUp — animate 1 số từ 0 → target khi vào viewport.
 * Dùng cho stat card, hero numbers, dashboard metrics.
 */
import gsap from "gsap";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

type CountUpProps = {
  to: number;
  duration?: number;
  decimals?: number;
  className?: string;
  /** Custom formatter, ví dụ: (n) => `${n.toLocaleString("vi-VN")} đ` */
  format?: (value: number) => ReactNode;
  /** Khoảng thời gian chờ trước khi bắt đầu */
  delay?: number;
};

export function CountUp({
  to,
  duration = 1.2,
  decimals = 0,
  className,
  format,
  delay = 0,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (reduced) {
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || startedRef.current) return;
        startedRef.current = true;
        const proxy = { v: 0 };
        gsap.to(proxy, {
          v: to,
          duration,
          delay,
          ease: "power2.out",
          onUpdate: () => setValue(proxy.v),
          onComplete: () => setValue(to),
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration, delay, reduced]);

  const renderedValue = reduced ? to : value;
  const display = format ? format(renderedValue) : renderedValue.toFixed(decimals);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {display}
    </span>
  );
}
