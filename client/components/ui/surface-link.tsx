import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";

export function SurfaceLink({
  href,
  title,
  description,
  className,
}: {
  href: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`block ${className ?? ""}`}>
      <Card interactive variant="outlined" padding="lg" className="gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-base font-semibold tracking-tight text-ink">
              {title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {description}
            </p>
          </div>
          <div className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary">
            <ArrowRight className="size-3.5" strokeWidth={1.5} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
