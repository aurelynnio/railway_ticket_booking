"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell, Panel } from "@/components/app-shell";
import { Illustration } from "@/components/illustrations";
import { DetailBlock } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
          <Card
            variant="flat"
            className="flex flex-col items-start gap-3 border border-success/30 bg-success/5 px-5 py-6"
          >
            <Illustration
              name="success-state"
              size="md"
              tone="positive"
              label="Thanh toán thành công"
            />
            <div className="space-y-1">
              <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
                Thanh toán thành công
              </h3>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Giao dịch VNPay đã hoàn tất và có thể tiếp tục sang trang đơn hàng.
              </p>
            </div>
          </Card>

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
