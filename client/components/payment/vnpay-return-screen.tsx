"use client";

import Link from "next/link";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  RefreshCw,
  Ticket,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateVnpayPayment,
  usePaymentsByOrderId,
} from "@/hooks/payment.hook";
import { PaymentStatus } from "@/lib/api-types/payment";
import type { PaymentDto } from "@/lib/api-types/payment";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatDateTime } from "@/lib/formatters/date";
import {
  formatPaymentStatus,
  getPaymentStatusTone,
} from "@/lib/formatters/status";

/**
 * Màn hình kết quả VNPay dùng chung cho trang success/failed.
 *
 * VNPay redirect user về gateway (`GET /payments/vnpay/return`), gateway verify
 * checksum rồi mới redirect sang đây kèm `txnRef`, `orderId`, `paymentId`.
 * Trang này KHÔNG tin các tham số trên URL: nó gọi lại API để lấy trạng thái
 * thật của giao dịch trong DB (nguồn sự thật là IPN server-to-server).
 */

/** Khoảng cách giữa các lần tự kiểm tra lại trạng thái giao dịch. */
const POLL_INTERVAL_MS = 2500;
/** Số lần tự kiểm tra tối đa (~20s với nhịp trên) trước khi dừng và chờ người dùng. */
const MAX_POLLS = 8;

type VnpayReturnMode = "success" | "failed";

type PaymentOutcome = "success" | "processing" | "failed" | "cancelled";

/** Nhóm trạng thái payment thành 4 kết cục để UI quyết định cách hiển thị. */
function getPaymentOutcome(status: PaymentStatus | number): PaymentOutcome {
  switch (status) {
    case PaymentStatus.Paid:
      return "success";
    case PaymentStatus.Pending:
    case PaymentStatus.Processing:
      return "processing";
    case PaymentStatus.Cancelled:
    case PaymentStatus.Refunded:
      return "cancelled";
    case PaymentStatus.Failed:
    case PaymentStatus.Expired:
    default:
      return "failed";
  }
}

/** So khớp `vnp_TxnRef` (có thể thiếu gạch nối) với transactionId đã lưu. */
function sameTransaction(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return (
    a.replace(/-/g, "").toLowerCase() === b.replace(/-/g, "").toLowerCase()
  );
}

/** Chọn payment của đúng giao dịch vừa trả về; nếu không khớp thì lấy mới nhất. */
function pickRelevantPayment(
  payments: PaymentDto[] | undefined,
  txnRef?: string | null,
): PaymentDto | null {
  if (!payments?.length) return null;

  const matched = payments.find((payment) =>
    sameTransaction(payment.transactionId, txnRef),
  );
  if (matched) return matched;

  return [...payments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
}

export function VnpayReturnScreen({ mode }: { mode: VnpayReturnMode }) {
  return (
    <AppLayout>
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-10">
        <Suspense fallback={<VnpayReturnFallback />}>
          <VnpayReturnContent mode={mode} />
        </Suspense>
      </div>
    </AppLayout>
  );
}

function VnpayReturnFallback() {
  return (
    <Card variant="elevated" padding="lg" className="w-full text-center">
      <Skeleton className="mx-auto size-20 rounded-full" />
      <Skeleton className="mx-auto mt-6 h-8 w-2/3" />
      <Skeleton className="mx-auto mt-3 h-4 w-full" />
      <Skeleton className="mx-auto mt-2 h-4 w-5/6" />
    </Card>
  );
}

function VnpayReturnContent({ mode }: { mode: VnpayReturnMode }) {
  const params = useSearchParams();
  const orderId = params.get("orderId") || undefined;
  const txnRef = params.get("txnRef");
  const vnpayMessage = params.get("message");

  const retryPayment = useCreateVnpayPayment();

  const paymentsQuery = usePaymentsByOrderId(orderId, {
    // IPN có thể về sau redirect vài giây → tự kiểm tra lại tới khi giao dịch có
    // kết cục, hoặc dừng sau MAX_POLLS lần để không gọi API vô hạn khi VNPay
    // không gửi IPN (khi đó người dùng bấm "Kiểm tra lại").
    refetchInterval: (query) => {
      const latest = pickRelevantPayment(query.state.data, txnRef);
      if (latest && getPaymentOutcome(latest.status) !== "processing") {
        return false;
      }
      // Đếm cả lần lỗi: nếu API lỗi liên tục thì dataUpdateCount không tăng và
      // vòng poll sẽ không bao giờ dừng.
      const attempts =
        query.state.dataUpdateCount + query.state.errorUpdateCount;
      return attempts >= MAX_POLLS ? false : POLL_INTERVAL_MS;
    },
  });

  const payment = pickRelevantPayment(paymentsQuery.data, txnRef);
  const outcome = payment ? getPaymentOutcome(payment.status) : null;

  const onRetryPayment = () => {
    if (!orderId) return;
    retryPayment.mutate(
      { orderId },
      {
        onSuccess: (result) => {
          if (result.paymentUrl) {
            window.location.href = result.paymentUrl;
            return;
          }
          toast.error("Không tạo được liên kết thanh toán. Vui lòng thử lại sau.");
        },
        onError: () => {
          toast.error(
            "Không tạo được liên kết thanh toán. Đơn có thể đã hết hạn hoặc đã thanh toán.",
          );
        },
      },
    );
  };

  if (paymentsQuery.isLoading) {
    return (
      <StatusCard
        icon={<Loader2 className="size-10 animate-spin text-info" />}
        iconClassName="bg-info-soft"
        title="Đang đối chiếu giao dịch"
        description="Hệ thống đang kiểm tra kết quả thanh toán với VNPay…"
      />
    );
  }

  // Không có orderId trên URL, hoặc không tải được dữ liệu thanh toán.
  if (!payment) {
    const vnpayReportedFailure = mode === "failed";
    const description = vnpayReportedFailure
      ? [
          vnpayMessage || "VNPay báo giao dịch không thành công.",
          orderId
            ? "Bạn kiểm tra chi tiết đơn hàng để xem trạng thái mới nhất."
            : "Hệ thống chưa đối chiếu được giao dịch này với đơn hàng nào.",
        ].join(" ")
      : !orderId
        ? "Đường dẫn không kèm mã đơn hàng nên chưa thể kiểm tra kết quả. Bạn xem trạng thái trong danh sách đơn hàng của mình."
        : paymentsQuery.isError
          ? "Không tải được trạng thái thanh toán. Vui lòng đăng nhập lại và kiểm tra trong đơn hàng của bạn."
          : "Đơn hàng này chưa có bản ghi thanh toán nào để đối chiếu.";

    return (
      <StatusCard
        icon={<AlertTriangle className="size-10 text-warning" />}
        iconClassName="bg-warning-soft"
        title={
          vnpayReportedFailure
            ? "Giao dịch không thành công"
            : "Chưa đối chiếu được giao dịch"
        }
        description={description}
      >
        <Actions>
          <Button asChild variant="accent">
            <Link href={orderId ? `/orders/${orderId}` : "/profile/orders"}>
              <Ticket className="size-4" />
              {orderId ? "Chi tiết đơn hàng" : "Đơn hàng của tôi"}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="size-4" />
              Về trang chủ
            </Link>
          </Button>
        </Actions>
      </StatusCard>
    );
  }

  if (outcome === "processing") {
    return (
      <StatusCard
        icon={<Clock className="size-10 text-info" />}
        iconClassName="bg-info-soft"
        title="Đang xác nhận với VNPay"
        description="Hệ thống đã nhận được yêu cầu thanh toán và đang chờ VNPay xác nhận (thường chỉ vài giây). Trang sẽ tự cập nhật."
      >
        <PaymentDetails
          payment={payment}
          txnRef={txnRef}
          orderId={orderId}
        />
        <Actions>
          <Button
            type="button"
            variant="accent"
            disabled={paymentsQuery.isFetching}
            onClick={() => void paymentsQuery.refetch()}
          >
            {paymentsQuery.isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Kiểm tra lại
          </Button>
          <Button asChild variant="outline">
            <Link href={`/orders/${orderId}`}>
              <ArrowRight className="size-4" />
              Chi tiết đơn hàng
            </Link>
          </Button>
        </Actions>
      </StatusCard>
    );
  }

  if (outcome === "success") {
    return (
      <StatusCard
        icon={<CheckCircle2 className="size-10 text-success" />}
        iconClassName="bg-success-soft"
        title="Thanh toán thành công"
        description={
          mode === "failed"
            ? "VNPay báo giao dịch không thành công nhưng hệ thống ghi nhận đã thanh toán. Vé điện tử sẽ được phát hành và gửi tới email của bạn."
            : "Thanh toán đã được ghi nhận. Vé điện tử sẽ được phát hành và gửi tới email của bạn trong ít phút."
        }
      >
        <PaymentDetails payment={payment} txnRef={txnRef} orderId={orderId} />
        <Actions>
          <Button asChild variant="accent">
            <Link href="/profile/tickets">
              <Ticket className="size-4" />
              Xem vé của tôi
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/orders/${orderId}`}>
              <ArrowRight className="size-4" />
              Chi tiết đơn hàng
            </Link>
          </Button>
        </Actions>
      </StatusCard>
    );
  }

  // failed / cancelled: giao dịch đã có kết cục nhưng không phải thành công.
  const canRetry = mode === "failed" && payment.status === PaymentStatus.Failed;

  return (
    <StatusCard
      icon={<XCircle className="size-10 text-destructive" />}
      iconClassName="bg-destructive-soft"
      title={mode === "failed" ? "Thanh toán thất bại" : "Giao dịch chưa hoàn tất"}
      description={
        vnpayMessage ||
        "Giao dịch không thành công. Bạn có thể kiểm tra lại đơn hàng hoặc thử thanh toán lại."
      }
    >
      <PaymentDetails payment={payment} txnRef={txnRef} orderId={orderId} />
      <Actions>
        {canRetry && (
          <Button
            type="button"
            variant="accent"
            disabled={retryPayment.isPending}
            onClick={onRetryPayment}
          >
            {retryPayment.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Thanh toán lại
          </Button>
        )}
        <Button asChild variant={canRetry ? "outline" : "accent"}>
          <Link href={`/orders/${orderId}`}>
            <ArrowRight className="size-4" />
            Chi tiết đơn hàng
          </Link>
        </Button>
        {!canRetry && (
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="size-4" />
              Về trang chủ
            </Link>
          </Button>
        )}
      </Actions>
    </StatusCard>
  );
}

function StatusCard({
  icon,
  iconClassName,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Card variant="elevated" padding="lg" className="w-full text-center">
      <div
        className={`mx-auto flex size-20 items-center justify-center rounded-full ${iconClassName}`}
      >
        {icon}
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">
        {title}
      </h1>
      <p className="mt-3 text-base text-ink-muted">{description}</p>
      {children}
    </Card>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
      {children}
    </div>
  );
}

function PaymentDetails({
  payment,
  txnRef,
  orderId,
}: {
  payment: PaymentDto;
  txnRef?: string | null;
  orderId?: string;
}) {
  return (
    <dl className="mt-6 space-y-2 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-left text-sm">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-ink-muted">Trạng thái</dt>
        <dd>
          <Badge variant={getPaymentStatusTone(payment.status)}>
            {formatPaymentStatus(payment.status)}
          </Badge>
        </dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-ink-muted">Mã giao dịch</dt>
        <dd className="font-mono text-xs text-ink">
          {txnRef || payment.transactionId}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt className="text-ink-muted">Số tiền</dt>
        <dd className="font-semibold text-ink">
          {formatCurrency(payment.amount)}
        </dd>
      </div>
      {payment.paidAt && (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-muted">Thời điểm thanh toán</dt>
          <dd className="text-ink">{formatDateTime(payment.paidAt)}</dd>
        </div>
      )}
      {orderId && (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-muted">Đơn hàng</dt>
          <dd>
            <Link
              href={`/orders/${orderId}`}
              className="font-semibold text-primary hover:text-primary-hover"
            >
              {orderId.slice(0, 8).toUpperCase()}
            </Link>
          </dd>
        </div>
      )}
    </dl>
  );
}