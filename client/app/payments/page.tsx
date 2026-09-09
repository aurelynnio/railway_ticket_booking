"use client";

import Link from "next/link";
import { Wallet, ArrowRight } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayments } from "@/hooks/payment.hook";
import { formatCurrency, formatDateTime, formatPaymentStatus, getPaymentStatusTone } from "@/lib/formatters";

export default function PaymentsPage() {
  const query = usePayments({ page: 1, limit: 20 });
  const payments = query.data?.data ?? [];

  return (
    <AppLayout>
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-semibold text-ink">Thanh toán</h1>
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
        ) : payments.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center py-16">
            <Wallet className="mx-auto size-12 text-ink-subtle" />
            <p className="mt-4 font-display text-xl font-semibold text-ink">Chưa có giao dịch</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((p) => (
              <Link key={p.id} href={`/payments/${p.id}`} className="group block">
                <Card variant="outlined" padding="lg" interactive>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium">#{p.id?.slice(0, 8).toUpperCase()}</span>
                      <Badge variant={getPaymentStatusTone(p.status)}>
                        {formatPaymentStatus(p.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-semibold">{formatCurrency(p.amount ?? "0")}</span>
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
