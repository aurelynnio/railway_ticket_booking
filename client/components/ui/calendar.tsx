"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";
import { vi } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type CalendarProps = {
  selected?: Date | null;
  onSelect?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
  showOutsideDays?: boolean;
  minDate?: Date;
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function Calendar({
  selected,
  onSelect,
  className,
  showOutsideDays = true,
  minDate,
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(selected ?? new Date());

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleDayClick = (day: Date) => {
    if (minDate && isBefore(day, startOfDay(minDate))) return;
    onSelect?.(day);
  };

  const isDayDisabled = (day: Date) => {
    if (minDate && isBefore(day, startOfDay(minDate))) return true;
    return false;
  };

  return (
    <div className={cn("w-[300px] p-3", className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setMonth(addMonths(month, -1))}
          className="text-ink-muted hover:text-ink"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-display text-sm font-semibold text-ink">
          {format(month, "MMMM yyyy", { locale: vi })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setMonth(addMonths(month, 1))}
          className="text-ink-muted hover:text-ink"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="flex h-8 items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-ink-subtle"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          const outside = !isSameMonth(day, month);
          const selectedDay = selected && isSameDay(day, selected);
          const today = isToday(day);
          const disabled = isDayDisabled(day);

          if (outside && !showOutsideDays) {
            return <div key={i} className="h-9" />;
          }

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(day)}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-xs font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
                outside && "text-ink-subtle/40",
                !outside && !selectedDay && !disabled && "text-ink hover:bg-muted",
                today && !selectedDay && "bg-primary-soft font-semibold text-primary",
                selectedDay && "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
                disabled && "cursor-not-allowed text-ink-subtle/30 hover:bg-transparent"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
