"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function VnpayFailedContent() {
  const searchParams = useSearchParams();
  const txnRef = searchParams.get("txnRef") ?? "";
  const message = searchParams.get("message") ?? "Giao dịch không thành công";
  const orderId = searchParams.get("orderId") ?? "";

  return (
    <AppShell
      title="Thanh toán thất bại"
      description="Giao dịch thanh toán VNPay chưa hoàn tất."
    >
      <div className="mx-auto max-w-xl">
        <Card padding="none" className="overflow-hidden">
          <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
            <div className="flex size-16 items-center justify-center border-2 border-destructive/30 bg-destructive/10 text-destructive">
              <AlertCircle className="size-8" strokeWidth={1.5} />
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-destructive">
                Giao dịch không thành công
              </p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                Thanh toán thất bại
              </h1>
              <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
                Giao dịch chưa hoàn tất. Bạn có thể quay lại đơn hàng để thử lại hoặc kiểm tra thông tin thanh toán.
              </p>
            </div>
          </div>

          <div className="border-t border-border bg-muted/30 px-6 py-6 sm:px-10">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  Lý do
                </p>
                <p className="text-sm text-ink">
                  {message}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <p className="text-xs leading-relaxed text-ink-muted">
                <span className="font-semibold text-ink">Lưu ý:</span> Nếu tiền đã bị trừ khỏi tài khoản nhưng giao dịch báo lỗi, vui lòng đợi trong vòng 5-10 phút để hệ thống tự động hoàn tiền, hoặc liên hệ hỗ trợ.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-6 py-6 sm:flex-row sm:px-10">
            <Button asChild size="lg" className="flex-1">
              <Link href={orderId ? `/orders/${orderId}` : "/profile/orders"}>
                <RefreshCw className="size-4" />
                Thử lại thanh toán
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

export default function VnpayFailedPage() {
  return (
    <Suspense>
      <VnpayFailedContent />
    </Suspense>
  );
}
