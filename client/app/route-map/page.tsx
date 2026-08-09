import { AppShell } from "@/components/app-shell";
import { RouteLine } from "@/components/route-line";
import { DetailBlock, SectionHeading, SurfaceLink } from "@/components/railway-ui";

const routeGroups = [
  {
    title: "Hành khách",
    items: [
      ["/search", "Tìm hành trình"],
      ["/tickets", "Tồn vé"],
      ["/orders", "Danh sách đơn"],
      ["/payments", "Thanh toán"],
    ],
  },
  {
    title: "Tài khoản",
    items: [
      ["/login", "Đăng nhập"],
      ["/register", "Tạo tài khoản"],
      ["/profile", "Hồ sơ"],
      ["/profile/tickets", "Vé đã phát hành"],
    ],
  },
  {
    title: "Điều phối",
    items: [
      ["/admin", "Bảng điều phối"],
      ["/admin/tickets", "Quản lý vé"],
      ["/admin/orders", "Quản lý đơn"],
      ["/admin/users", "Người dùng"],
      ["/admin/payments", "Đối soát thanh toán"],
    ],
  },
] as const;

export default function RouteMapPage() {
  return (
    <AppShell
      title="Bản đồ màn hình"
      description="Tổng hợp các khu vực chính của hệ thống để chuyển nhanh giữa đặt vé, tài khoản và điều phối."
    >
      <RouteLine compact className="-my-1" aria-hidden />
      <section className="grid gap-4 md:grid-cols-3">
        {routeGroups.map((group) => (
          <DetailBlock
            key={group.title}
            label={group.title}
            value={String(group.items.length)}
            hint="Số màn hình chính trong nhóm này"
          />
        ))}
      </section>

      <section className="space-y-8">
        {routeGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <SectionHeading
              eyebrow="Điều hướng"
              title={group.title}
              description="Mỗi nhóm tập trung vào một phần việc riêng trong hệ thống."
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map(([href, title]) => (
                <SurfaceLink
                  key={href}
                  href={href}
                  title={title}
                  description={`Mở ${href} để tiếp tục thao tác.`}
                />
              ))}
            </div>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
