import { RouteScaffold } from "@/components/route-scaffold";

export default async function ProfileOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RouteScaffold
      title={`Profile Order ${id}`}
      description="Trang chi tiet order trong khu vuc profile. Co the tach rieng UX user-facing khoi trang /orders/[id] tong quat."
      routePath={`/profile/orders/${id}`}
      links={[
        {
          href: "/orders",
          label: "Global Orders List",
          description: "Danh sach order theo route tong quat.",
        },
        {
          href: `/orders/${id}`,
          label: "Global Order Detail",
          description: "Chi tiet order theo route tong quat.",
        },
        {
          href: "/profile/orders",
          label: "Back To Profile Orders",
          description: "Quay lai danh sach order cua user.",
        },
      ]}
      notes={[
        "Thich hop cho timeline user-facing, invoice, cancel/refund status",
      ]}
    />
  );
}
