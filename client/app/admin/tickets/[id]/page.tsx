import { RouteScaffold } from "@/components/route-scaffold";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RouteScaffold
      title={`Admin Ticket ${id}`}
      description="Trang chi tiet ticket cho admin. Phu hop de sua hanh trinh, publish state, stock, sale window, va navigate den ticket item."
      routePath={`/admin/tickets/${id}`}
      links={[
        {
          href: `/tickets/${id}`,
          label: "Public Ticket Detail",
          description: "Trang chi tiet phia user-facing.",
        },
        {
          href: `/admin/tickets/${id}/items/sample-item`,
          label: "Sample Ticket Item Route",
          description: "Vi du route item con de anh noi logic sau.",
        },
      ]}
      notes={[
        "Noi phu hop de dung GET/PATCH /tickets/:ticketId",
        "Nen co tabs: overview, items, seat map, sale window, audit",
      ]}
    />
  );
}
