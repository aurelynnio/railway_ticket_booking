import { RouteScaffold } from "@/components/route-scaffold";

export default function AdminTicketsPage() {
  return (
    <RouteScaffold
      title="Admin Tickets"
      description="Trang quan tri ticket. Phu hop de them table, filter, create, publish/unpublish, stock va sale window."
      routePath="/admin/tickets"
      links={[
        {
          href: "/admin/tickets/new",
          label: "Create Ticket",
          description: "Trang tao ticket moi.",
        },
        {
          href: "/tickets",
          label: "Public Tickets",
          description: "Danh sach ticket phia user-facing.",
        },
      ]}
      notes={[
        "Nen noi vao GET /tickets",
        "Co the them bulk publish, edit, delete, seat-map actions",
      ]}
    />
  );
}
