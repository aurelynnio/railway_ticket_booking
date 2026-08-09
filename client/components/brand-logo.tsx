"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

type BrandSize = "sm" | "md" | "lg";
type BrandVariant = "mark" | "full";
type BrandTone = "auto" | "light" | "dark";

type BrandLogoProps = {
  href?: string;
  sublabel?: string;
  className?: string;
  size?: BrandSize;
  variant?: BrandVariant;
  tone?: BrandTone;
  asChild?: boolean;
};

const SIZE_MAP: Record<
  BrandSize,
  { markBox: number; markClass: string; textClass: string; wordmarkClass: string; tagline: boolean }
> = {
  sm: {
    markBox: 28,
    markClass: "h-7 w-7",
    textClass: "text-xs",
    wordmarkClass: "text-sm",
    tagline: false,
  },
  md: {
    markBox: 36,
    markClass: "h-9 w-9",
    textClass: "text-sm",
    wordmarkClass: "text-base",
    tagline: false,
  },
  lg: {
    markBox: 48,
    markClass: "h-12 w-12",
    textClass: "text-base",
    wordmarkClass: "text-xl",
    tagline: true,
  },
};

export function BrandLogo({
  href = "/",
  sublabel,
  className,
  size = "md",
  variant = "mark",
  tone = "auto",
}: BrandLogoProps) {
  const { resolvedTheme } = useTheme();
  const isDark = tone === "auto" ? resolvedTheme === "dark" : tone === "dark";
  const dims = SIZE_MAP[size];
  const markSrc = isDark ? "/logos/mark-dark.svg" : "/logos/mark-light.svg";
  const fullSrc = isDark ? "/logos/logo-dark.svg" : "/logos/logo-light.svg";

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-sm",
        className,
      )}
      aria-label="Vietrail Way"
    >
      {variant === "mark" ? (
        <span
          className={cn(
            "shrink-0 overflow-hidden rounded-sm border border-border bg-card transition-transform group-hover:scale-[1.02]",
            dims.markClass,
          )}
        >
          <Image
            src={markSrc}
            alt=""
            width={dims.markBox}
            height={dims.markBox}
            className="h-full w-full object-cover"
            priority
          />
        </span>
      ) : (
        <span className="shrink-0">
          <Image
            src={fullSrc}
            alt=""
            width={168}
            height={40}
            className={cn(
              "h-auto w-auto",
              size === "sm" ? "h-8" : size === "lg" ? "h-12" : "h-10",
            )}
            priority
          />
        </span>
      )}

      {variant === "mark" ? (
        <span className="grid gap-0.5 leading-none">
          <span
            className={cn(
              "font-display font-semibold tracking-tight text-ink",
              dims.wordmarkClass,
            )}
          >
            Vietrail Way
          </span>
          {sublabel ? (
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider text-ink-muted",
                size === "lg" && "text-xs",
              )}
            >
              {sublabel}
            </span>
          ) : null}
          {dims.tagline && !sublabel ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              Đặt vé tàu Bắc · Trung · Nam
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
