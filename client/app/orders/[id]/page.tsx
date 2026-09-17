"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  XCircle,
  Printer,
  TrainFront,
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  User,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatus } from "@/lib/api-types/order";
import { useCancelOrder, useOrder } from "@/hooks/order.hook";
import { useCreateVnpayPayment } from "@/hooks/payment.hook";
import { TicketQRCode } from "@/components/ticket/qr-code";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusTone,
} from "@/lib/formatters";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const query = useOrder(orderId);
  const order = query.data;

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const vnpay = useCreateVnpayPayment();
  const cancel = useCancelOrder();

  if (query.isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="mt-6 h-60 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="font-display text-2xl font-semibold text-ink">
            Không tìm thấy đơn hàng
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="size-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </AppLayout>
    );
  }

  const status = order.status ?? 0;
  const canPay = status === OrderStatus.PendingPayment;
  const canCancel = [OrderStatus.PendingPayment, OrderStatus.Paid].includes(status);
  const isTicketReady = [
    OrderStatus.Paid,
    OrderStatus.Confirmed,
    OrderStatus.TicketIssued,
  ].includes(status);

  const handlePayNow = () => {
    vnpay.mutate(
      { orderId },
      {
        onSuccess: (data) => {
          if (data.paymentUrl) {
            window.location.href = data.paymentUrl;
          }
        },
      },
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const qrValue =
    order.qrPayload ||
    JSON.stringify({
      orderId: order.id,
      ticketCode: order.ticketCode || `TCK-${order.id.slice(0, 8).toUpperCase()}`,
      trainNumber: order.trainNumber,
      seats: order.seatLabels,
      from: order.departureStationCode,
      to: order.arrivalStationCode,
    });

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Navigation & Header (Hidden during printing) */}
        <div className="print:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 text-ink-muted"
            onClick={() => router.push("/orders")}
          >
            <ArrowLeft className="size-4 mr-2" />
            Quay lại danh sách đơn
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-3xl font-semibold text-ink">
                  Đơn hàng #{order.id?.slice(0, 8).toUpperCase()}
                </h1>
                <Badge variant={getOrderStatusTone(status)}>
                  {formatOrderStatus(status)}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                Ngày tạo đơn: {formatDateTime(order.createdAt)}
              </p>
            </div>

            {isTicketReady && (
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="size-4 mr-2" />
                In vé / Lưu PDF
              </Button>
            )}
          </div>
        </div>

        {/* BOARDING PASS / ELECTRONIC TICKET (Shown when Paid / Issued) */}
        {isTicketReady && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between print:hidden">
              <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" />
                Thẻ lên tàu điện tử (Boarding Pass)
              </h2>
              <span className="text-xs text-ink-muted">
                Xuất trình mã QR tại cửa soát vé tự động
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-card shadow-lg print:border-black print:shadow-none">
              {/* Ticket Top Banner */}
              <div className="bg-primary px-6 py-4 text-primary-foreground flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <TrainFront className="size-5 text-accent" />
                  <span className="font-display text-lg font-bold tracking-wide uppercase">
                    ĐƯỜNG SẮT VIỆT NAM · VIETRAIL
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-primary-foreground/80">Mã vé:</span>
                  <span className="font-mono text-base font-bold bg-white/10 px-3 py-1 rounded-lg">
                    {order.ticketCode || `TCK-${order.id.slice(0, 8).toUpperCase()}`}
                  </span>
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-6 grid gap-6 md:grid-cols-[1fr_200px] items-center">
                <div className="space-y-6">
                  {/* Journey Route */}
                  <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/30 p-4 border border-border/60">
                    <div>
                      <p className="text-xs uppercase font-semibold text-ink-muted">Ga đi</p>
                      <p className="font-display text-xl font-bold text-ink">
                        {order.departureStationName ?? order.departureStationCode}
                      </p>
                      <p className="font-mono text-xs text-primary font-medium mt-1">
                        {formatDateTime(order.departureTime)}
                      </p>
                    </div>

                    <div className="flex-1 px-4 text-center">
                      <p className="font-mono text-xs font-bold text-accent uppercase">
                        Tàu {order.trainNumber ?? "—"}
                      </p>
                      <div className="relative my-2 flex items-center justify-center">
                        <div className="h-0.5 w-full bg-border" />
                        <span className="absolute bg-card px-2 text-ink-subtle">➔</span>
                      </div>
                      <p className="text-[11px] text-ink-muted">
                        Toa {order.coachCode ?? "—"} ({order.seatClass ?? "Ghế mềm"})
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase font-semibold text-ink-muted">Ga đến</p>
                      <p className="font-display text-xl font-bold text-ink">
                        {order.arrivalStationName ?? order.arrivalStationCode}
                      </p>
                      <p className="font-mono text-xs text-primary font-medium mt-1">
                        {formatDateTime(order.arrivalTime)}
                      </p>
                    </div>
                  </div>

                  {/* Seat & Passengers List */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                      Hành khách & Chỗ ngồi ({order.quantity} vé)
                    </p>
                    <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                      {order.passengers && order.passengers.length > 0 ? (
                        order.passengers.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex flex-wrap items-center justify-between p-3.5 text-sm bg-card"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft font-mono text-xs font-bold text-primary">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-semibold text-ink">{p.fullName}</p>
                                <p className="text-xs text-ink-muted">
                                  {p.passengerType === "CHILD"
                                    ? "Trẻ em (Giảm 25%)"
                                    : p.passengerType === "STUDENT"
                                      ? "Sinh viên (Giảm 10%)"
                                      : p.passengerType === "SENIOR"
                                        ? "Người cao tuổi (Giảm 15%)"
                                        : "Người lớn"}
                                  {p.identityNumber && ` · CCCD: ${p.identityNumber}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="default" className="font-mono text-xs">
                                Ghế {order.seatLabels?.[idx] ?? "—"}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3.5 text-sm text-ink-muted">
                          Chỗ ngồi:{" "}
                          <span className="font-mono font-bold text-ink">
                            {order.seatLabels?.join(", ") ?? "—"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="flex flex-col items-center justify-center p-4 border-t md:border-t-0 md:border-l border-border text-center">
                  <TicketQRCode value={qrValue} size={150} />
                  <p className="mt-3 font-mono text-xs font-bold tracking-wider text-ink">
                    {order.ticketCode || `TCK-${order.id.slice(0, 8).toUpperCase()}`}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-muted">Quét tại cửa soát vé</p>
                </div>
              </div>

              {/* Ticket Footer */}
              <div className="bg-muted/40 px-6 py-3 border-t border-border flex flex-wrap items-center justify-between text-xs text-ink-muted">
                <span>Hành khách vui lòng có mặt tại ga trước 30 phút.</span>
                <span>Tổng tiền: {formatCurrency(order.totalPrice ?? "0")}</span>
              </div>
            </div>
          </div>
        )}

        {/* ORDER ACTIONS & DETAILS (Hidden during printing) */}
        <div className="mt-8 space-y-6 print:hidden">
          {/* Payment action if pending */}
          {canPay && (
            <Card variant="elevated" padding="lg" className="border-accent/40 bg-accent/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                    <AlertCircle className="size-5 text-accent" />
                    Đơn hàng đang chờ thanh toán
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Ghế ngồi của bạn đang được tạm giữ trong 10 phút. Vui lòng thanh toán qua VNPay để xác nhận vé.
                  </p>
                </div>
                <Button
                  variant="accent"
                  size="lg"
                  onClick={handlePayNow}
                  disabled={vnpay.isPending}
                  className="shrink-0"
                >
                  <CreditCard className="size-4 mr-2" />
                  {vnpay.isPending ? "Đang tạo liên kết..." : "Thanh toán VNPay ngay"}
                </Button>
              </div>
            </Card>
          )}

          {/* General Information Card */}
          <Card variant="outlined" padding="lg">
            <h3 className="font-display text-lg font-semibold text-ink">
              Chi tiết giao dịch
            </h3>
            <div className="mt-5 space-y-4">
              <Row label="Mã đơn hàng" value={order.id ?? "—"} mono />
              <Row label="Trạng thái" value={formatOrderStatus(status)} />
              <Row label="Thời gian tạo" value={formatDateTime(order.createdAt)} />
              <Row label="Đoàn tàu" value={`Tàu ${order.trainNumber ?? "—"}`} />
              <Row
                label="Hành trình"
                value={`${order.departureStationName ?? "—"} → ${order.arrivalStationName ?? "—"}`}
              />
              <Row
                label="Số lượng vé"
                value={`${order.quantity ?? 0} vé · Toa ${order.coachCode ?? "—"} (${order.seatLabels?.join(", ") ?? "—"})`}
              />
              {order.contactEmail && (
                <Row label="Email nhận vé" value={order.contactEmail} />
              )}
              {order.contactPhone && (
                <Row label="SĐT liên hệ" value={order.contactPhone} />
              )}
              <Row
                label="Tổng thanh toán"
                value={formatCurrency(order.totalPrice ?? "0")}
                highlight
              />
              {order.cancelReason && (
                <Row label="Lý do hủy" value={order.cancelReason} />
              )}
            </div>
          </Card>

          {/* Cancel Order Section */}
          {canCancel && (
            <Card variant="outlined" padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">
                    Hủy đơn hàng
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Ghế đã giữ sẽ được hoàn lại kho vé cho hành khách khác.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowCancelForm((v) => !v)}>
                  {showCancelForm ? "Đóng" : "Hủy đơn hàng"}
                </Button>
              </div>

              {showCancelForm && (
                <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-muted/40 p-4 border border-border">
                  <div className="min-w-64 flex-1 space-y-2">
                    <Label htmlFor="reason">Lý do hủy (tùy chọn)</Label>
                    <Input
                      id="reason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="VD: Đổi lịch trình, chọn nhầm toa..."
                    />
                  </div>
                  <Button
                    variant="destructive"
                    disabled={cancel.isPending}
                    onClick={() =>
                      cancel.mutate(
                        {
                          orderId,
                          payload: cancelReason.trim()
                            ? { reason: cancelReason.trim() }
                            : undefined,
                        },
                        {
                          onSuccess: () => {
                            setShowCancelForm(false);
                            setCancelReason("");
                          },
                        }
                      )
                    }
                  >
                    <XCircle className="size-4 mr-1.5" />
                    {cancel.isPending ? "Đang hủy..." : "Xác nhận hủy đơn"}
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span
        className={
          highlight
            ? "font-display text-xl font-bold tabular-nums text-primary"
            : mono
              ? "font-mono text-sm font-medium text-ink"
              : "text-sm font-medium text-ink"
        }
      >
        {value}
      </span>
    </div>
  );
}