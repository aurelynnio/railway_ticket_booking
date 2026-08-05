"use client";

/**
 * PageTransition — fade + slide nhẹ khi chuyển trang trong Next.js App Router.
 * Dùng usePathname làm key để remount mỗi lần route đổi.
 */
import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const isFirst = useRef(true);

  useEffect(() => {
    if (reduced || !ref.current) return;
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
  }, [pathname, reduced]);

  return (
    <div
      ref={ref}
      key={pathname}
      className={cn("contents", className)}
      data-page-transition
    >
      {children}
    </div>
  );
}
