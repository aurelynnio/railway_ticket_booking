"use client";

import { useState } from "react";
import { Bell, BellRing, CheckCircle, Mail } from "lucide-react";

import { AppShell, Panel } from "@/components/app-shell";
import {
  EmptyState,
  FilterBar,
  PaginationBar,
  SectionHeading,
  StatCard,
  StatusBadge,
} from "@/components/railway-ui";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useAllNotifications } from "@/hooks/notification.hook";
import { formatDateTime } from "@/lib/formatters";

function getNotificationIcon(type: string) {
  switch (type) {
    case "order_created":
      return <BellRing className="size-4 text-warning" />;
    case "payment_paid":
      return <CheckCircle className="size-4 text-success" />;
    case "password_reset":
      return <Mail className="size-4 text-primary" />;
    case "user_registered":
      return <Bell className="size-4 text-primary" />;
    default:
      return <Bell className="size-4 text-muted-foreground" />;
  }
}

function formatNotificationType(type: string): string {
  switch (type) {
    case "order_created":
      return "Đơn hàng mới";
    case "payment_paid":
      return "Thanh toán thành công";
    case "password_reset":
      return "Đặt lại mật khẩu";
    case "user_registered":
      return "Chào mừng";
    default:
      return type;
  }
}

function getStatusTone(status: string): "positive" | "danger" | "muted" {
  if (status === "sent") return "positive";
  if (status === "failed") return "danger";
  return "muted";
}

const typeOptions = [
  { label: "Tất cả loại", value: "" },
  { label: "Đơn hàng", value: "order_created" },
  { label: "Thanh toán", value: "payment_paid" },
  { label: "Đặt lại mật khẩu", value: "password_reset" },
  { label: "Đăng ký", value: "user_registered" },
];

export default function AdminNotificationsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");

  const query = useAllNotifications({ page, limit: 20, type: type || undefined });

  const notifications = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  const sent = notifications.filter((n) => n.status === "sent").length;
  const failed = notifications.filter((n) => n.status === "failed").length;

  return (
    <AppShell
      title="Lịch sử thông báo"
      description="Toàn bộ nhật ký email đã được hệ thống gửi ra từ tất cả các sự kiện vận hành."
      actions={
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard
            label="Tổng thông báo"
            value={String(pagination?.total ?? 0)}
            helper="Tổng số thông báo trong hệ thống."
          />
          <StatCard
            label="Đã gửi"
            value={String(sent)}
            helper="Thông báo gửi thành công trong trang này."
          />
          <StatCard
            label="Thất bại"
            value={String(failed)}
            helper="Thông báo gặp lỗi trong trang này."
          />
        </div>
      }
    >
      <Panel
        title="Nhật ký thông báo"
        description="Tất cả thông báo email từ hệ thống, bao gồm đặt vé, thanh toán và tài khoản."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Admin view"
            title="Nhật ký thông báo hệ thống"
            description="Tìm kiếm và lọc theo loại thông báo để kiểm tra tình trạng gửi email."
          />

          <FilterBar>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Loại thông báo</p>
              <Select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </FilterBar>

          {query.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-muted/60"
                />
              ))}
            </div>
          ) : null}

          {!query.isLoading && !query.isError && notifications.length === 0 ? (
            <EmptyState
              title="Chưa có thông báo"
              description="Không có thông báo nào khớp với bộ lọc hiện tại."
            />
          ) : null}

          {query.isError ? (
            <EmptyState
              title="Không tải được thông báo"
              description="Không thể kết nối tới dịch vụ thông báo. Vui lòng thử lại sau."
            />
          ) : null}

          <div className="grid gap-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className="grid gap-4 px-5 py-4 sm:grid-cols-[auto_1fr_auto]"
                id={`admin-notification-${notification.id}`}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {notification.subject}
                    </p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {formatNotificationType(notification.type)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    To: {notification.recipientEmail} •{" "}
                    {notification.userId ? `User: ${notification.userId.slice(0, 8)}...` : "No user"}
                  </p>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {notification.body}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>

                <div className="flex items-start">
                  <StatusBadge
                    label={notification.status === "sent" ? "Đã gửi" : "Thất bại"}
                    tone={getStatusTone(notification.status)}
                  />
                </div>
              </Card>
            ))}
          </div>

          {pagination ? (
            <PaginationBar
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() =>
                setPage((current) =>
                  pagination.totalPages === 0
                    ? current
                    : Math.min(pagination.totalPages, current + 1),
                )
              }
            />
          ) : null}
        </div>
      </Panel>
    </AppShell>
  );
}
