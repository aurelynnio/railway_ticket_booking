"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, XCircle } from "lucide-react";

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
import { formatCurrency, formatDateTime, formatOrderStatus, getOrderStatusTone } from "@/lib/formatters";

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
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
        </div>
      </AppLayout>
    );
  }

  const status = order.status ?? 0;
  const canPay = status === OrderStatus.PendingPayment;
  const canCancel = [OrderStatus.PendingPayment, OrderStatus.Paid].includes(status);

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

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 text-ink-muted"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Quay lại
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink">
              Đơn hàng #{order.id?.slice(0, 8).toUpperCase()}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
          <Badge variant={getOrderStatusTone(status)}>
            {formatOrderStatus(status)}
          </Badge>
        </div>

        <div className="mt-8 space-y-6">
          <Card variant="outlined" padding="lg">
            <h3 className="font-display text-lg font-semibold text-ink">
              Thông tin đơn hàng
            </h3>
            <div className="mt-5 space-y-4">
              <Row label="Mã đơn" value={order.id ?? "—"} mono />
              <Row label="Trạng thái" value={formatOrderStatus(status)} />
              <Row label="Ngày tạo" value={formatDateTime(order.createdAt)} />
              <Row label="Tàu" value={order.trainNumber ?? "—"} />
              <Row label="Hành trình" value={`${order.departureStationName ?? "—"} → ${order.arrivalStationName ?? "—"}`} />
              <Row label="Số vé" value={`${order.quantity ?? 0} vé · chỗ ${order.seatLabels?.join(", ") ?? "—"}`} />
              <Row
                label="Tổng tiền"
                value={formatCurrency(order.totalPrice ?? "0")}
                highlight
              />
              {order.cancelReason && (
                <Row label="Lý do hủy" value={order.cancelReason} />
              )}
            </div>
          </Card>

          {canPay && (
            <Card variant="elevated" padding="lg" className="border-accent/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink">
                    Chờ thanh toán
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Hoàn tất thanh toán qua cổng VNPay để xác nhận đơn hàng.
                  </p>
                </div>
                <Button variant="accent" size="lg" onClick={handlePayNow} disabled={vnpay.isPending}>
                  {vnpay.isPending ? "Đang tạo link..." : "Thanh toán ngay"}
                </Button>
              </div>
            </Card>
          )}

          {canCancel && (
            <Card variant="outlined" padding="lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">
                    Hủy đơn hàng
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Ghế đã giữ sẽ được hoàn lại về kho.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowCancelForm((v) => !v)}>
                  {showCancelForm ? "Đóng" : "Hủy đơn"}
                </Button>
              </div>
              {showCancelForm && (
                <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-muted/30 p-4">
                  <div className="min-w-64 flex-1 space-y-2">
                    <Label htmlFor="reason">Lý do (tùy chọn)</Label>
                    <Input
                      id="reason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="VD: Đổi kế hoạch"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    disabled={cancel.isPending}
                    onClick={() =>
                      cancel.mutate(
                        { orderId, payload: cancelReason.trim() ? { reason: cancelReason.trim() } : undefined },
                        {
                          onSuccess: () => {
                            setShowCancelForm(false);
                            setCancelReason("");
                          },
                        },
                      )
                    }
                  >
                    <XCircle className="size-4" />
                    {cancel.isPending ? "Đang hủy..." : "Xác nhận hủy"}
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