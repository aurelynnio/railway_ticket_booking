import { OrderStatus } from "@/lib/api-types/order";
import { PaymentStatus } from "@/lib/api-types/payment";

export type StatusTone = "brand" | "positive" | "warning" | "danger" | "muted";

export function formatOrderStatus(status: OrderStatus | number) {
  switch (status) {
    case OrderStatus.Draft:
      return "Draft";
    case OrderStatus.PendingPayment:
      return "Pending Payment";
    case OrderStatus.Paid:
      return "Paid";
    case OrderStatus.Confirmed:
      return "Confirmed";
    case OrderStatus.TicketIssued:
      return "Ticket Issued";
    case OrderStatus.Cancelled:
      return "Cancelled";
    case OrderStatus.Expired:
      return "Expired";
    case OrderStatus.Refunded:
      return "Refunded";
    default:
      return `Status ${status}`;
  }
}

export function formatTicketStatus(status: number) {
  return status === 1 ? "Published" : "Draft";
}

export function formatPaymentStatus(status: PaymentStatus | number) {
  switch (status) {
    case PaymentStatus.Pending:
      return "Pending";
    case PaymentStatus.Processing:
      return "Processing";
    case PaymentStatus.Paid:
      return "Paid";
    case PaymentStatus.Failed:
      return "Failed";
    case PaymentStatus.Cancelled:
      return "Cancelled";
    case PaymentStatus.Expired:
      return "Expired";
    default:
      return `Status ${status}`;
  }
}

export function getOrderStatusTone(status: OrderStatus | number): StatusTone {
  switch (status) {
    case OrderStatus.Paid:
    case OrderStatus.Confirmed:
    case OrderStatus.TicketIssued:
      return "positive";
    case OrderStatus.PendingPayment:
    case OrderStatus.Draft:
      return "warning";
    case OrderStatus.Cancelled:
    case OrderStatus.Expired:
    case OrderStatus.Refunded:
      return "danger";
    default:
      return "muted";
  }
}

export function getTicketStatusTone(status: number): StatusTone {
  return status === 1 ? "positive" : "warning";
}

export function getPaymentStatusTone(
  status: PaymentStatus | number,
): StatusTone {
  switch (status) {
    case PaymentStatus.Paid:
      return "positive";
    case PaymentStatus.Processing:
    case PaymentStatus.Pending:
      return "warning";
    case PaymentStatus.Failed:
    case PaymentStatus.Cancelled:
    case PaymentStatus.Expired:
      return "danger";
    default:
      return "muted";
  }
}
