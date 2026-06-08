import { RouteScaffold } from "@/components/route-scaffold";

export default function UsersPage() {
  return (
    <RouteScaffold
      title="Users"
      description="Trang danh sach user. Co the su dung cho admin list, support lookup, hay profile browsing noi bo."
      routePath="/users"
      links={[
        {
          href: "/profile",
          label: "My Profile",
          description: "Khu vuc profile hien tai cua user.",
        },
        {
          href: "/admin/users",
          label: "Admin Users",
          description: "Man hinh quan tri user chi tiet hon.",
        },
      ]}
      notes={[
        "Phu hop de noi vao GET /users",
        "Co the them search theo email va filter theo vai tro sau",
      ]}
    />
  );
}
