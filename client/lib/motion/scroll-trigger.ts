"use client";

/**
 * Hook tiện ích cho scroll-triggered animation.
 * Wrapper quanh gsap.context + ScrollTrigger để cleanup đúng cách.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

type ScrollTriggerOptions = {
  start?: string;
  end?: string;
  once?: boolean;
  toggleActions?: string;
};

type AnimationBuilder = (el: HTMLElement) => gsap.core.Timeline | gsap.core.Tween | void;

export function useScrollTrigger<T extends HTMLElement = HTMLElement>(
  build: AnimationBuilder,
  options: ScrollTriggerOptions = {},
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const tween = build(el);

    const st = ScrollTrigger.create({
      trigger: el,
      start: options.start ?? "top 85%",
      end: options.end,
      once: options.once ?? true,
      toggleActions: options.toggleActions ?? "play none none none",
      animation: tween ?? undefined,
    });

    return () => {
      st.kill();
      if (tween && "kill" in tween) tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/** Hook observe element vào viewport — dùng cho count-up, reveal, ... */
export function useInView<T extends HTMLElement = HTMLElement>(
  options: IntersectionObserverInit = { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
) {
  const ref = useRef<T | null>(null);
  const inViewRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry?.isIntersecting ?? false;
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ref, inViewRef };
}
