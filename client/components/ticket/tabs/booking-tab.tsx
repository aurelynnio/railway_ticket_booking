"use client";

import { useState, useMemo } from "react";
import { Check, ChevronRight, CreditCard, Lock, ShieldCheck, User2, TrainFront } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/ui/form-field";
import { SeatMapInteractive, type Seat } from "@/components/motion/seat-map-interactive";
import { NoticeBox } from "@/components/ui/railway-ui";
import { TicketCard } from "@/components/ticket/ticket-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { integerText, optionalText } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { useCreateOrder } from "@/hooks/order.hook";
import { useCreateVnpayPayment } from "@/hooks/payment.hook";

import type { TicketResponse, TicketItemResponse } from "@/lib/api-types/ticket";

const createOrderSchema = z.object({
  passengerName: optionalText(),
  seatLabels: optionalText(),
  quantity: integerText("Số lượng", 1),
});

type Ticket = TicketResponse;
type TicketItem = TicketItemResponse;

type Props = {
  ticket: Ticket;
  selectedItem: TicketItem | null;
  sessionUserId?: string;
};

const BOOKING_STEPS = [
  { id: "trip", label: "Chọn chuyến" },
  { id: "seat", label: "Chọn ghế" },
  { id: "info", label: "Thông tin" },
  { id: "payment", label: "Thanh toán" },
];

export function BookingTab({ ticket, selectedItem, sessionUserId }: Props) {
  const createOrder = useCreateOrder();
  const createVnpayPayment = useCreateVnpayPayment();
  const [submitted, setSubmitted] = useState(false);
  const [seatSelection, setSeatSelection] = useState<{ itemId: string | null; ids: string[] }>({
    itemId: null,
    ids: [],
  });
  // Stable key per booking session: repeated submits/retries reuse the same
  // key so the server can deduplicate and avoid creating duplicate orders.
  const [idempotencyKey] = useState<string>(() =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const selectedItemId = selectedItem?.id ?? null;
  const selectedSeatIds = seatSelection.itemId === selectedItemId ? seatSelection.ids : [];

  const seatList: Seat[] = useMemo(() => {
    if (!selectedItem) return [];
    const occupied = new Set(selectedItem.occupiedSeatLabels ?? []);
    return selectedItem.seatLabels.map((label) => ({
      id: label,
      label,
      status: occupied.has(label) ? "taken" : "available",
    }));
  }, [selectedItem]);

  const handleSeatToggle = (seatId: string) => {
    setSeatSelection((previous) => {
      const ids = previous.itemId === selectedItemId ? previous.ids : [];
      return {
        itemId: selectedItemId,
        ids: ids.includes(seatId) ? ids.filter((id) => id !== seatId) : [...ids, seatId],
      };
    });
  };

  const form = useForm<z.infer<typeof createOrderSchema>>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      passengerName: "",
      seatLabels: "",
      quantity: "1",
    },
  });

  const isPending = createOrder.isPending || createVnpayPayment.isPending;
  const quantity = Number(useWatch({ control: form.control, name: "quantity" })) || 1;
  const enteredSeatLabels = useWatch({ control: form.control, name: "seatLabels" }) ?? "";
  const effectiveQuantity = selectedSeatIds.length > 0 ? selectedSeatIds.length : quantity;
  const unitPrice = selectedItem?.priceFlash ?? selectedItem?.priceOriginal ?? 0;
  const totalPrice = unitPrice * effectiveQuantity;

  async function handleSubmit(values: z.infer<typeof createOrderSchema>) {
    if (!ticket || !selectedItem) {
      return;
    }
    const numericQuantity = Number(values.quantity);
    const unitPrice = selectedItem.priceFlash ?? selectedItem.priceOriginal ?? 0;

    const result = await createOrder.mutateAsync({
      userId: sessionUserId ?? "",
      ticketId: ticket.id,
      ticketItemId: selectedItem.id,
      ticketTitle: ticket.title ?? "Untitled ticket",
      trainNumber: ticket.trainNumber,
      departureStationCode: ticket.departureStationCode,
      departureStationName: ticket.departureStationName,
      arrivalStationCode: ticket.arrivalStationCode,
      arrivalStationName: ticket.arrivalStationName,
      departureTime: ticket.dateStart,
      arrivalTime: ticket.dateEnd,
      coachCode: selectedItem.coachCode,
      seatClass: selectedItem.seatClass,
      seatType: selectedItem.seatType,
      quantity: Number.isNaN(numericQuantity) ? 1 : numericQuantity,
      unitPrice,
      seatLabels: selectedSeatIds.length > 0
        ? selectedSeatIds
        : values.seatLabels
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
      passengers: values.passengerName
        ? [{ fullName: values.passengerName.trim(), passengerType: "ADULT" }]
        : [],
      idempotencyKey,
    });
    setSubmitted(true);
    const vnpay = await createVnpayPayment.mutateAsync({
      orderId: result.order.id,
      orderInfo: `Thanh toan don hang ${result.order.id.slice(0, 8)}`,
    });
    window.location.assign(vnpay.paymentUrl);
  }

  if (!selectedItem) {
    return (
      <Card variant="outlined" padding="lg">
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center border border-border bg-primary-soft text-primary">
            <TrainFront className="size-5" />
          </div>
          <p className="font-display text-lg font-semibold text-ink">Chưa chọn hạng vé</p>
          <p className="mt-1 text-sm text-ink-muted">
            Hãy chọn một hạng vé ở tab Hành trình để tiếp tục đặt chỗ.
          </p>
        </div>
      </Card>
    );
  }

  const currentStep = selectedSeatIds.length > 0 || form.formState.isSubmitted ? 2 : 1;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5 min-w-0">
        <TicketCard
          title={ticket.title ?? "Hành trình"}
          trainNumber={ticket.trainNumber}
          departureStationName={ticket.departureStationName}
          departureStationCode={ticket.departureStationCode}
          arrivalStationName={ticket.arrivalStationName}
          arrivalStationCode={ticket.arrivalStationCode}
          dateStart={ticket.dateStart}
          dateEnd={ticket.dateEnd}
          compact
        />

        <BookingSteps currentStep={currentStep} />

        <Card variant="outlined" padding="lg">
          <CardHeader className="px-0 pt-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                  Bước 2 — Chọn chỗ
                </p>
                <CardTitle className="text-lg">Sơ đồ ghế {selectedItem.name ?? selectedItem.coachCode}</CardTitle>
                <p className="text-sm text-ink-muted">
                  Toa <span className="font-mono font-semibold tabular-nums text-ink">{selectedItem.coachCode ?? "—"}</span> · {selectedItem.seatClass} · {selectedItem.seatType}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">
                  <span className="font-mono tabular-nums">{selectedItem.availableSeatLabels.length}</span> chỗ trống
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form
              className="space-y-5"
              onSubmit={form.handleSubmit((values) => void handleSubmit(values))}
            >
              {seatList.length > 0 ? (
                <SeatMapInteractive
                  seats={seatList}
                  selectedIds={selectedSeatIds}
                  onToggle={handleSeatToggle}
                  maxSeats={Math.max(1, quantity)}
                  cols={4}
                />
              ) : null}

              <div className="soft-divider" />

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                    Bước 3 — Thông tin hành khách
                  </p>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                    Điền thông tin
                  </h3>
                  <p className="text-sm text-ink-muted">
                    Điền thông tin để giữ chỗ trong 10 phút trước khi chuyển sang VNPay.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Họ tên hành khách"
                    error={form.formState.errors.passengerName?.message}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="passengerName"
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                      aria-invalid={Boolean(form.formState.errors.passengerName)}
                      {...form.register("passengerName")}
                    />
                  </FormField>

                  <FormField
                    label="Mã ghế (tùy chọn)"
                    hint="Chọn ghế trên sơ đồ bên trên hoặc nhập tay theo định dạng A1,A2."
                    error={form.formState.errors.seatLabels?.message}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="seatLabels"
                      placeholder="A1, A2, A3"
                      aria-invalid={Boolean(form.formState.errors.seatLabels)}
                      value={
                        selectedSeatIds.length > 0
                          ? selectedSeatIds.join(", ")
                          : enteredSeatLabels
                      }
                      readOnly={selectedSeatIds.length > 0}
                      {...form.register("seatLabels")}
                    />
                  </FormField>

                  <FormField
                    label="Số lượng vé"
                    hint="Có thể mua nhiều vé trong cùng một đơn."
                    error={form.formState.errors.quantity?.message}
                  >
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      aria-invalid={Boolean(form.formState.errors.quantity)}
                      {...form.register("quantity")}
                    />
                  </FormField>
                </div>
              </div>

              <div className="soft-divider" />

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <TrustChip icon={<ShieldCheck className="size-3" />} label="Bảo mật VNPay" />
                  <TrustChip icon={<Lock className="size-3" />} label="Mã hóa TLS 1.3" />
                  <TrustChip icon={<User2 className="size-3" />} label="Đồng bộ tài khoản" />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2"
                  disabled={!sessionUserId || isPending}
                  aria-busy={isPending}
                  aria-disabled={!sessionUserId || isPending}
                >
                  <CreditCard className="size-4" aria-hidden />
                  {isPending
                    ? "Đang chuyển sang VNPay..."
                    : (
                      <span className="flex items-center gap-2">
                        Giữ chỗ & Thanh toán
                        <ChevronRight className="size-4" />
                      </span>
                    )}
                </Button>

                {!sessionUserId ? (
                  <NoticeBox
                    title="Cần đăng nhập"
                    description="Đăng nhập trước khi giữ chỗ để đơn hàng đồng bộ vào tài khoản của bạn."
                    tone="warning"
                  />
                ) : null}

                {submitted && !isPending ? (
                  <NoticeBox
                    title="Đã tạo đơn hàng"
                    description="Đang chuyển sang cổng VNPay để hoàn tất thanh toán."
                    tone="success"
                  />
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start space-y-4">
        <Card variant="outlined" padding="md">
          <CardHeader className="px-0 pt-0">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                Tóm tắt đơn
              </p>
              <CardTitle className="text-base">
                {selectedItem.name ?? selectedItem.coachCode ?? "Hạng vé"}
              </CardTitle>
              <p className="text-xs text-ink-muted">
                Toa <span className="font-mono font-semibold tabular-nums text-ink">{selectedItem.coachCode ?? "—"}</span> · {selectedItem.seatClass ?? "—"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            <div className="space-y-0 border-y border-border py-3">
              <PriceRow label="Tàu" value={<span className="font-mono font-semibold tabular-nums">{ticket.trainNumber ?? "—"}</span>} />
              <PriceRow label="Khởi hành" value={<span className="font-mono tabular-nums text-xs">{formatDateTime(ticket.dateStart)}</span>} />
              <PriceRow label="Đến nơi" value={<span className="font-mono tabular-nums text-xs">{formatDateTime(ticket.dateEnd)}</span>} />
            </div>

            <div className="space-y-2.5">
              <PriceRow
                label="Đơn giá"
                value={<span className="font-mono tabular-nums">{formatCurrency(unitPrice)}</span>}
              />
              <PriceRow
                label="Số lượng"
                value={<span className="font-mono font-semibold tabular-nums text-ink">× {effectiveQuantity}</span>}
              />
              {selectedSeatIds.length > 0 ? (
                <div className="flex items-start justify-between gap-3 pt-1">
                  <span className="text-xs text-ink-muted shrink-0">Ghế đã chọn</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {selectedSeatIds.map((id) => (
                      <span key={id} className="inline-flex items-center justify-center min-w-[1.75rem] border border-primary/30 bg-primary-soft px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-primary">
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedItem.availableSeatLabels.slice(0, 12).map((label) => (
                  <span
                    key={label}
                    className={cn(
                      "inline-flex items-center justify-center min-w-[1.75rem] border px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums transition-colors",
                      selectedSeatIds.includes(label)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-ink-muted",
                    )}
                  >
                    {label}
                  </span>
                ))}
                {selectedItem.availableSeatLabels.length > 12 ? (
                  <span className="text-[10px] text-ink-muted self-center">+{selectedItem.availableSeatLabels.length - 12} khác</span>
                ) : null}
              </div>
            </div>
          </CardContent>
          <CardFooter className="mx-0 mb-0 mt-2 flex-col items-stretch gap-1 border-t border-border bg-secondary/30 px-0 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                Tổng tiền
              </span>
              <span className="font-display text-2xl font-bold tabular-nums text-ink mono">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <p className="text-[10px] text-ink-muted leading-relaxed">
              Đã bao gồm thuế VAT. Giữ chỗ thành công trong 10 phút.
            </p>
          </CardFooter>
        </Card>

        <Card variant="flat" padding="md" className="border border-border/70 bg-secondary/40">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
            Lưu ý
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            Giá cuối cùng được tính theo số lượng và mã ghế bạn chọn. Sau khi thanh toán, vé sẽ được phát hành tự động vào tài khoản.
          </p>
        </Card>
      </div>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}

function TrustChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 border border-border bg-secondary/40 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
      {icon}
      {label}
    </span>
  );
}

function BookingSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className="border border-border bg-card px-4 py-3 sm:px-5">
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        {BOOKING_STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const stepNum = index + 1;
          return (
            <div key={step.id} className="flex items-center gap-1.5 min-w-0 shrink-0">
              <div
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center border text-[10px] font-bold font-mono tabular-nums transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary bg-primary-soft text-primary",
                  !isCompleted && !isActive && "border-border bg-secondary text-ink-muted",
                )}
              >
                {isCompleted ? <Check className="size-3" /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors",
                  isActive && "text-primary",
                  isCompleted && "text-ink",
                  !isCompleted && !isActive && "text-ink-muted",
                )}
              >
                {step.label}
              </span>
              {index < BOOKING_STEPS.length - 1 ? (
                <ChevronRight className="size-3 text-border-strong mx-0.5 sm:mx-1" aria-hidden />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
