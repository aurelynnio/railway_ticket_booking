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
      title={isAdminView ? "User operations detail" : "User detail"}
      description="Chi tiet account, kem order va payment gan day de support doi soat hoac debug session theo user."
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title={user?.name ?? user?.username ?? "User profile"}
          description="Thong tin co ban den tu `GET /users/:id`, huu ich cho support va lien ket sang profile cap nhat."
        >
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Identity"
              title={user?.email ?? "Dang tai user"}
              description="Neu user co profile field it, man hinh nay van giu layout gon bang cach day phan dong luc sang orders va payments."
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
            title="Recent orders"
            description="Lay order gan day cua user de support nhanh trong cung mot view."
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
                  User nay chua co order nao trong viewport truy van.
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel
            title="Recent payments"
            description="Top payment theo user de tiep tuc doi soat transaction khi can."
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
                  Chua co payment nao gan voi user nay.
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel
            title="Quick jump"
            description="Duong dan nhanh den cac view lien quan khac."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <SurfaceLink
                href="/users"
                title="Back to directory"
                description="Quay lai danh sach user tong."
              />
              <SurfaceLink
                href="/profile"
                title="Open current profile"
                description="Doi chieu voi profile session hien tai tren client."
              />
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
