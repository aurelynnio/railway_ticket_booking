import { RouteScaffold } from "@/components/route-scaffold";

export default function AdminOrdersPage() {
  return (
    <RouteScaffold
      title="Admin Orders"
      description="Trang quan tri orders. Co the dung cho moderation, support, refund queue, ticket issue flow, va order lifecycle tracking."
      routePath="/admin/orders"
      links={[
        {
          href: "/orders",
          label: "Orders",
          description: "Danh sach order tong quat.",
        },
        {
          href: "/profile/orders",
          label: "Profile Orders",
          description: "View phia user.",
        },
      ]}
      notes={[
        "Nen noi vao GET /orders",
        "Co the co action mark-paid, confirm, issue-ticket, cancel, refund",
      ]}
    />
  );
}
