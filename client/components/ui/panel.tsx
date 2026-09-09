import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";

export function Panel({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  padding = "lg",
  variant = "outlined",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  variant?: "outlined" | "elevated" | "flat" | "quiet";
}) {
  return (
    <Card variant={variant} padding={padding} className={className}>
      <CardHeader className="pb-0">
        {eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
            {eyebrow}
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          {action ? <CardAction>{action}</CardAction> : null}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {children}
      </CardContent>
    </Card>
  );
}
