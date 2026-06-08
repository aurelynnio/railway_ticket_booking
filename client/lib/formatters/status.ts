import { OrderStatus } from "@/lib/api-types/order";

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
