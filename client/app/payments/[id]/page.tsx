"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { AppShell, Panel } from "@/components/app-shell";
import { RouteLine } from "@/components/route-line";
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
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={isAdminView ? "/admin/payments" : "/payments"}>
              <ChevronLeft className="size-3.5" aria-hidden />
              Quay lại
            </Link>
          </Button>
          {isAdminView ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!payment}
                onClick={() => markProcessing.mutate({ id: paymentId })}
              >
                Đang xử lý
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!payment}
                onClick={() => markPaid.mutate({ id: paymentId })}
              >
                Thanh toán + phát hành
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!payment}
                onClick={() => markFailed.mutate({ id: paymentId })}
              >
                Thất bại
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!payment}
                onClick={() => cancelPayment.mutate({ id: paymentId })}
              >
                Huỷ
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={!payment}
                onClick={() => expirePayment.mutate({ id: paymentId })}
              >
                Hết hạn
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={!payment}
                onClick={() => deletePayment.mutate({ id: paymentId })}
              >
                Xoá
              </Button>
            </>
          ) : payment &&
            payment.paymentMethod === "VNPAY" &&
            ![PaymentStatus.Paid, PaymentStatus.Cancelled].includes(payment.status) ? (
            <Button
              type="button"
              size="sm"
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
          ) : null}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          eyebrow="Giao dịch"
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
                  { label: "Mã thanh toán", value: <span className="mono">{compactId(payment.id)}</span> },
                  { label: "Mã giao dịch", value: <span className="mono">{compactId(payment.transactionId)}</span> },
                  { label: "Mã đơn", value: <span className="mono">{compactId(payment.orderId)}</span> },
                  { label: "Người dùng", value: <span className="mono">{compactId(payment.userId)}</span> },
                  { label: "Phương thức", value: payment.paymentMethod },
                  { label: "Ngày tạo", value: <span className="mono tabular-nums">{formatDateTime(payment.createdAt)}</span> },
                  { label: "Cập nhật", value: <span className="mono tabular-nums">{formatDateTime(payment.updatedAt)}</span> },
                  { label: "Thanh toán lúc", value: <span className="mono tabular-nums">{formatDateTime(payment.paidAt)}</span> },
                ]}
                columns={3}
              />
            ) : null}

            <div className="py-1">
              <RouteLine compact aria-hidden />
            </div>

            {paymentQuery.isLoading ? (
              <p className="text-sm text-ink-muted">Đang tải thanh toán...</p>
            ) : null}
            {paymentQuery.isError ? (
              <p className="text-sm text-destructive">
                Không tải được thanh toán. Vui lòng thử lại sau.
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel
          eyebrow="Trạng thái"
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
