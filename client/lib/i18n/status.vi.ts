/**
 * Vietnamese status language — single source of truth for order / payment /
 * ticket statuses (Direction B, §4 of docs/design/direction-b-design-system.md).
 *
 * Tones map to ui/badge variants: default | secondary | success | warning |
 * destructive | info. Statuses are never conveyed by color alone — components
 * pair these with icons and text.
 */

import { OrderStatus } from "@/lib/api-types/order";
import { PaymentStatus } from "@/lib/api-types/payment";

export type StatusTone =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "info";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
  /** Short "what happens next" copy (optional, shown as hint/tooltip). */
  next?: string;
}

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  [OrderStatus.Draft]: { label: "Nháp", tone: "secondary" },
  [OrderStatus.PendingPayment]: {
    label: "Chờ thanh toán",
    tone: "warning",
    next: "Thanh toán trước khi hết hạn để giữ chỗ.",
  },
  [OrderStatus.Paid]: {
    label: "Đã thanh toán",
    tone: "info",
    next: "Đơn đang được xác nhận.",
  },
  [OrderStatus.Confirmed]: {
    label: "Đã xác nhận",
    tone: "success",
    next: "Vé đang được phát hành.",
  },
  [OrderStatus.TicketIssued]: {
    label: "Đã phát hành vé",
    tone: "success",
    next: "Vé điện tử sẵn sàng để quét tại ga.",
  },
  [OrderStatus.Cancelled]: { label: "Đã huỷ", tone: "destructive" },
  [OrderStatus.Expired]: {
    label: "Hết hạn",
    tone: "warning",
    next: "Ghế đã được hoàn lại.",
  },
  [OrderStatus.Refunded]: { label: "Đã hoàn tiền", tone: "secondary" },
};

/**
 * Order TTL expiry (10 min) is delivered as Cancelled(5) with an "Unpaid order
 * expired…" reason — NOT Expired(6) (admin-only). The UI must surface it as
 * "Hết hạn thanh toán", distinct from a deliberate user/admin cancel.
 */
export const EXPIRY_REASON_PATTERN = /expired|hết hạn/i;

export function isExpiryCancellation(cancelReason?: string | null): boolean {
  return Boolean(cancelReason && EXPIRY_REASON_PATTERN.test(cancelReason));
}

export function getOrderStatusMeta(
  status: OrderStatus | number,
  cancelReason?: string | null,
): StatusMeta {
  const meta =
    ORDER_STATUS_META[status as OrderStatus] ??
    ({ label: `Trạng thái ${status}`, tone: "secondary" } as StatusMeta);

  if (
    status === OrderStatus.Cancelled &&
    isExpiryCancellation(cancelReason)
  ) {
    return {
      label: "Hết hạn thanh toán",
      tone: "warning",
      next: "Chưa thanh toán đúng hạn — ghế đã được hoàn lại. Đặt lại ngay.",
    };
  }

  return meta;
}

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  [PaymentStatus.Pending]: { label: "Chờ thanh toán", tone: "warning" },
  [PaymentStatus.Processing]: { label: "Đang xử lý", tone: "info" },
  [PaymentStatus.Paid]: { label: "Thành công", tone: "success" },
  [PaymentStatus.Failed]: { label: "Thất bại", tone: "destructive" },
  [PaymentStatus.Cancelled]: { label: "Đã huỷ", tone: "secondary" },
  [PaymentStatus.Expired]: { label: "Hết hạn", tone: "warning" },
  [PaymentStatus.Refunded]: {
    label: "Đã hoàn tiền",
    tone: "secondary",
    next: "Số tiền đã được xử lý hoàn tương ứng.",
  },
};

export function getPaymentStatusMeta(
  status: PaymentStatus | number,
): StatusMeta {
  return (
    PAYMENT_STATUS_META[status as PaymentStatus] ??
    ({ label: `Trạng thái ${status}`, tone: "secondary" } as StatusMeta)
  );
}

export const TICKET_STATUS_META: Record<number, StatusMeta> = {
  0: { label: "Nháp", tone: "secondary" },
  1: { label: "Đang mở bán", tone: "success" },
};

export function getTicketStatusMeta(status: number): StatusMeta {
  return (
    TICKET_STATUS_META[status] ??
    ({ label: `Trạng thái ${status}`, tone: "secondary" } as StatusMeta)
  );
}
