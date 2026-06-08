import { RouteScaffold } from "@/components/route-scaffold";

export default function PaymentsPage() {
  return (
    <RouteScaffold
      title="Payments"
      description="Trang danh sach payment. Hien backend payment chua expose nhieu endpoint, nhung route scaffold da co de anh tiep tuc noi sau."
      routePath="/payments"
      links={[
        {
          href: "/orders",
          label: "Orders",
          description: "Payment thuong di kem order flow.",
        },
        {
          href: "/admin/payments",
          label: "Admin Payments",
          description: "Phien ban quan tri cua payment listing.",
        },
      ]}
      notes={[
        "Nen dung cho payment history, payment status, reconciliation",
      ]}
    />
  );
}
