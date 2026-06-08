import { RouteScaffold } from "@/components/route-scaffold";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RouteScaffold
      title={`Admin Order ${id}`}
      description="Trang chi tiet order cho admin/support. Phu hop de them timeline, payment state, refund action, passenger detail, va ghi chu noi bo."
      routePath={`/admin/orders/${id}`}
      links={[
        {
          href: `/orders/${id}`,
          label: "Global Order Detail",
          description: "Trang chi tiet order hien co.",
        },
        {
          href: "/admin/orders",
          label: "Back To Admin Orders",
          description: "Quay lai danh sach order admin.",
        },
      ]}
      notes={[
        "Noi phu hop de dung GET /orders/:orderId va /orders/:orderId/summary",
      ]}
    />
  );
}
