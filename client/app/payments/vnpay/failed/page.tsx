"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell, Panel } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

function VnpayFailedContent() {
  const searchParams = useSearchParams();
  const txnRef = searchParams.get("txnRef") ?? "";
  const message = searchParams.get("message") ?? "Giao dịch không thành công";

  return (
    <AppShell
      title="Thanh toán thất bại"
      description="Giao dịch thanh toán VNPay chưa hoàn tất."
    >
      <Panel title="Kết quả giao dịch">
        <div className="grid gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
            <svg
              className="h-5 w-5 text-rose-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <p className="font-medium text-rose-800">Thanh toán thất bại</p>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã giao dịch</span>
              <span className="font-medium text-foreground">{txnRef}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lý do</span>
              <span className="font-medium text-foreground">{message}</span>
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

export default function VnpayFailedPage() {
  return (
    <Suspense>
      <VnpayFailedContent />
    </Suspense>
  );
}
