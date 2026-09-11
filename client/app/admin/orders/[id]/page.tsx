"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Wallet,
  CheckCircle2,
  TicketCheck,
  XCircle,
  Clock3,
  RotateCcw,
  Hourglass,
} from "lucide-react";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatus } from "@/lib/api-types/order";
import {
  useCancelOrder,
  useConfirmOrder,
  useExpireOrder,
  useIssueTicket,
  useMarkOrderPaid,
  useMarkOrderPendingPayment,
  useOrder,
  useRefundOrder,
  useRemoveOrder,
} from "@/hooks/order.hook";
import { formatCurrency, formatDateTime, formatOrderStatus, getOrderStatusTone } from "@/lib/formatters";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const query = useOrder(orderId);
  const order = query.data;

  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const markPending = useMarkOrderPendingPayment();
  const markPaid = useMarkOrderPaid();
  const confirm = useConfirmOrder();
  const issue = useIssueTicket();
  const cancel = useCancelOrder();
  const expire = useExpireOrder();
  const refund = useRefundOrder();
  const remove = useRemoveOrder();

  if (query.isLoading) {
    return <AdminLayout title="Chi tiết đơn"><Skeleton className="h-60 w-full" /></AdminLayout>;
  }

  const status = order?.status ?? 0;

  const showMarkPending = status === OrderStatus.Draft;
  const showMarkPaid = status === OrderStatus.PendingPayment;
  const showConfirm = status === OrderStatus.Paid;
  const showIssue = status === OrderStatus.Confirmed;
  const showExpire = status === OrderStatus.PendingPayment;
  const showFailed = [OrderStatus.Paid, OrderStatus.Confirmed, OrderStatus.TicketIssued].includes(status);
  const showCancel = ![OrderStatus.Cancelled, OrderStatus.Expired, OrderStatus.Refunded].includes(status);

  return (
    <AdminLayout title={`Đơn hàng #${(orderId ?? "").slice(0, 8).toUpperCase()}`}>
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.back()}>
        <ArrowLeft className="size-4" /> Quay lại
      </Button>
      <Card variant="outlined" padding="lg">
        <div className="flex items-center justify-between">
          <Badge variant={getOrderStatusTone(status)}>
            {formatOrderStatus(status)}
          </Badge>
          <span className="font-mono text-2xl font-bold tabular-nums text-primary">
            {formatCurrency(order?.totalPrice ?? "0")}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Row label="Mã đơn" value={order?.id ?? "—"} />
          <Row label="Người dùng" value={order?.userId ?? "—"} />
          <Row label="Tàu" value={order?.trainNumber ?? "—"} />
          <Row label="Hành trình" value={`${order?.departureStationName ?? "—"} → ${order?.arrivalStationName ?? "—"}`} />
          <Row label="Số vé" value={`${order?.quantity ?? 0} vé`} />
          <Row label="Chỗ" value={`${order?.seatLabels?.join(", ") ?? "—"}`} />
          <Row label="Ngày tạo" value={formatDateTime(order?.createdAt)} />
          <Row label="Cập nhật" value={formatDateTime(order?.updatedAt)} />
        </div>
      </Card>

      <Card variant="outlined" padding="lg" className="mt-4">
        <h3 className="text-sm font-semibold text-ink">Quản lý trạng thái</h3>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {showMarkPending && (
            <Button variant="outline" size="sm" onClick={() => markPending.mutate({ orderId })}>
              <Hourglass className="size-3.5" />
              Chờ thanh toán
            </Button>
          )}
          {showMarkPaid && (
            <Button variant="outline" size="sm" onClick={() => markPaid.mutate({ orderId })}>
              <Wallet className="size-3.5" />
              Đánh dấu đã thanh toán
            </Button>
          )}
          {showConfirm && (
            <Button variant="outline" size="sm" onClick={() => confirm.mutate({ orderId })}>
              <CheckCircle2 className="size-3.5" />
              Xác nhận đơn
            </Button>
          )}
          {showIssue && (
            <Button variant="outline" size="sm" onClick={() => issue.mutate({ orderId })}>
              <TicketCheck className="size-3.5" />
              Phát hành vé
            </Button>
          )}
          {showExpire && (
            <Button variant="outline" size="sm" onClick={() => expire.mutate({ orderId })}>
              <Clock3 className="size-3.5" />
              Hết hạn
            </Button>
          )}
          {showCancel && (
            <Button variant="outline" size="sm" onClick={() => setShowCancelForm(true)}>
              <XCircle className="size-3.5" />
              Hủy đơn
            </Button>
          )}
          {showFailed && (
            <Button variant="outline" size="sm" onClick={() => refund.mutate({ orderId })}>
              <RotateCcw className="size-3.5" />
              Hoàn tiền
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="ml-auto"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-3.5" />
            Xóa đơn
          </Button>
        </div>

        {showCancelForm && (
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-muted/30 p-4">
            <div className="min-w-64 flex-1 space-y-2">
              <Label htmlFor="cancelReason">Lý do hủy (tùy chọn)</Label>
              <Input
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="VD: Khách yêu cầu hủy"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
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
                <XCircle className="size-3.5" />
                {cancel.isPending ? "Đang hủy..." : "Xác nhận hủy"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCancelForm(false);
                  setCancelReason("");
                }}
              >
                Hủy
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Xóa đơn hàng?"
        description={`Đơn hàng ${orderId?.slice(0, 8).toUpperCase()} sẽ bị xóa hoàn toàn khỏi hệ thống.`}
        confirmLabel="Xóa"
        confirmPending={remove.isPending}
        onConfirm={() =>
          remove.mutate({ orderId }, { onSuccess: () => router.push("/admin/orders") })
        }
      />
    </AdminLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between rounded-lg bg-muted/30 p-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}