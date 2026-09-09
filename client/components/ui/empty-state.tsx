import Link from "next/link";
import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  href,
  cta,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  description: string;
  href?: string;
  cta?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: ReactNode;
  className?: string;
}) {
  const IconComponent = Icon ?? Sparkles;
  return (
    <Card
      variant="outlined"
      padding="xl"
      className={`flex flex-col items-center gap-5 text-center ${className ?? ""}`}
    >
      <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <IconComponent className="size-6" />
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
          {title}
        </h3>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      </div>
      {href && cta ? (
        <Button asChild variant="accent" size="sm">
          <Link href={href}>{cta}</Link>
        </Button>
      ) : action ? (
        action
      ) : null}
    </Card>
  );
}
