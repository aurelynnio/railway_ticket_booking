"use client";

import { useState } from "react";
import { Bell, BellRing, CheckCircle, Mail } from "lucide-react";

import { Panel } from "@/components/shell/app-shell";
import {
  EmptyState,
  PaginationBar,
  StatusBadge,
} from "@/components/ui/railway-ui";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useAuthSession } from "@/hooks/auth.hook";
import { useMyNotifications } from "@/hooks/notification.hook";
import { formatDateTime } from "@/lib/formatters";

function getNotificationIcon(type: string) {
  switch (type) {
    case "order_created":
      return <BellRing className="size-4 text-warning" strokeWidth={1.75} />;
    case "payment_paid":
      return <CheckCircle className="size-4 text-success" strokeWidth={1.75} />;
    case "password_reset":
      return <Mail className="size-4 text-primary" strokeWidth={1.75} />;
    case "user_registered":
      return <Bell className="size-4 text-primary" strokeWidth={1.75} />;
    default:
      return <Bell className="size-4 text-ink-muted" strokeWidth={1.75} />;
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

export default function NotificationsPage() {
  const sessionQuery = useAuthSession();
  const [page, setPage] = useState(1);

  const query = useMyNotifications(
    { page, limit: 10 },
    Boolean(sessionQuery.data),
  );

  const notifications = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  const sent = notifications.filter((n) => n.status === "sent").length;
  const failed = notifications.filter((n) => n.status === "failed").length;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="outlined" padding="lg" className="gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Tổng thông báo
          </p>
          <p className="font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
            {pagination?.total ?? 0}
          </p>
          <p className="text-sm leading-relaxed text-ink-muted">Tổng số thông báo đã nhận.</p>
        </Card>
        <Card variant="outlined" padding="lg" className="gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Đã gửi
          </p>
          <p className="font-display text-3xl font-semibold tracking-tight text-success tabular-nums">
            {sent}
          </p>
          <p className="text-sm leading-relaxed text-ink-muted">Gửi thành công trang này.</p>
        </Card>
        <Card variant="outlined" padding="lg" className="gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Thất bại
          </p>
          <p className="font-display text-3xl font-semibold tracking-tight text-destructive tabular-nums">
            {failed}
          </p>
          <p className="text-sm leading-relaxed text-ink-muted">Gặp lỗi trong trang này.</p>
        </Card>
      </div>

      <Panel
        eyebrow="Nhật ký"
        title="Thông báo"
        description="Lịch sử các email đã được hệ thống gửi liên quan đến tài khoản, đơn hàng và thanh toán."
      >
        <div className="space-y-5">
          {!sessionQuery.data && !sessionQuery.isLoading ? (
            <EmptyState
              title="Cần đăng nhập"
              description="Bạn cần đăng nhập để xem lịch sử thông báo."
              href="/login"
              cta="Mở đăng nhập"
            />
          ) : null}

          {query.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-sm border border-border bg-muted/40"
                />
              ))}
            </div>
          ) : null}

          {!query.isLoading && !query.isError && notifications.length === 0 && sessionQuery.data ? (
            <EmptyState
              title="Chưa có thông báo"
              description="Khi có đơn hàng mới, thanh toán hoặc sự kiện tài khoản, thông báo sẽ xuất hiện ở đây."
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
                variant="outlined"
                padding="none"
                id={`notification-${notification.id}`}
              >
                <CardContent className="p-0">
                  <div className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto]">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-border bg-primary-soft/50">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink">
                          {notification.subject}
                        </p>
                        <Badge variant="secondary">
                          {formatNotificationType(notification.type)}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
                        {notification.body}
                      </p>
                      <p className="mono text-xs tabular-nums text-ink-subtle">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-start sm:justify-end">
                      <StatusBadge
                        label={notification.status === "sent" ? "Đã gửi" : "Thất bại"}
                        tone={notification.status === "sent" ? "success" : "destructive"}
                      />
                    </div>
                  </div>
                </CardContent>
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
    </>
  );
}
