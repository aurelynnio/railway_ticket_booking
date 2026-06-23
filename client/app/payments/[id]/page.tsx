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
      title={isAdminView ? "Quản lý thanh toán" : "Chi tiết thanh toán"}
      description="Theo dõi số tiền, phương thức, mã giao dịch và trạng thái xử lý."
      actions={
        isAdminView ? (
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
        ) : null
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title={payment ? compactId(payment.id) : "Chi tiết thanh toán"}
          description="Thông tin giao dịch và liên kết với đơn hàng."
        >
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Giao dịch"
              title={payment ? formatCurrency(Number(payment.amount)) : "Đang tải thanh toán"}
              description="Số tiền và trạng thái mới nhất của giao dịch."
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
                  { label: "Mã thanh toán", value: compactId(payment.id) },
                  { label: "Mã giao dịch", value: compactId(payment.transactionId) },
                  { label: "Mã đơn", value: compactId(payment.orderId) },
                  { label: "Người dùng", value: compactId(payment.userId) },
                  { label: "Phương thức", value: payment.paymentMethod },
                  { label: "Ngày tạo", value: formatDateTime(payment.createdAt) },
                  { label: "Cập nhật", value: formatDateTime(payment.updatedAt) },
                  { label: "Thanh toán lúc", value: formatDateTime(payment.paidAt) },
                ]}
                columns={3}
              />
            ) : null}

            {paymentQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải thanh toán...</p>
            ) : null}
            {paymentQuery.isError ? (
              <p className="text-sm text-rose-700">
                Không tải được thanh toán. Vui lòng thử lại sau.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Trạng thái xử lý"
          description="Theo dõi thao tác đang chạy và trạng thái lưu trữ."
        >
          <MetaGrid
            items={[
              {
                label: "Đang xử lý",
                value: markProcessing.isPending ? "Đang cập nhật..." : "Sẵn sàng",
              },
              {
                label: "Đánh dấu đã trả",
                value: markPaid.isPending ? "Đang cập nhật..." : "Sẵn sàng",
              },
              {
                label: "Đánh dấu lỗi",
                value: markFailed.isPending ? "Đang cập nhật..." : "Sẵn sàng",
              },
              {
                label: "Huỷ",
                value: cancelPayment.isPending ? "Đang cập nhật..." : "Sẵn sàng",
              },
              {
                label: "Hết hạn",
                value: expirePayment.isPending ? "Đang cập nhật..." : "Sẵn sàng",
              },
              {
                label: "Xoá",
                value: deletePayment.isPending ? "Đang cập nhật..." : "Sẵn sàng",
              },
              {
                label: "Trạng thái lưu trữ",
                value: payment?.deletedAt ? formatDateTime(payment.deletedAt) : "Đang hoạt động",
              },
            ]}
            columns={3}
          />
        </Panel>
      </div>
    </AppShell>
  );
}
