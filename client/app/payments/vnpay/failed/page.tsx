"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell, Panel } from "@/components/app-shell";
import { DetailBlock, NoticeBox } from "@/components/railway-ui";
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
      <Panel title="Kết quả giao dịch">
        <div className="grid gap-4">
          <NoticeBox
            title="Thanh toán thất bại"
            description="Giao dịch chưa hoàn tất. Bạn có thể quay lại đơn hàng để thử lại hoặc kiểm tra nguyên nhân."
            tone="danger"
          />

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
