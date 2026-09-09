"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyNotifications } from "@/hooks/notification.hook";
import { formatDateTime } from "@/lib/formatters";

export default function ProfileNotificationsPage() {
  const [page] = useState(1);
  const query = useMyNotifications({ page, limit: 20 });
  const notifications = query.data?.data ?? [];

  return (
    <AppLayout>
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            <span className="h-px w-10 bg-accent" />
            Tài khoản
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Thông báo
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {query.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-3 h-3 w-full" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-16">
            <Bell className="mx-auto size-12 text-ink-subtle" />
            <p className="mt-4 font-display text-xl font-semibold text-ink">
              Không có thông báo
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Thông báo mới sẽ xuất hiện ở đây.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card
                key={n.id}
                variant="outlined"
                padding="md"
                className={n.status === "unread" ? "border-primary/30 bg-primary-soft/30" : ""}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={
                      n.status === "unread"
                        ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                        : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-ink-muted"
                    }
                  >
                    <Bell className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">{n.subject}</h3>
                      {n.status === "unread" && (
                        <Badge variant="accent" className="text-[10px]">
                          Mới
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                      {n.body}
                    </p>
                    <p className="mt-2 text-xs text-ink-subtle">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
