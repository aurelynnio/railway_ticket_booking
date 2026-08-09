"use client";

/**
 * AnimatedSection — wrapper dùng GSAP để animate children khi mount.
 *
 * Props:
 *  - variant: chọn variant chuẩn (fadeUp, fadeIn, scaleIn, slideInLeft, slideInRight)
 *  - stagger: nếu true, animate children như 1 stagger group
 *  - delay: delay trước khi animate (giây)
 *  - as: tag HTML (mặc định "div")
 *
 * Sử dụng:
 *   <AnimatedSection variant="fadeUp" stagger>
 *     <Card />
 *     <Card />
 *   </AnimatedSection>
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type ElementType, type ReactNode } from "react";

import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

type VariantKey = "fadeUp" | "fadeIn" | "scaleIn" | "slideInLeft" | "slideInRight";

const VARIANT_MAP: Record<VariantKey, { hidden: gsap.TweenVars; visible: gsap.TweenVars }> = {
  fadeUp: { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } },
  fadeIn: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  scaleIn: { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } },
  slideInLeft: { hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0 } },
  slideInRight: { hidden: { opacity: 0, x: 16 }, visible: { opacity: 1, x: 0 } },
};

type AnimatedSectionProps = {
  children: ReactNode;
  variant?: VariantKey;
  stagger?: boolean;
  delay?: number;
  as?: ElementType;
  className?: string;
  scopeKey?: string;
  id?: string;
  "aria-label"?: string;
};

export function AnimatedSection({
  children,
  variant = "fadeUp",
  stagger = false,
  delay = 0,
  as: Tag = "div",
  className,
  scopeKey,
  id,
  "aria-label": ariaLabel,
}: AnimatedSectionProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const v = VARIANT_MAP[variant];

  useGSAP(
    () => {
      if (reduced || !containerRef.current) return;
      if (stagger) {
        gsap.fromTo(containerRef.current.children, v.hidden, {
          ...v.visible,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.05,
          delay,
        });
      } else {
        gsap.fromTo(containerRef.current, v.hidden, {
          ...v.visible,
          duration: 0.5,
          ease: "power2.out",
          delay,
        });
      }
    },
    { scope: containerRef, dependencies: [variant, stagger, delay, reduced, scopeKey] },
  );

  return (
    <Tag
      ref={containerRef as React.Ref<HTMLElement>}
      id={id}
      aria-label={ariaLabel}
      className={cn(className)}
      data-motion={stagger ? "stagger" : "single"}
    >
      {children}
    </Tag>
  );
}
