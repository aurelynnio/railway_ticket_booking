import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type NoticeTone = "default" | "success" | "warning" | "destructive" | "secondary";

const legacyToneMap: Record<string, NoticeTone> = {
  brand: "default",
  positive: "success",
  danger: "destructive",
  muted: "secondary",
  neutral: "secondary",
};

function normalizeTone(tone: string | undefined): NoticeTone {
  if (!tone) return "secondary";
  if (tone in legacyToneMap) return legacyToneMap[tone];
  if (tone === "default" || tone === "success" || tone === "warning" || tone === "destructive" || tone === "secondary") {
    return tone;
  }
  return "secondary";
}

const toneConfig = {
  success: { icon: CheckCircle2, class: "bg-success/5 text-success" },
  warning: { icon: AlertTriangle, class: "bg-warning/5 text-warning" },
  destructive: { icon: XCircle, class: "bg-destructive/5 text-destructive" },
  default: { icon: Info, class: "bg-primary/5 text-primary" },
  secondary: { icon: Info, class: "bg-secondary/50 text-ink-muted" },
};

export function NoticeBox({
  title,
  description,
  tone = "secondary",
  className,
}: {
  title: string;
  description: ReactNode;
  tone?: NoticeTone | "positive" | "danger" | "muted" | "brand";
  className?: string;
}) {
  const normalizedTone = normalizeTone(tone);
  const config = toneConfig[normalizedTone];
  const Icon = config.icon;

  return (
    <Card
      variant="flat"
      padding="md"
      className={cn(
        "flex flex-row items-start gap-3 border",
        config.class,
        className,
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <div className="text-sm leading-relaxed text-ink-muted">{description}</div>
      </div>
    </Card>
  );
}
