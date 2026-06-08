import { RouteScaffold } from "@/components/route-scaffold";

export default function OrdersPage() {
  return (
    <RouteScaffold
      title="Orders"
      description="Trang danh sach order tong quan. Phu hop de them filter, pagination, bulk action, hay admin/user list view sau nay."
      routePath="/orders"
      links={[
        {
          href: "/profile/orders",
          label: "Profile Orders",
          description: "Phien ban order list theo nguoi dung hien tai.",
        },
        {
          href: "/admin/orders",
          label: "Admin Orders",
          description: "Man hinh quan tri order toan he thong.",
        },
      ]}
      notes={[
        "Co the noi truc tiep vao GET /orders",
        "Nen dung cho table + filter + pagination",
      ]}
    />
  );
}
