"use client";
import { usePathname, useParams } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import { MetaGrid, SectionHeading, SurfaceLink, compactId } from "@/components/railway-ui";
import { useOrders } from "@/hooks/order.hook";
import { usePaymentsByUserId } from "@/hooks/payment.hook";
import { useUser } from "@/hooks/user.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export default function UserDetailPage() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const userId = typeof params.id === "string" ? params.id : "";
  const isAdminView = pathname.startsWith("/admin");

  const userQuery = useUser(userId);
  const ordersQuery = useOrders({ page: 1, limit: 6, userId }, Boolean(userId));
  const paymentsQuery = usePaymentsByUserId(
    { userId, page: 1, limit: 6 },
    Boolean(userId),
  );

  const user = userQuery.data;
  const orders = ordersQuery.data?.data ?? [];
  const payments = paymentsQuery.data?.data ?? [];

  return (
    <AppShell
      title={isAdminView ? "Chi tiết người dùng" : "Thông tin người dùng"}
      description="Xem hồ sơ tài khoản cùng đơn hàng và thanh toán gần đây để hỗ trợ đối soát."
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title={user?.name ?? user?.username ?? "User profile"}
          description="Thông tin cơ bản của tài khoản và các mốc cập nhật gần nhất."
        >
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Identity"
              title={user?.email ?? "Đang tải người dùng"}
              description="Dùng thông tin này để đối chiếu với đơn hàng và thanh toán liên quan."
            />

            {user ? (
              <MetaGrid
                items={[
                  { label: "User ID", value: compactId(user.id) },
                  { label: "Username", value: user.username ?? "N/A" },
                  { label: "Name", value: user.name ?? "N/A" },
                  { label: "Email", value: user.email ?? "N/A" },
                  {
                    label: "Created",
                    value: formatDateTime(
                      typeof user.createdAt === "string" ? user.createdAt : null,
                    ),
                  },
                  {
                    label: "Updated",
                    value: formatDateTime(
                      typeof user.updatedAt === "string" ? user.updatedAt : null,
                    ),
                  },
                ]}
                columns={3}
              />
            ) : null}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel
            title="Đơn gần đây"
            description="Các đơn gần nhất của người dùng để hỗ trợ kiểm tra nhanh."
          >
            <div className="grid gap-3">
              {orders.map((order) => (
                <SurfaceLink
                  key={order.id}
                  href={`/orders/${order.id}`}
                  title={order.ticketTitle}
                  description={`${compactId(order.id)} • ${formatCurrency(order.totalPrice)} • ${formatDateTime(order.updatedAt)}`}
                />
              ))}
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Người dùng này chưa có đơn nào trong truy vấn hiện tại.
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel
            title="Thanh toán gần đây"
            description="Các khoản thanh toán gần nhất gắn với người dùng."
          >
            <div className="grid gap-3">
              {payments.map((payment) => (
                <SurfaceLink
                  key={payment.id}
                  href={`/payments/${payment.id}`}
                  title={compactId(payment.transactionId)}
                  description={`${formatCurrency(Number(payment.amount))} • Order ${compactId(payment.orderId)} • ${formatDateTime(payment.updatedAt)}`}
                />
              ))}
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có thanh toán nào gắn với người dùng này.
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel
            title="Đi nhanh"
            description="Đường dẫn tới các màn hình liên quan."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <SurfaceLink
                href="/users"
                title="Về danh sách người dùng"
                description="Quay lại danh sách người dùng tổng."
              />
              <SurfaceLink
                href="/profile"
                title="Mở hồ sơ hiện tại"
                description="Đối chiếu với tài khoản đang đăng nhập."
              />
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
