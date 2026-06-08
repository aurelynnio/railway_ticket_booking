import { RouteScaffold } from "@/components/route-scaffold";

export default function AdminUsersPage() {
  return (
    <RouteScaffold
      title="Admin Users"
      description="Trang quan tri user. Thich hop de them table user, filter theo role/state, email lookup, va link sang order/ticket history."
      routePath="/admin/users"
      links={[
        {
          href: "/users",
          label: "Users",
          description: "Danh sach user tong quat.",
        },
        {
          href: "/profile",
          label: "My Profile",
          description: "Phia user-facing cua profile hien tai.",
        },
      ]}
      notes={[
        "Nen noi vao GET /users va GET /users/by-email",
      ]}
    />
  );
}
