"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, CheckCircle2, Ticket } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

function VnpaySuccessContent() {
  const searchParams = useSearchParams();
  const txnRef = searchParams.get("txnRef") ?? "";
  const amount = searchParams.get("amount") ?? "0";
  const orderId = searchParams.get("orderId") ?? "";

  return (
    <AppShell
      title="Thanh toán thành công"
      description="Giao dịch thanh toán VNPay đã hoàn tất."
    >
      <div className="mx-auto max-w-xl">
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
            <div className="flex size-16 items-center justify-center border-2 border-success/30 bg-success/10 text-success">
              <CheckCircle2 className="size-8" strokeWidth={1.5} />
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                Xác nhận thanh toán
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                Thanh toán thành công
              </h1>
              <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
                Giao dịch của bạn đã hoàn tất. Vé điện tử sẽ được phát hành và có thể xem trong chi tiết đơn hàng.
              </p>
            </div>
          </div>

          <div className="border-t border-border bg-muted/30 px-6 py-6 sm:px-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                  Mã giao dịch
                </p>
                <p className="font-mono text-sm font-medium text-ink tabular-nums">
                  {txnRef || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                  Số tiền
                </p>
                <p className="font-mono text-base font-semibold text-ink tabular-nums">
                  {formatCurrency(Number(amount))}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-6 py-6 sm:flex-row sm:px-10">
            <Button asChild size="lg" className="flex-1">
              <Link href={orderId ? `/orders/${orderId}` : "/profile/orders"}>
                <Ticket className="size-4" />
                Xem vé điện tử
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild type="button" variant="outline" size="lg" className="flex-1">
              <Link href="/">
                Về trang chủ
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default function VnpaySuccessPage() {
  return (
    <Suspense>
      <VnpaySuccessContent />
    </Suspense>
  );
}
