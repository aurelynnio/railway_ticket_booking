"use client";

import Link from "next/link";
import { XCircle, ArrowRight, RotateCcw } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PaymentFailedPage() {
  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-10">
        <Card variant="elevated" padding="lg" className="w-full text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-destructive-soft">
            <XCircle className="size-10 text-destructive" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold text-ink">
            Thanh toán thất bại
          </h1>
          <p className="mt-3 text-base text-ink-muted">
            Giao dịch không thành công. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="accent">
              <Link href="/profile/orders">
                <RotateCcw className="size-4" />
                Thử lại
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                Về trang chủ
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
