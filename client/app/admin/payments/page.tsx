import { RouteScaffold } from "@/components/route-scaffold";

export default function AdminPaymentsPage() {
  return (
    <RouteScaffold
      title="Admin Payments"
      description="Trang quan tri payment. Dung de anh noi tiep settlement, reconciliation, webhook log, va refund processing."
      routePath="/admin/payments"
      links={[
        {
          href: "/payments",
          label: "Payments",
          description: "View tong quat cua payment resources.",
        },
        {
          href: "/admin",
          label: "Admin Dashboard",
          description: "Quay lai dashboard admin.",
        },
      ]}
      notes={[
        "Backend payment hien con mong, route nay tao san de anh mo rong sau",
      ]}
    />
  );
}
