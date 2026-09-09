"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { CalendarDays, X } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

export type DatePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  icon?: React.ReactNode;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  className,
  disabled,
  minDate,
  icon,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? new Date(value) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange?.(format(date, "yyyy-MM-dd"));
    } else {
      onChange?.("");
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(format(new Date(), "yyyy-MM-dd"));
    setOpen(false);
  };

  const displayValue = selectedDate
    ? format(selectedDate, "dd/MM/yyyy", { locale: vi })
    : "";

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center gap-2 rounded-lg bg-card px-4 py-2.5 text-sm text-foreground shadow-sm transition-all duration-200 outline-none",
            "hover:shadow-md",
            "focus-visible:ring-4 focus-visible:ring-ring/10 focus-visible:shadow-md",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "data-[placeholder]:text-ink-subtle",
            className
          )}
          data-placeholder={!value ? "" : undefined}
        >
          {icon ?? <CalendarDays className="size-4 shrink-0 text-ink-subtle" />}
          <span className="flex-1 truncate text-left">
            {displayValue || placeholder}
          </span>
          {value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-muted hover:text-ink"
              aria-label="Xóa ngày"
            >
              <X className="size-3" />
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={6}
          align="start"
          className={cn(
            "z-[100] w-[320px] overflow-hidden rounded-xl bg-popover p-0 text-popover-foreground shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          <Calendar
            selected={selectedDate}
            onSelect={handleSelect}
            minDate={minDate}
          />
          {/* Footer actions — same style as Select */}
          <div className="flex items-center justify-between border-t border-border/50 px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="h-8 text-xs text-primary"
            >
              Hôm nay
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 text-xs text-ink-muted"
            >
              Xóa
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
