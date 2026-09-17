"use client";

import { VnpayReturnScreen } from "@/components/payment/vnpay-return-screen";

export default function PaymentFailedPage() {
  return <VnpayReturnScreen mode="failed" />;
}