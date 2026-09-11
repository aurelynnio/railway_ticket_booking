"use client";

import {
  Ticket,
  ShoppingCart,
  Users,
  Wallet,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useTickets } from "@/hooks/ticket.hook";
import { useOrders } from "@/hooks/order.hook";
import { usePayments } from "@/hooks/payment.hook";
import { useListUsers } from "@/hooks/user.hook";
import { formatCurrency, formatDateTime, formatOrderStatus, getOrderStatusTone } from "@/lib/formatters";

export default function AdminPage() {
  const tickets = useTickets({ page: 1, limit: 100 });
  const orders = useOrders({ page: 1, limit: 100 });
  const payments = usePayments({ page: 1, limit: 100 });
  const users = useListUsers(1, 100);

  const isRefreshing =
    tickets.isFetching || orders.isFetching || payments.isFetching || users.isFetching;

  const refreshAll = () => {
    tickets.refetch();
    orders.refetch();
    payments.refetch();
    users.refetch();
  };

  const stats = [
    {
      label: "Vé tàu",
      value: tickets.data?.pagination?.total ?? 0,
      icon: Ticket,
      tone: "primary" as const,
    },
    {
      label: "Đơn hàng",
      value: orders.data?.pagination?.total ?? 0,
      icon: ShoppingCart,
      tone: "accent" as const,
    },
    {
      label: "Người dùng",
      value: users.data?.pagination?.total ?? 0,
      icon: Users,
      tone: "gold" as const,
    },
    {
      label: "Thanh toán",
      value: payments.data?.pagination?.total ?? 0,
      icon: Wallet,
      tone: "primary" as const,
    },
  ];

  const recentOrders = (orders.data?.data ?? []).slice(0, 5);

  return (
    <AdminLayout
      title="Bảng điều khiển"
      description="Giám sát tổng quan hệ thống đặt vé tàu."
      actions={
        <Button variant="outline" size="sm" onClick={refreshAll} disabled={isRefreshing}>
          <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Đồng bộ
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} variant="outlined" padding="lg">
            <div className="flex items-center justify-between">
              <span
                className={`flex size-11 items-center justify-center rounded-xl ${
                  s.tone === "primary"
                    ? "bg-primary-soft text-primary"
                    : s.tone === "accent"
                      ? "bg-accent-soft text-accent"
                      : "bg-gold-soft text-gold"
                }`}
              >
                <s.icon className="size-5" />
              </span>
              <TrendingUp className="size-4 text-ink-subtle" />
            </div>
            <p className="mt-4 font-display text-3xl font-bold tabular-nums text-ink">
              {tickets.isLoading ? "—" : s.value}
            </p>
            <p className="mt-1 text-sm text-ink-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">
            <ShoppingCart className="size-3.5" />
            Đơn gần đây
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="size-3.5" />
            Vé mới
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="size-3.5" />
            Người dùng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <Card variant="outlined" padding="none">
            {orders.isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-12 text-center text-sm text-ink-muted">
                Chưa có đơn hàng.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium text-ink">
                        #{order.id?.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge variant={getOrderStatusTone(order.status)}>
                        {formatOrderStatus(order.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm text-ink-muted">
                        {formatDateTime(order.createdAt)}
                      </span>
                      <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                        {formatCurrency(order.totalPrice ?? "0")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <Card variant="outlined" padding="none">
            <div className="divide-y divide-border">
              {(tickets.data?.data ?? []).slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {t.departureStationName ?? t.departureStationCode} → {t.arrivalStationName ?? t.arrivalStationCode}
                    </p>
                    <p className="text-xs text-ink-muted">
                      Tàu {t.trainNumber} · {formatDateTime(t.dateStart)}
                    </p>
                  </div>
                  <Badge variant={(t.ticketItems?.[0]?.stockAvailable ?? 0) > 0 ? "success" : "destructive"}>
                    {t.ticketItems?.reduce((s, i) => s + (i.stockAvailable ?? 0), 0) ?? 0} chỗ
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card variant="outlined" padding="none">
            <div className="divide-y divide-border">
              {(users.data?.data ?? []).slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                      {(u.email || "U")[0].toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{u.username ?? u.email}</p>
                      <p className="text-xs text-ink-muted">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-ink-muted">
                    {formatDateTime(u.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
