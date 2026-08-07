"use client";

import { useState, useMemo, useEffect } from "react";
import { CreditCard, Lock, ShieldCheck, User2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/form-field";
import { SeatMapInteractive, type Seat } from "@/components/motion/seat-map-interactive";
import {
  NoticeBox,
  StatusBadge,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SeatCloud } from "@/components/railway-ui";
import {
  formatCurrency,
} from "@/lib/formatters";
import { integerText, optionalText } from "@/lib/validation";
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

export function BookingTab({ ticket, selectedItem, sessionUserId }: Props) {
  const createOrder = useCreateOrder();
  const createVnpayPayment = useCreateVnpayPayment();
  const [submitted, setSubmitted] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  const seatList: Seat[] = useMemo(() => {
    if (!selectedItem) return [];
    const occupied = new Set(selectedItem.occupiedSeatLabels ?? []);
    return selectedItem.seatLabels.map((label) => ({
      id: label,
      label,
      status: occupied.has(label) ? "taken" : "available",
    }));
  }, [selectedItem]);

  useEffect(() => {
    setSelectedSeatIds([]);
  }, [selectedItem?.id]);

  const handleSeatToggle = (seatId: string) => {
    setSelectedSeatIds((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId],
    );
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
        <p className="text-sm text-ink-muted">
          Hãy chọn một hạng vé để tiếp tục đặt chỗ.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card variant="outlined" padding="md">
        <CardHeader>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Đặt chỗ
            </p>
            <CardTitle>Thông tin hành khách</CardTitle>
            <CardDescription>
              Điền thông tin để giữ chỗ trong 10 phút trước khi chuyển sang VNPay.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => void handleSubmit(values))}
          >
            <FormField
              label="Họ tên hành khách"
              error={form.formState.errors.passengerName?.message}
            >
              <Input
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                aria-invalid={Boolean(form.formState.errors.passengerName)}
                {...form.register("passengerName")}
              />
            </FormField>

            <FormField
              label="Mã ghế (tùy chọn)"
              hint="Chọn ghế trên sơ đồ bên dưới hoặc nhập tay theo định dạng A1,A2."
              error={form.formState.errors.seatLabels?.message}
            >
              <Input
                placeholder="A1, A2, A3"
                aria-invalid={Boolean(form.formState.errors.seatLabels)}
                value={
                  selectedSeatIds.length > 0
                    ? selectedSeatIds.join(", ")
                    : form.watch("seatLabels")
                }
                readOnly={selectedSeatIds.length > 0}
                {...form.register("seatLabels")}
              />
            </FormField>

            {seatList.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Sơ đồ ghế
                </p>
                <SeatMapInteractive
                  seats={seatList}
                  selectedIds={selectedSeatIds}
                  onToggle={handleSeatToggle}
                  maxSeats={Math.max(1, Number(form.watch("quantity")) || 1)}
                  cols={4}
                />
              </div>
            ) : null}

            <FormField
              label="Số lượng vé"
              hint="Có thể mua nhiều vé trong cùng một đơn."
              error={form.formState.errors.quantity?.message}
            >
              <Input
                type="number"
                min="1"
                aria-invalid={Boolean(form.formState.errors.quantity)}
                {...form.register("quantity")}
              />
            </FormField>

            <div className="grid gap-3 sm:grid-cols-3">
              <TrustChip icon={<ShieldCheck className="size-3" />} label="Bảo mật VNPay" />
              <TrustChip icon={<Lock className="size-3" />} label="Mã hóa TLS 1.3" />
              <TrustChip icon={<User2 className="size-3" />} label="Đồng bộ tài khoản" />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={!sessionUserId || isPending}
              aria-busy={isPending}
              aria-disabled={!sessionUserId || isPending}
            >
              <CreditCard className="size-4" aria-hidden />
              {isPending
                ? "Đang chuyển sang VNPay..."
                : "Giữ chỗ & thanh toán VNPay"}
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
                tone="positive"
              />
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card variant="flat" padding="md" className="self-start">
        <CardHeader>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Tóm tắt đơn
            </p>
            <CardTitle>{selectedItem.name ?? selectedItem.coachCode ?? "Hạng vé"}</CardTitle>
            <CardDescription>
              {selectedItem.seatClass ?? "—"} · {selectedItem.seatType ?? "—"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <Row label="Toa" value={selectedItem.coachCode ?? "—"} />
            <Row label="Đơn giá" value={formatCurrency(selectedItem.priceFlash ?? selectedItem.priceOriginal)} />
            <Row label="Giá gốc" value={formatCurrency(selectedItem.priceOriginal)} />
            <Row label="Chỗ còn" value={String(selectedItem.availableSeatLabels.length)} />
          </div>
          <Card variant="flat" className="p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Mã ghế còn trống
            </p>
            <div className="mt-2">
              <SeatCloud labels={selectedItem.availableSeatLabels} />
            </div>
          </Card>
          <div className="border-t border-border/70 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Lưu ý
            </p>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              Giá cuối cùng được tính theo số lượng và mã ghế bạn chọn. Sau khi thanh
              toán, vé sẽ được phát hành tự động vào tài khoản.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-ink-muted">
      <span>{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function TrustChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="route-pill">
      {icon}
      {label}
    </span>
  );
}
