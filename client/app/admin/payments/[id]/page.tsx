"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayment } from "@/hooks/payment.hook";
import { formatCurrency, formatDateTime, formatPaymentStatus, getPaymentStatusTone } from "@/lib/formatters";

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const query = usePayment(paymentId);
  const payment = query.data;

  if (query.isLoading) {
    return <AdminLayout title="Chi tiết thanh toán"><Skeleton className="h-60 w-full" /></AdminLayout>;
  }

  const status = payment?.status ?? 0;

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
        <div className="mt-6 space-y-3 rounded-lg bg-muted/30 p-4">
          <Row label="Mã GD" value={payment?.id ?? "—"} />
          <Row label="Đơn hàng" value={payment?.orderId ?? "—"} />
          <Row label="Phương thức" value={payment?.paymentMethod ?? "VNPay"} />
          <Row label="Ngày" value={formatDateTime(payment?.createdAt)} />
        </div>
      </Card>
    </AdminLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
