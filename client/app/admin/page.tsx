import { RouteScaffold } from "@/components/route-scaffold";

export default function AdminPage() {
  return (
    <RouteScaffold
      title="Admin"
      description="Dashboard vao khu vuc quan tri. Tu day anh co the chia cac module tickets, orders, users, payments."
      routePath="/admin"
      links={[
        {
          href: "/admin/tickets",
          label: "Admin Tickets",
          description: "Quan ly ticket va ticket item.",
        },
        {
          href: "/admin/orders",
          label: "Admin Orders",
          description: "Quan ly order toan he thong.",
        },
        {
          href: "/admin/users",
          label: "Admin Users",
          description: "Quan ly user toan he thong.",
        },
        {
          href: "/admin/payments",
          label: "Admin Payments",
          description: "Theo doi payment va doi soat.",
        },
      ]}
      notes={[
        "Noi phu hop de dat summary cards, charts, alert feed, operational actions",
      ]}
    />
  );
}
