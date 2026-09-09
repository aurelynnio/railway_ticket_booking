"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder } from "@/hooks/order.hook";
import { formatCurrency, formatDateTime, formatOrderStatus, getOrderStatusTone } from "@/lib/formatters";

export default function ProfileOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  const query = useOrder(orderId);
  const order = query.data;

  if (query.isLoading) {
    return <AppLayout><div className="p-10"><Skeleton className="h-60 w-full" /></div></AppLayout>;
  }

  const status = order?.status ?? 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Quay lại
        </Button>
        <Card variant="outlined" padding="lg">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-semibold text-ink">
              Đơn hàng #{order?.id?.slice(0, 8).toUpperCase()}
            </h1>
            <Badge variant={getOrderStatusTone(status)}>
              {formatOrderStatus(status)}
            </Badge>
          </div>
          <div className="mt-6 space-y-3 border-t border-border pt-5">
            <Row label="Ngày tạo" value={formatDateTime(order?.createdAt)} />
            <Row label="Tàu" value={order?.trainNumber ?? "—"} />
            <Row label="Hành trình" value={`${order?.departureStationName ?? "—"} → ${order?.arrivalStationName ?? "—"}`} />
            <Row label="Tổng tiền" value={formatCurrency(order?.totalPrice ?? "0")} highlight />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={highlight ? "font-display text-xl font-bold text-primary" : "text-sm font-medium text-ink"}>
        {value}
      </span>
    </div>
  );
}
