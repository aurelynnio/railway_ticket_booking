"use client";

import { cn } from "@/lib/utils";

interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  title?: string;
  maxValue?: number;
  className?: string;
}

export function BarChart({ data, title, maxValue, className }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {title ? (
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      ) : null}
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <p className="w-24 shrink-0 text-right text-xs text-muted-foreground">
              {item.label}
            </p>
            <div className="flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-5 rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.max((item.value / max) * 100, item.value > 0 ? 4 : 0)}%`,
                  backgroundColor: item.color ?? "var(--primary)",
                }}
              />
            </div>
            <p className="w-8 shrink-0 text-xs font-medium text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DonutStatProps {
  value: number;
  total: number;
  label: string;
  size?: number;
}

export function DonutStat({ value, total, label, size = 80 }: DonutStatProps) {
  const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
  const circumference = 2 * Math.PI * 30;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 70 70"
          className="rotate-[-90deg]"
          style={{ width: size, height: size }}
        >
          <circle
            cx="35"
            cy="35"
            r="30"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="8"
          />
          <circle
            cx="35"
            cy="35"
            r="30"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-base font-semibold text-foreground">
            {percentage}%
          </span>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
