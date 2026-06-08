import { RouteScaffold } from "@/components/route-scaffold";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <RouteScaffold
      title={`User ${id}`}
      description="Trang chi tiet user. Co the dung cho admin/support xem profile, orders, tickets, va audit lien quan."
      routePath={`/users/${id}`}
      links={[
        {
          href: "/users",
          label: "Users List",
          description: "Danh sach user tong quat.",
        },
        {
          href: `/admin/users/${id}`,
          label: "Admin User Detail",
          description: "Ban quan tri chi tiet hon cho cung user nay.",
        },
      ]}
      notes={[
        "Phu hop de noi vao GET /users/:userId hoac GET /users/me tuy ngu canh",
      ]}
    />
  );
}
