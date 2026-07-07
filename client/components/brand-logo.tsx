"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandLogo({
  href = "/",
  sublabel,
  className,
}: {
  href?: string;
  sublabel?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-card/80 p-1.5 shadow-xs ring-1 ring-white/80">
        <Image
          src="/imgs/vietrail-mark.png"
          alt=""
          width={64}
          height={28}
          className="h-auto w-full object-contain"
          priority
        />
      </span>
      <span className="grid gap-0.5">
        <span className="font-heading text-sm font-semibold leading-none tracking-tight text-foreground">
          Vietrail Way
        </span>
        {sublabel ? (
          <span className="text-xs leading-none text-muted-foreground">{sublabel}</span>
        ) : null}
      </span>
    </Link>
  );
}
