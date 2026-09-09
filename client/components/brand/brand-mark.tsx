"use client";

import Link from "next/link";
import { TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  href?: string;
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
};

export function BrandMark({
  href = "/",
  className,
  showText = true,
  size = "md",
}: BrandMarkProps) {
  const sizeMap = {
    sm: { icon: "size-7", text: "text-base", sub: "text-[9px]" },
    md: { icon: "size-9", text: "text-lg", sub: "text-[10px]" },
    lg: { icon: "size-12", text: "text-2xl", sub: "text-xs" },
  };
  const s = sizeMap[size];

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg",
        className
      )}
      aria-label="Mekong Line"
    >
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105",
          s.icon
        )}
      >
        <TrainFront className="size-[60%]" strokeWidth={1.75} />
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-accent ring-2 ring-background" />
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display font-semibold tracking-tight text-ink", s.text)}>
            Mekong Line
          </span>
          <span className={cn("mt-1 font-medium uppercase tracking-[0.2em] text-ink-muted", s.sub)}>
            Vietnam Railways
          </span>
        </span>
      )}
    </Link>
  );
}
