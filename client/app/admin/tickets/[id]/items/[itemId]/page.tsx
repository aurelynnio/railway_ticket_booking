"use client";

import { useParams } from "next/navigation";
import { AdminLayout } from "@/components/layout";
import { Card } from "@/components/ui/card";

export default function AdminTicketItemPage() {
  const params = useParams();
  return (
    <AdminLayout title="Chi tiết hạng vé" description={`Mã: ${params.itemId}`}>
      <Card variant="outlined" padding="lg">
        <p className="text-sm text-ink-muted">
          Quản lý hạng vé cho chuyến {params.id}.
        </p>
      </Card>
    </AdminLayout>
  );
}
