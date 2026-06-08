import { RouteScaffold } from "@/components/route-scaffold";

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RouteScaffold
      title={`Admin Payment ${id}`}
      description="Trang chi tiet payment cho admin. Phu hop de them callback payload, payment gateway raw response, refund state va doi soat."
      routePath={`/admin/payments/${id}`}
      links={[
        {
          href: `/payments/${id}`,
          label: "Payment Detail",
          description: "Trang tong quat cua payment nay.",
        },
        {
          href: "/admin/payments",
          label: "Back To Admin Payments",
          description: "Quay lai danh sach payment admin.",
        },
      ]}
      notes={[
        "Noi phu hop de dat log stream, metadata, risk flags, support actions",
      ]}
    />
  );
}
