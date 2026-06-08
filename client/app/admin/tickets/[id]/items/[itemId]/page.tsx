import { RouteScaffold } from "@/components/route-scaffold";

export default async function AdminTicketItemDetailPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;

  return (
    <RouteScaffold
      title={`Ticket Item ${itemId}`}
      description="Trang quan tri ticket item. Phu hop de sua coach, seat labels, stock, gia va sale window."
      routePath={`/admin/tickets/${id}/items/${itemId}`}
      links={[
        {
          href: `/admin/tickets/${id}`,
          label: "Back To Admin Ticket",
          description: "Quay lai ticket cha.",
        },
        {
          href: `/tickets/${id}`,
          label: "Public Ticket Detail",
          description: "Trang user-facing cua ticket nay.",
        },
      ]}
      notes={[
        "Noi phu hop de dung ticket-item endpoints duoi /tickets/:ticketId/ticket-items/:ticketItemId",
      ]}
    />
  );
}
