import { RouteScaffold } from "@/components/route-scaffold";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RouteScaffold
      title={`Payment ${id}`}
      description="Trang chi tiet payment. Co the them transaction detail, callback log, refund state, va lien ket order sau nay."
      routePath={`/payments/${id}`}
      links={[
        {
          href: "/payments",
          label: "Payments List",
          description: "Danh sach payment tong quan.",
        },
        {
          href: `/admin/payments/${id}`,
          label: "Admin Payment Detail",
          description: "Phien ban admin cho payment nay.",
        },
      ]}
      notes={[
        "Cho phan transaction metadata, gateway response, refund info",
      ]}
    />
  );
}
