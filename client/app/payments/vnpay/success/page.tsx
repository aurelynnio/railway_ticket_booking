"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight, Home } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PaymentSuccessPage() {
  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-10">
        <Card variant="elevated" padding="lg" className="w-full text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle className="size-10 text-success" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold text-ink">
            Thanh toán thành công
          </h1>
          <p className="mt-3 text-base text-ink-muted">
            Cảm ơn bạn đã đặt vé. Vé điện tử đã được gửi đến email của bạn.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild variant="accent">
              <Link href="/profile/tickets">
                Xem vé của tôi
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="size-4" />
                Về trang chủ
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
