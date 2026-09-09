"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useAllNotifications } from "@/hooks/notification.hook";
import { formatDateTime } from "@/lib/formatters";

export default function AdminNotificationsPage() {
  const [type, setType] = useState("");
  const [page] = useState(1);
  const query = useAllNotifications({ type: type || undefined, page, limit: 20 });
  const notifications = query.data?.data ?? [];

  return (
    <AdminLayout
      title="Quản lý thông báo"
      description="Theo dõi thông báo hệ thống."
    >
      <Card variant="outlined" padding="none">
        <div className="bg-muted/30 p-4">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Tất cả loại</option>
            <option value="booking">Đặt vé</option>
            <option value="payment">Thanh toán</option>
            <option value="system">Hệ thống</option>
          </Select>
        </div>
        <div className="divide-y divide-border">
          {notifications.map((n) => (
            <div key={n.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{n.type}</Badge>
                  <span className="text-sm font-medium text-ink">{n.subject}</span>
                </div>
                <span className="text-xs text-ink-muted">
                  {formatDateTime(n.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-muted">{n.body}</p>
              {n.recipientEmail && (
                <p className="mt-1 text-xs text-ink-subtle">
                  Đến: {n.recipientEmail}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </AdminLayout>
  );
}
