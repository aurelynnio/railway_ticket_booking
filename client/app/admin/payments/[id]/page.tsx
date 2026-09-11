"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  Loader,
  CheckCircle2,
  XCircle,
  Ban,
  Clock3,
  RotateCcw,
} from "lucide-react";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentStatus } from "@/lib/api-types/payment";
import {
  useCancelPayment,
  useDeletePayment,
  useExpirePayment,
  useMarkPaymentFailed,
  useMarkPaymentPaid,
  useMarkPaymentProcessing,
  useMarkPaymentRefunded,
  usePayment,
} from "@/hooks/payment.hook";
import { formatCurrency, formatDateTime, formatPaymentStatus, getPaymentStatusTone } from "@/lib/formatters";

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const query = usePayment(paymentId);
  const payment = query.data;

  const [confirmDelete, setConfirmDelete] = useState(false);

  const markProcessing = useMarkPaymentProcessing();
  const markPaid = useMarkPaymentPaid();
  const markFailed = useMarkPaymentFailed();
  const markRefunded = useMarkPaymentRefunded();
  const cancel = useCancelPayment();
  const expire = useExpirePayment();
  const remove = useDeletePayment();

  if (query.isLoading) {
    return <AdminLayout title="Chi tiết thanh toán"><Skeleton className="h-60 w-full" /></AdminLayout>;
  }

  const status = payment?.status ?? 0;
  const lookup = { id: paymentId };

  const showProcessing = status === PaymentStatus.Pending;
  const showPaid = [PaymentStatus.Pending, PaymentStatus.Processing].includes(status);
  const showFailed = [PaymentStatus.Pending, PaymentStatus.Processing].includes(status);
  const showCancelled = [PaymentStatus.Pending, PaymentStatus.Processing].includes(status);
  const showExpired = [PaymentStatus.Pending, PaymentStatus.Processing].includes(status);
  const showRefunded = [PaymentStatus.Paid, PaymentStatus.Processing].includes(status);

  const busy =
    markProcessing.isPending ||
    markPaid.isPending ||
    markFailed.isPending ||
    markRefunded.isPending ||
    cancel.isPending ||
    expire.isPending;

  return (
    <AdminLayout title={`Thanh toán #${(paymentId ?? "").slice(0, 8).toUpperCase()}`}>
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.back()}>
        <ArrowLeft className="size-4" /> Quay lại
      </Button>
      <Card variant="outlined" padding="lg">
        <div className="flex items-center justify-between">
          <Badge variant={getPaymentStatusTone(status)}>
            {formatPaymentStatus(status)}
          </Badge>
          <span className="font-mono text-2xl font-bold tabular-nums text-primary">
            {formatCurrency(payment?.amount ?? "0")}
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Row label="Mã GD" value={payment?.id ?? "—"} />
          <Row label="Đơn hàng" value={payment?.orderId ?? "—"} />
          <Row label="Giao dịch" value={payment?.transactionId ?? "—"} />
          <Row label="Phương thức" value={payment?.paymentMethod ?? "VNPay"} />
          <Row label="Ngày" value={formatDateTime(payment?.createdAt)} />
          <Row label="Thanh toán lúc" value={formatDateTime(payment?.paidAt)} />
        </div>
      </Card>

      <Card variant="outlined" padding="lg" className="mt-4">
        <h3 className="text-sm font-semibold text-ink">Quản lý giao dịch</h3>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {showProcessing && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => markProcessing.mutate(lookup)}>
              <Loader className="size-3.5" />
              Đang xử lý
            </Button>
          )}
          {showPaid && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => markPaid.mutate(lookup)}>
              <CheckCircle2 className="size-3.5" />
              Đánh dấu thành công
            </Button>
          )}
          {showFailed && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => markFailed.mutate(lookup)}>
              <XCircle className="size-3.5" />
              Thất bại
            </Button>
          )}
          {showRefunded && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => markRefunded.mutate(lookup)}>
              <RotateCcw className="size-3.5" />
              Hoàn tiền
            </Button>
          )}
          {showCancelled && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => cancel.mutate(lookup)}>
              <Ban className="size-3.5" />
              Hủy
            </Button>
          )}
          {showExpired && (
            <Button variant="outline" size="sm" disabled={busy} onClick={() => expire.mutate(lookup)}>
              <Clock3 className="size-3.5" />
              Hết hạn
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="ml-auto"
            disabled={busy}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-3.5" />
            Xóa
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Xóa thanh toán?"
        description={`Giao dịch ${paymentId?.slice(0, 8).toUpperCase()} sẽ bị xóa khỏi hệ thống.`}
        confirmLabel="Xóa"
        confirmPending={remove.isPending}
        onConfirm={() =>
          remove.mutate({ id: paymentId }, { onSuccess: () => router.push("/admin/payments") })
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