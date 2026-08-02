"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell, Panel } from "@/components/app-shell";
import { DetailBlock, NoticeBox } from "@/components/railway-ui";
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
      <Panel title="Kết quả giao dịch">
        <div className="grid gap-4">
          <NoticeBox
            title="Thanh toán thành công"
            description="Giao dịch VNPay đã hoàn tất và có thể tiếp tục sang trang đơn hàng."
            tone="positive"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailBlock label="Mã giao dịch" value={txnRef || "N/A"} />
            <DetailBlock label="Số tiền" value={formatCurrency(Number(amount))} />
          </div>

          <div className="flex gap-2">
            <Link href={orderId ? `/orders/${orderId}` : "/profile/orders"}>
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
