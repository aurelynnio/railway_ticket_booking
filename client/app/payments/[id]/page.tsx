"use client";

import { usePathname, useParams } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import {
  DetailBlock,
  MetaGrid,
  NoticeBox,
  SectionHeading,
  StatusBadge,
  compactId,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import {
  useCancelPayment,
  useCreateVnpayPayment,
  useDeletePayment,
  useExpirePayment,
  useMarkPaymentFailed,
  useMarkPaymentPaid,
  useMarkPaymentProcessing,
  usePayment,
} from "@/hooks/payment.hook";
import { PaymentStatus } from "@/lib/api-types";
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
  const createVnpayPayment = useCreateVnpayPayment();
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
        ) : payment &&
          payment.paymentMethod === "VNPAY" &&
          ![PaymentStatus.Paid, PaymentStatus.Cancelled].includes(payment.status) ? (
          <Button
            type="button"
            disabled={createVnpayPayment.isPending}
            onClick={() => {
              createVnpayPayment.mutate(
                {
                  orderId: payment.orderId,
                  orderInfo: `Thanh toan don hang ${payment.orderId.slice(0, 8)}`,
                },
                {
                  onSuccess: (result) => {
                    window.location.assign(result.paymentUrl);
                  },
                },
              );
            }}
          >
            {createVnpayPayment.isPending
              ? "Đang chuyển sang VNPay..."
              : "Thanh toán qua VNPay"}
          </Button>
        ) : null
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
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
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailBlock
              label="Đang xử lý"
              value={markProcessing.isPending ? "Đang cập nhật..." : "Sẵn sàng"}
            />
            <DetailBlock
              label="Đánh dấu đã trả"
              value={markPaid.isPending ? "Đang cập nhật..." : "Sẵn sàng"}
            />
            <DetailBlock
              label="Đánh dấu lỗi"
              value={markFailed.isPending ? "Đang cập nhật..." : "Sẵn sàng"}
            />
            <DetailBlock
              label="Huỷ"
              value={cancelPayment.isPending ? "Đang cập nhật..." : "Sẵn sàng"}
            />
            <DetailBlock
              label="Hết hạn"
              value={expirePayment.isPending ? "Đang cập nhật..." : "Sẵn sàng"}
            />
            <DetailBlock
              label="Xoá"
              value={deletePayment.isPending ? "Đang cập nhật..." : "Sẵn sàng"}
            />
            <DetailBlock
              label="Trạng thái lưu trữ"
              value={payment?.deletedAt ? formatDateTime(payment.deletedAt) : "Đang hoạt động"}
            />
          </div>
          {!isAdminView && payment && payment.status !== PaymentStatus.Paid ? (
            <div className="mt-4">
              <NoticeBox
                title="Thanh toán chưa hoàn tất"
                description="Nếu giao dịch trước đó bị gián đoạn, bạn có thể tạo lại phiên thanh toán VNPay từ nút hành động."
                tone="warning"
              />
            </div>
          ) : null}
        </Panel>
      </div>
    </AppShell>
  );
}
