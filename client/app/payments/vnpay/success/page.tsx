"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell, Panel } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

function VnpaySuccessContent() {
  const searchParams = useSearchParams();
  const txnRef = searchParams.get("txnRef") ?? "";
  const amount = searchParams.get("amount") ?? "0";

  return (
    <AppShell
      title="Thanh toán thành công"
      description="Giao dịch thanh toán VNPay đã hoàn tất."
    >
      <Panel title="Kết quả giao dịch">
        <div className="grid gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <svg
              className="h-5 w-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="font-medium text-emerald-800">
              Thanh toán thành công
            </p>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã giao dịch</span>
              <span className="font-medium text-foreground">{txnRef}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Số tiền</span>
              <span className="font-medium text-foreground">
                {formatCurrency(Number(amount))}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/profile/orders">
              <Button variant="outline">Xem đơn hàng</Button>
            </Link>
            <Link href="/">
              <Button>Về trang chủ</Button>
            </Link>
          </div>
        </div>
      </Panel>
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
