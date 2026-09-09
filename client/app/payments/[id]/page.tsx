"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayment } from "@/hooks/payment.hook";
import { formatCurrency, formatDateTime, formatPaymentStatus, getPaymentStatusTone } from "@/lib/formatters";

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const query = usePayment(paymentId);
  const payment = query.data;

  if (query.isLoading) {
    return <AppLayout><div className="p-10"><Skeleton className="h-60 w-full" /></div></AppLayout>;
  }

  const status = payment?.status ?? 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Quay lại
        </Button>
        <Card variant="outlined" padding="lg">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Chi tiết thanh toán #{payment?.id?.slice(0, 8).toUpperCase()}
          </h1>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between"><span className="text-sm text-ink-muted">Trạng thái</span><Badge variant={getPaymentStatusTone(status)}>{formatPaymentStatus(status)}</Badge></div>
            <div className="flex justify-between"><span className="text-sm text-ink-muted">Số tiền</span><span className="font-mono font-semibold">{formatCurrency(payment?.amount ?? "0")}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-muted">Phương thức</span><span className="text-sm">{payment?.paymentMethod ?? "VNPay"}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-muted">Ngày</span><span className="text-sm">{formatDateTime(payment?.createdAt)}</span></div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
