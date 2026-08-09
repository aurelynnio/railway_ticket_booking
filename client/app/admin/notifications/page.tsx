"use client";

import { useState } from "react";
import { Bell, BellRing, CheckCircle, Mail } from "lucide-react";

import { AppShell, Panel } from "@/components/app-shell";
import { EmptyState, PaginationBar, StatCard, StatusBadge } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
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
      return <Bell className="size-4 text-ink-muted" />;
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
    >
      <div className="grid gap-4 md:grid-cols-3">
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

      <Panel
        eyebrow="Nhật ký"
        title="Thông báo hệ thống"
        description="Tất cả thông báo email từ hệ thống, bao gồm đặt vé, thanh toán và tài khoản."
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                Lọc theo loại
              </p>
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
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
            >
              Làm mới
            </Button>
          </div>

          {query.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse border border-border bg-secondary/50"
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
              illustration="error-state"
              illustrationTone="danger"
            />
          ) : null}

          <div className="space-y-0">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                variant="outlined"
                padding="md"
                className="rounded-none border-x-0 border-t-0 last:border-b first:border-t"
                id={`admin-notification-${notification.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-ink">
                        {notification.subject}
                      </p>
                      <span className="border border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                        {formatNotificationType(notification.type)}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-ink-muted">
                      To: {notification.recipientEmail} •{" "}
                      {notification.userId
                        ? `User: ${notification.userId.slice(0, 8)}...`
                        : "No user"}
                    </p>
                    <p className="line-clamp-1 text-sm text-ink-muted">
                      {notification.body}
                    </p>
                    <p className="font-mono text-xs tabular-nums text-ink-subtle">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-start shrink-0">
                    <StatusBadge
                      label={notification.status === "sent" ? "Đã gửi" : "Thất bại"}
                      tone={notification.status === "sent" ? "success" : "destructive"}
                    />
                  </div>
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
