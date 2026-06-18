import { AppShell, Panel } from "@/components/app-shell";
import { SectionHeading, SurfaceLink } from "@/components/railway-ui";

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
      <Panel
        title="Lối tắt thao tác"
        description="Mở nhanh từng màn hình khi cần kiểm tra dữ liệu hoặc tiếp tục một luồng đặt vé."
      >
        <div className="space-y-8">
          {routeGroups.map((group) => (
            <div key={group.title} className="space-y-4">
              <SectionHeading
                eyebrow="Điều hướng"
                title={group.title}
                description="Mỗi nhóm tập trung vào một phần việc riêng trong hệ thống."
              />
              <div className="grid gap-3 md:grid-cols-2">
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
        </div>
      </Panel>
    </AppShell>
  );
}
