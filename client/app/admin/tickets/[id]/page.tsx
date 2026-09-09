"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrainFront } from "lucide-react";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTicket } from "@/hooks/ticket.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const query = useTicket(params.id as string);
  const ticket = query.data;

  if (query.isLoading) {
    return <AdminLayout title="Chi tiết vé"><Skeleton className="h-60 w-full" /></AdminLayout>;
  }

  return (
    <AdminLayout title="Chi tiết vé tàu" description={ticket?.title ?? undefined}>
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.back()}>
        <ArrowLeft className="size-4" /> Quay lại
      </Button>
      <Card variant="outlined" padding="lg">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="font-mono">
            <TrainFront className="size-3" />
            {ticket?.trainNumber ?? "—"}
          </Badge>
          <Badge variant={(ticket?.ticketItems?.[0]?.stockAvailable ?? 0) > 0 ? "success" : "destructive"}>
            {ticket?.ticketItems?.reduce((s, i) => s + (i.stockAvailable ?? 0), 0) ?? 0} chỗ
          </Badge>
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink">
          {ticket?.departureStationName} → {ticket?.arrivalStationName}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Info label="Ga đi" value={`${ticket?.departureStationName} (${ticket?.departureStationCode})`} />
          <Info label="Ga đến" value={`${ticket?.arrivalStationName} (${ticket?.arrivalStationCode})`} />
          <Info label="Khởi hành" value={formatDateTime(ticket?.dateStart)} />
          <Info label="Đến" value={formatDateTime(ticket?.dateEnd)} />
          <Info label="Giá thấp nhất" value={formatCurrency(ticket?.ticketItems?.[0]?.priceOriginal ?? "0")} />
          <Info label="Trạng thái" value={ticket?.status === 1 ? "Đang mở bán" : "Tạm dừng"} />
        </div>
        {ticket?.journeyNote && (
          <div className="mt-6 rounded-lg bg-muted/30 p-4">
            <p className="text-sm font-semibold text-ink">Ghi chú</p>
            <p className="mt-2 text-sm text-ink-muted">{ticket.journeyNote}</p>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
