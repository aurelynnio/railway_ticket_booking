import { RouteScaffold } from "@/components/route-scaffold";

export default function AdminCreateTicketPage() {
  return (
    <RouteScaffold
      title="Create Ticket"
      description="Trang scaffold de tao ticket moi. Anh co the dat form ticket base, danh sach ticket item, va station/date picker tai day."
      routePath="/admin/tickets/new"
      links={[
        {
          href: "/admin/tickets",
          label: "Back To Admin Tickets",
          description: "Danh sach ticket trong khu vuc admin.",
        },
      ]}
      notes={[
        "Noi phu hop de dung POST /tickets",
        "Co the cho phep add nhieu ticket item truoc khi submit",
      ]}
    />
  );
}
