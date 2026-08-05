"use client";

/**
 * Variants chuẩn cho toàn bộ design system.
 * Mục tiêu: một bộ animation nhất quán, dễ nhớ, dễ áp dụng.
 *
 * Quy tắc:
 *  - Page enter: stagger 0.05s, y-12 → 0, opacity 0 → 1
 *  - Card hover: scale 1.02 + shadow lift
 *  - Stat number: count-up khi vào viewport
 *  - Skeleton → content: crossfade 0.3s
 */
import type gsap from "gsap";

/** Variants = record các state animation (hidden, visible, ...). */
export type Variants = Record<string, gsap.TweenVars>;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0 },
};

/** Stagger container — dùng cho list/card grid (chỉ là container, không có thuộc tính đặc biệt). */
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};

/** Transition mặc định cho variants — dùng chung để dễ tinh chỉnh. */
export const defaultTransition = {
  duration: 0.5,
  ease: "power2.out" as const,
};

export const fastTransition = {
  duration: 0.2,
  ease: "power2.out" as const,
};
