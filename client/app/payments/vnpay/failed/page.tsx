"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell, Panel } from "@/components/app-shell";
import { Illustration } from "@/components/illustrations";
import { DetailBlock } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
      <Panel title="Kết quả giao dịch">
        <div className="grid gap-4">
          <Card
            variant="flat"
            className="flex flex-col items-start gap-3 border border-destructive/30 bg-destructive/5 px-5 py-6"
          >
            <Illustration
              name="error-state"
              size="md"
              tone="danger"
              label="Thanh toán thất bại"
            />
            <div className="space-y-1">
              <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
                Thanh toán thất bại
              </h3>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Giao dịch chưa hoàn tất. Bạn có thể quay lại đơn hàng để thử lại
                hoặc kiểm tra nguyên nhân.
              </p>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailBlock label="Mã giao dịch" value={txnRef || "N/A"} />
            <DetailBlock label="Lý do" value={message} />
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

export default function VnpayFailedPage() {
  return (
    <Suspense>
      <VnpayFailedContent />
    </Suspense>
  );
}
