"use client";

/**
 * GSAP config & plugin registration.
 *
 * Chỉ chạy 1 lần ở client, lazy-load ScrollTrigger để giảm bundle ban đầu.
 * Không gọi gsap.set/gsap.tween ở module-level — luôn bọc trong useGSAP/useLayoutEffect.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function registerMotionPlugins() {
  if (registered || typeof window === "undefined") return;
  registered = true;
  gsap.registerPlugin(ScrollTrigger);

  // Tôn trọng reduced-motion: tắt animation tự động
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    gsap.globalTimeline.timeScale(100); // tua nhanh đến kết thúc
  }

  // Mặc định ease + duration cho cả project
  gsap.defaults({ ease: "power2.out", duration: 0.5 });
}

export { gsap, ScrollTrigger };
