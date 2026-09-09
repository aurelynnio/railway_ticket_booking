"use client";

import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/order.hook";
import { formatCurrency, formatDateTime, formatOrderStatus, getOrderStatusTone } from "@/lib/formatters";

export default function OrdersPage() {
  const query = useOrders({ page: 1, limit: 20 });
  const orders = query.data?.data ?? [];

  return (
    <AppLayout>
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-semibold text-ink">Đơn hàng</h1>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {query.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <Skeleton className="h-5 w-1/3" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-16">
            <ShoppingCart className="mx-auto size-12 text-ink-subtle" />
            <p className="mt-4 font-display text-xl font-semibold text-ink">Chưa có đơn hàng</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="group block">
                <Card variant="outlined" padding="lg" interactive>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium">#{o.id?.slice(0, 8).toUpperCase()}</span>
                      <Badge variant={getOrderStatusTone(o.status)}>
                        {formatOrderStatus(o.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-semibold">{formatCurrency(o.totalPrice ?? "0")}</span>
                      <ArrowRight className="size-4 text-ink-subtle group-hover:text-primary" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
