import { RouteScaffold } from "@/components/route-scaffold";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RouteScaffold
      title={`Admin User ${id}`}
      description="Trang chi tiet user cho admin. Co the dat tabs thong tin co ban, orders, tickets, payment history, va audit trail."
      routePath={`/admin/users/${id}`}
      links={[
        {
          href: `/users/${id}`,
          label: "User Detail",
          description: "Trang chi tiet user tong quat.",
        },
        {
          href: "/admin/users",
          label: "Back To Admin Users",
          description: "Quay lai danh sach user admin.",
        },
      ]}
      notes={[
        "Noi phu hop de dung GET /users/:userId va PATCH /users/:userId",
      ]}
    />
  );
}
