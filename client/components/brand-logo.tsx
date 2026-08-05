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
  /** override the onClick, e.g. for keeping focus on a button */
  asChild?: boolean;
};

const SIZE_MAP: Record<
  BrandSize,
  { markBox: number; markClass: string; textClass: string; tagline: boolean }
> = {
  sm: {
    markBox: 32,
    markClass: "h-8 w-8",
    textClass: "text-xs",
    tagline: false,
  },
  md: {
    markBox: 44,
    markClass: "h-11 w-11",
    textClass: "text-sm",
    tagline: false,
  },
  lg: {
    markBox: 56,
    markClass: "h-14 w-14",
    textClass: "text-base",
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
        "group inline-flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md",
        className,
      )}
      aria-label="Vietrail Way"
    >
      {variant === "mark" ? (
        <span
          className={cn(
            "shrink-0 overflow-hidden rounded-lg border border-border/60 bg-card transition-transform group-hover:scale-[1.02]",
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
            className="h-10 w-auto"
            priority
          />
        </span>
      )}

      {variant === "mark" ? (
        <span className="grid gap-0.5 leading-none">
          <span
            className={cn(
              "font-heading font-bold tracking-tight text-ink",
              dims.textClass,
              size === "lg" ? "text-lg" : size === "md" ? "text-sm" : "text-xs",
            )}
          >
            Vietrail Way
          </span>
          {sublabel ? (
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider text-ink-muted",
                size === "lg" && "text-xs",
              )}
            >
              {sublabel}
            </span>
          ) : null}
          {dims.tagline && !sublabel ? (
            <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
              Đặt vé tàu Bắc · Trung · Nam
            </span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
