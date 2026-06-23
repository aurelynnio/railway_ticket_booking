"use client";

import { usePathname, useParams } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import { MetaGrid, SectionHeading, StatusBadge, compactId } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import {
  useCancelPayment,
  useDeletePayment,
  useExpirePayment,
  useMarkPaymentFailed,
  useMarkPaymentPaid,
  useMarkPaymentProcessing,
  usePayment,
} from "@/hooks/payment.hook";
import {
  formatCurrency,
  formatDateTime,
  formatPaymentStatus,
  getPaymentStatusTone,
} from "@/lib/formatters";

export default function PaymentDetailPage() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const paymentId = typeof params.id === "string" ? params.id : "";
  const isAdminView = pathname.startsWith("/admin");

  const paymentQuery = usePayment(paymentId);
  const markProcessing = useMarkPaymentProcessing();
  const markPaid = useMarkPaymentPaid();
  const markFailed = useMarkPaymentFailed();
  const cancelPayment = useCancelPayment();
  const expirePayment = useExpirePayment();
  const deletePayment = useDeletePayment();

  const payment = paymentQuery.data;

  return (
    <AppShell
      title={isAdminView ? "Payment operations" : "Payment detail"}
      description="Ban ghi chi tiet tu `payments-service`, dung de soat transaction, tinh trang thanh toan va cac action can thiep tay khi can."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!payment}
            onClick={() => markProcessing.mutate({ id: paymentId })}
          >
            Đang xử lý
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!payment}
            onClick={() => markPaid.mutate({ id: paymentId })}
          >
            Thanh toán + phát hành
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!payment}
            onClick={() => markFailed.mutate({ id: paymentId })}
          >
            Thất bại
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={!payment}
            onClick={() => cancelPayment.mutate({ id: paymentId })}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!payment}
            onClick={() => expirePayment.mutate({ id: paymentId })}
          >
            Hết hạn
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!payment}
            onClick={() => deletePayment.mutate({ id: paymentId })}
          >
            Xoá
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title={payment ? compactId(payment.id) : "Payment detail"}
          description="Trung tam thong tin giao dich, noi ket noi order, user va transaction id."
        >
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Transaction"
              title={payment ? formatCurrency(Number(payment.amount)) : "Dang tai payment"}
              description="Amount duoc luu duoi dang BigInt chuoi hoa trong API type, can format ve VND de doc nhanh."
              action={
                payment ? (
                  <StatusBadge
                    label={formatPaymentStatus(payment.status)}
                    tone={getPaymentStatusTone(payment.status)}
                  />
                ) : null
              }
            />

            {payment ? (
              <MetaGrid
                items={[
                  { label: "Payment ID", value: compactId(payment.id) },
                  { label: "Transaction", value: compactId(payment.transactionId) },
                  { label: "Order ID", value: compactId(payment.orderId) },
                  { label: "User ID", value: compactId(payment.userId) },
                  { label: "Method", value: payment.paymentMethod },
                  { label: "Created", value: formatDateTime(payment.createdAt) },
                  { label: "Updated", value: formatDateTime(payment.updatedAt) },
                  { label: "Paid at", value: formatDateTime(payment.paidAt) },
                ]}
                columns={3}
              />
            ) : null}

            {paymentQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Dang tai payment...</p>
            ) : null}
            {paymentQuery.isError ? (
              <p className="text-sm text-rose-700">
                Khong tai duoc payment. Kiem tra ID hoac trang thai service.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="State machine"
          description="Action paid gio phat event `payment.paid` tu payments-service, sau do orders-service tu dong advance order lifecycle o background."
        >
          <MetaGrid
            items={[
              {
                label: "Processing",
                value: markProcessing.isPending ? "Dang cap nhat..." : "San sang",
              },
              {
                label: "Mark paid",
                value: markPaid.isPending ? "Dang cap nhat..." : "San sang",
              },
              {
                label: "Mark failed",
                value: markFailed.isPending ? "Dang cap nhat..." : "San sang",
              },
              {
                label: "Cancel",
                value: cancelPayment.isPending ? "Dang cap nhat..." : "San sang",
              },
              {
                label: "Expire",
                value: expirePayment.isPending ? "Dang cap nhat..." : "San sang",
              },
              {
                label: "Delete",
                value: deletePayment.isPending ? "Dang cap nhat..." : "San sang",
              },
              {
                label: "Deleted at",
                value: payment?.deletedAt ? formatDateTime(payment.deletedAt) : "Active",
              },
            ]}
            columns={3}
          />
        </Panel>
      </div>
    </AppShell>
  );
}
