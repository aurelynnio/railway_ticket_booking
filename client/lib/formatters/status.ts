import { OrderStatus } from "@/lib/api-types/order";
import { PaymentStatus } from "@/lib/api-types/payment";
import {
  getOrderStatusMeta,
  getPaymentStatusMeta,
  getTicketStatusMeta,
  type StatusTone,
} from "@/lib/i18n/status.vi";

export type { StatusTone } from "@/lib/i18n/status.vi";

/** Vietnamese label for an order status; pass cancelReason for reason-aware TTL-expiry handling. */
export function formatOrderStatus(
  status: OrderStatus | number,
  cancelReason?: string | null,
) {
  return getOrderStatusMeta(status, cancelReason).label;
}

export function formatTicketStatus(status: number) {
  return getTicketStatusMeta(status).label;
}

export function formatPaymentStatus(status: PaymentStatus | number) {
  return getPaymentStatusMeta(status).label;
}

export function getOrderStatusTone(
  status: OrderStatus | number,
  cancelReason?: string | null,
): StatusTone {
  return getOrderStatusMeta(status, cancelReason).tone;
}

export function getTicketStatusTone(status: number): StatusTone {
  return getTicketStatusMeta(status).tone;
}

export function getPaymentStatusTone(status: PaymentStatus | number): StatusTone {
  return getPaymentStatusMeta(status).tone;
}

/** "What happens next" copy for an order status (undefined when none). */
export function getOrderStatusNext(
  status: OrderStatus | number,
  cancelReason?: string | null,
): string | undefined {
  return getOrderStatusMeta(status, cancelReason).next;
}
