"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
  confirmPending?: boolean;
  onConfirm: () => void;
  /** Require explicit acknowledgment before enabling the confirm button. */
  requireAck?: boolean;
  ackLabel?: string;
};

/**
 * Confirmation dialog for destructive / irreversible actions (Direction B,
 * R8). Radix AlertDialog provides focus trap + Escape handling; the confirm
 * button is disabled until the user acknowledges when `requireAck` is set.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  variant = "destructive",
  confirmPending = false,
  onConfirm,
  requireAck = false,
  ackLabel = "Tôi hiểu thao tác này không thể hoàn tác.",
}: ConfirmDialogProps) {
  const [acked, setAcked] = React.useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) setAcked(false);
    onOpenChange(next);
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[1300] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[1400] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md bg-card p-6 shadow-xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          <AlertDialogPrimitive.Title className="text-base font-semibold tracking-tight text-ink">
            {title}
          </AlertDialogPrimitive.Title>
          {description ? (
            <AlertDialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-ink-muted">
              {description}
            </AlertDialogPrimitive.Description>
          ) : null}
          {requireAck ? (
            <label className="mt-4 flex items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={acked}
                onChange={(event) => setAcked(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded-sm border-border"
              />
              <span>{ackLabel}</span>
            </label>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialogPrimitive.Cancel asChild>
              <Button type="button" variant="outline">
                {cancelLabel}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <Button
              type="button"
              variant={variant === "destructive" ? "destructive" : "default"}
              disabled={(requireAck && !acked) || confirmPending}
              onClick={onConfirm}
            >
              {confirmPending ? "Đang xử lý..." : confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
