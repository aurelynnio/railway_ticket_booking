"use client";

import { type FormEvent, useState } from "react";

import { Panel } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCreatePayment } from "@/hooks/payment.hook";

export function ManualPaymentForm() {
  const createPayment = useCreatePayment();
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [userId, setUserId] = useState("");
  const [transactionId, setTransactionId] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createPayment.mutate(
      {
        orderId: orderId.trim(),
        amount: amount.trim(),
        paymentMethod: paymentMethod.trim(),
        userId: userId.trim() || undefined,
        transactionId: transactionId.trim() || undefined,
      },
      {
        onSuccess: () => {
          setOrderId("");
          setAmount("");
          setPaymentMethod("BANK_TRANSFER");
          setUserId("");
          setTransactionId("");
        },
      },
    );
  }

  return (
    <Panel
      eyebrow="Ghi nhận"
      title="Tạo thanh toán thủ công"
      description="Dùng cho giao dịch ngoài VNPay đã được đối soát. Hệ thống sẽ tạo mã giao dịch nếu bạn để trống."
    >
      <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={submit}>
        <Input
          required
          placeholder="Order ID *"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
        />
        <Input
          required
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Số tiền *"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Select
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
        >
          <option value="BANK_TRANSFER">Chuyển khoản</option>
          <option value="CASH">Tiền mặt</option>
          <option value="CARD">Thẻ</option>
          <option value="OTHER">Khác</option>
        </Select>
        <Input
          placeholder="User ID (tùy chọn)"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
        />
        <Input
          placeholder="Transaction ID (tùy chọn)"
          value={transactionId}
          onChange={(event) => setTransactionId(event.target.value)}
        />
        <Button type="submit" disabled={createPayment.isPending}>
          {createPayment.isPending ? "Đang tạo..." : "Tạo thanh toán"}
        </Button>
      </form>
      {createPayment.isError ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          Không thể tạo thanh toán. Kiểm tra lại thông tin đơn hàng và quyền quản trị.
        </p>
      ) : null}
    </Panel>
  );
}
