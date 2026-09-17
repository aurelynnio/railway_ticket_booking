"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Tag,
  Clock,
  ExternalLink,
  Sparkles,
  Train,
  CreditCard,
  RotateCcw,
} from "lucide-react";
import {
  useMyNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/notification.hook";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthSession } from "@/hooks/auth.hook";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const session = useAuthSession();
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const { data: notifData, isLoading } = useMyNotifications(
    { page: 1, limit: 50 },
    Boolean(session.data),
  );

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notifData?.data ?? [];
  const filteredList =
    filter === "UNREAD"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "marketing_promotion":
        return <Sparkles className="size-5 text-amber-500" />;
      case "order_created":
        return <Train className="size-5 text-primary" />;
      case "payment_paid":
        return <CreditCard className="size-5 text-emerald-500" />;
      case "order_refunded":
        return <RotateCcw className="size-5 text-rose-500" />;
      default:
        return <Bell className="size-5 text-sky-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "marketing_promotion":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            🎉 Khuyến mãi
          </Badge>
        );
      case "order_created":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Đơn hàng
          </Badge>
        );
      case "payment_paid":
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
            Thanh toán
          </Badge>
        );
      case "order_refunded":
        return (
          <Badge variant="secondary" className="bg-rose-100 text-rose-800">
            Hoàn tiền
          </Badge>
        );
      default:
        return <Badge variant="secondary">Hệ thống</Badge>;
    }
  };

  if (!session.data && !session.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Bell className="mx-auto size-12 text-ink-muted opacity-40" />
        <h2 className="mt-4 text-xl font-bold text-ink">
          Vui lòng đăng nhập
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Bạn cần đăng nhập để xem danh sách thông báo và ưu đãi khuyến mãi của mình.
        </p>
        <Button asChild className="mt-6">
          <Link href="/login">Đăng nhập ngay</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Hộp thư Thông báo
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Cập nhật tình trạng chuyến đi, vé tàu và các chương trình khuyến mãi đặc biệt
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
            className="self-start sm:self-auto"
          >
            <CheckCheck className="mr-1.5 size-4 text-emerald-600" />
            Đánh dấu tất cả đã đọc ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex gap-2 border-b pb-2">
        <Button
          variant={filter === "ALL" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("ALL")}
        >
          Tất cả ({notifications.length})
        </Button>
        <Button
          variant={filter === "UNREAD" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("UNREAD")}
        >
          Chưa đọc ({unreadCount})
        </Button>
      </div>

      {/* Notification List */}
      <div className="mt-6 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl bg-card border shadow-sm"
              />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <Card className="border-dashed py-12 text-center">
            <CardContent>
              <Bell className="mx-auto size-10 text-ink-muted opacity-30" />
              <p className="mt-3 text-base font-medium text-ink">
                {filter === "UNREAD"
                  ? "Bạn đã đọc hết tất cả thông báo!"
                  : "Chưa có thông báo nào"}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Các thông tin về đơn hàng, chuyến tàu và khuyến mãi sẽ xuất hiện tại đây.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredList.map((notif) => (
            <Card
              key={notif.id}
              className={cn(
                "transition-all duration-200 hover:shadow-md",
                !notif.isRead
                  ? "border-l-4 border-l-primary bg-primary-soft/10"
                  : "opacity-90",
              )}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getTypeBadge(notif.type)}
                      <span className="text-xs text-ink-muted flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(notif.createdAt).toLocaleString("vi-VN")}
                      </span>
                      {!notif.isRead && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </div>

                    <h3 className="mt-1.5 text-base font-semibold text-ink">
                      {notif.subject}
                    </h3>

                    <p className="mt-1 whitespace-pre-line text-sm text-ink-muted leading-relaxed">
                      {notif.body}
                    </p>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t text-xs">
                      {notif.type === "marketing_promotion" ? (
                        <Link
                          href="/tickets"
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          <Tag className="size-3.5" />
                          Sử dụng ưu đãi ngay
                          <ExternalLink className="size-3" />
                        </Link>
                      ) : (
                        <Link
                          href="/orders"
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          Xem đơn hàng của bạn
                          <ExternalLink className="size-3" />
                        </Link>
                      )}

                      {!notif.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-ink-muted hover:text-ink"
                          onClick={() => markRead.mutate(notif.id)}
                          disabled={markRead.isPending}
                        >
                          Đánh dấu đã đọc
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

