"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShoppingCart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/order.hook";
import { formatCurrency, formatDateTime, formatOrderStatus, getOrderStatusTone } from "@/lib/formatters";

export default function ProfileOrdersPage() {
  const [page, setPage] = useState(1);
  const query = useOrders({ page, limit: 10 });
  const orders = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <AppLayout>
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            <span className="h-px w-10 bg-accent" />
            Tài khoản
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Đơn hàng của tôi
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {query.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-4 h-16 w-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-16">
            <ShoppingCart className="mx-auto size-12 text-ink-subtle" />
            <p className="mt-4 font-display text-xl font-semibold text-ink">
              Chưa có đơn hàng
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Bắt đầu hành trình đầu tiên của bạn.
            </p>
            <Button asChild variant="accent" className="mt-5">
              <Link href="/search">
                Tìm chuyến
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="group block">
                <Card variant="outlined" padding="lg" interactive>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <ShoppingCart className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-ink">
                            #{order.id?.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge variant={getOrderStatusTone(order.status)}>
                            {formatOrderStatus(order.status)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-ink-muted">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-wider text-ink-muted">
                          Tổng tiền
                        </p>
                        <p className="font-display text-xl font-bold tabular-nums text-primary">
                          {formatCurrency(order.totalPrice ?? "0")}
                        </p>
                      </div>
                      <ArrowRight className="size-4 text-ink-subtle transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm text-ink-muted">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
