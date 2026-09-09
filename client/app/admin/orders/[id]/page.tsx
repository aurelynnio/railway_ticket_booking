"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder } from "@/hooks/order.hook";
import { formatCurrency, formatDateTime, formatOrderStatus, getOrderStatusTone } from "@/lib/formatters";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const query = useOrder(orderId);
  const order = query.data;

  if (query.isLoading) {
    return <AdminLayout title="Chi tiết đơn"><Skeleton className="h-60 w-full" /></AdminLayout>;
  }

  const status = order?.status ?? 0;

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
        <div className="mt-6 space-y-3 rounded-lg bg-muted/30 p-4">
          <Row label="Mã đơn" value={order?.id ?? "—"} />
          <Row label="Người dùng" value={order?.userId ?? "—"} />
          <Row label="Ngày tạo" value={formatDateTime(order?.createdAt)} />
          <Row label="Tàu" value={order?.trainNumber ?? "—"} />
          <Row label="Hành trình" value={`${order?.departureStationName ?? "—"} → ${order?.arrivalStationName ?? "—"}`} />
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
