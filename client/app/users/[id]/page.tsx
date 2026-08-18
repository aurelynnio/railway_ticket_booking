"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppShell, Panel } from "@/components/shell/app-shell";
import { FormField } from "@/components/ui/form-field";
import {
  NoticeBox,
  MetaGrid,
  SectionHeading,
  SurfaceLink,
  compactId,
} from "@/components/ui/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrders } from "@/hooks/order.hook";
import { usePaymentsByUserId } from "@/hooks/payment.hook";
import { useDeleteUser, useUpdateUser, useUser } from "@/hooks/user.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { emailField, requiredText } from "@/lib/validation";

const updateUserSchema = z.object({
  username: requiredText("Username"),
  email: emailField,
  name: z.string(),
});

export default function UserDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const userId = typeof params.id === "string" ? params.id : "";
  const isAdminView = pathname.startsWith("/admin");
  const detailPrefix = isAdminView ? "/admin" : "";

  const userQuery = useUser(userId, isAdminView);
  const ordersQuery = useOrders({ page: 1, limit: 6, userId }, isAdminView && Boolean(userId));
  const paymentsQuery = usePaymentsByUserId(
    { userId, page: 1, limit: 6 },
    isAdminView && Boolean(userId),
  );
  const updateUser = useUpdateUser(userId);
  const deleteUser = useDeleteUser();
  const form = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
    },
  });

  useEffect(() => {
    form.reset({
      username: userQuery.data?.username ?? "",
      email: userQuery.data?.email ?? "",
      name: userQuery.data?.name ?? "",
    });
  }, [form, userQuery.data?.email, userQuery.data?.name, userQuery.data?.username]);

  const user = userQuery.data;
  const orders = ordersQuery.data?.data ?? [];
  const payments = paymentsQuery.data?.data ?? [];

  return (
    <AppShell
      title={isAdminView ? "Chi tiết người dùng" : "Thông tin người dùng"}
      description="Xem hồ sơ tài khoản cùng đơn hàng và thanh toán gần đây để hỗ trợ đối soát."
      actions={
        isAdminView ? (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/users">
              <ChevronLeft className="size-3.5" aria-hidden />
              Quay lại danh sách
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-6">
          <Panel
            eyebrow="Hồ sơ"
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
                    { label: "User ID", value: <span className="mono">{compactId(user.id)}</span> },
                    { label: "Username", value: user.username ?? "N/A" },
                    { label: "Name", value: user.name ?? "N/A" },
                    { label: "Email", value: <span className="mono text-xs">{user.email ?? "N/A"}</span> },
                    { label: "Vai trò", value: user.role === 1 ? "Admin" : "User" },
                    {
                      label: "Created",
                      value: (
                        <span className="mono tabular-nums">
                          {formatDateTime(
                            typeof user.createdAt === "string" ? user.createdAt : null,
                          )}
                        </span>
                      ),
                    },
                    {
                      label: "Updated",
                      value: (
                        <span className="mono tabular-nums">
                          {formatDateTime(
                            typeof user.updatedAt === "string" ? user.updatedAt : null,
                          )}
                        </span>
                      ),
                    },
                  ]}
                  columns={3}
                />
              ) : null}

              {userQuery.isLoading ? (
                <p className="text-sm text-ink-muted">Đang tải người dùng...</p>
              ) : null}
              {userQuery.isError ? (
                <p className="text-sm text-destructive">
                  Không tải được người dùng. Vui lòng thử lại sau.
                </p>
              ) : null}
            </div>
          </Panel>

          {isAdminView ? (
            <Panel
              eyebrow="Cập nhật"
              title="Cập nhật người dùng"
              description="Chỉnh sửa thông tin cơ bản của tài khoản."
            >
              <form
                className="grid gap-3"
                onSubmit={form.handleSubmit((values) =>
                  updateUser.mutate({
                    username: values.username,
                    email: values.email,
                    name: values.name.trim() || undefined,
                  }),
                )}
              >
                <FormField
                  label="Username"
                  error={form.formState.errors.username?.message}
                >
                  <Input
                    placeholder="Username"
                    aria-invalid={Boolean(form.formState.errors.username)}
                    {...form.register("username")}
                  />
                </FormField>
                <FormField
                  label="Email"
                  error={form.formState.errors.email?.message}
                >
                  <Input
                    placeholder="Email"
                    aria-invalid={Boolean(form.formState.errors.email)}
                    {...form.register("email")}
                  />
                </FormField>
                <FormField
                  label="Tên hiển thị"
                  error={form.formState.errors.name?.message}
                >
                  <Input
                    placeholder="Tên hiển thị"
                    aria-invalid={Boolean(form.formState.errors.name)}
                    {...form.register("name")}
                  />
                </FormField>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={!userId || updateUser.isPending}
                >
                  {updateUser.isPending ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
                {updateUser.isSuccess ? (
                  <NoticeBox
                    title="Cập nhật thành công"
                    description="Thông tin người dùng đã được lưu."
                    tone="success"
                  />
                ) : null}
                {updateUser.isError ? (
                  <NoticeBox
                    title="Cập nhật thất bại"
                    description="Vui lòng thử lại."
                    tone="destructive"
                  />
                ) : null}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={!userId || deleteUser.isPending}
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      !window.confirm(
                        `Xóa người dùng ${user?.email ?? compactId(userId)}?`,
                      )
                    ) {
                      return;
                    }

                    deleteUser.mutate(
                      { userId },
                      {
                        onSuccess: () => {
                          router.push("/admin/users");
                        },
                      },
                    );
                  }}
                >
                  {deleteUser.isPending ? "Đang xóa..." : "Xóa người dùng"}
                </Button>
              </form>
            </Panel>
          ) : null}
        </div>

        <div className="grid gap-6">
          <Panel
            eyebrow="Lịch sử"
            title="Đơn gần đây"
            description="Các đơn gần nhất của người dùng để hỗ trợ kiểm tra nhanh."
          >
            <div className="grid gap-3">
              {orders.map((order) => (
                <SurfaceLink
                  key={order.id}
                  href={`${detailPrefix}/orders/${order.id}`}
                  title={order.ticketTitle}
                  description={`${compactId(order.id)} • ${formatCurrency(order.totalPrice)} • ${formatDateTime(order.updatedAt)}`}
                />
              ))}
              {orders.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Người dùng này chưa có đơn nào trong truy vấn hiện tại.
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel
            eyebrow="Lịch sử"
            title="Thanh toán gần đây"
            description="Các khoản thanh toán gần nhất gắn với người dùng."
          >
            <div className="grid gap-3">
              {payments.map((payment) => (
                <SurfaceLink
                  key={payment.id}
                  href={`${detailPrefix}/payments/${payment.id}`}
                  title={compactId(payment.transactionId)}
                  description={`${formatCurrency(Number(payment.amount))} • Order ${compactId(payment.orderId)} • ${formatDateTime(payment.updatedAt)}`}
                />
              ))}
              {payments.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Chưa có thanh toán nào gắn với người dùng này.
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel
            eyebrow="Điều hướng"
            title="Đi nhanh"
            description="Đường dẫn tới các màn hình liên quan."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <SurfaceLink
                href={isAdminView ? "/admin/users" : "/users"}
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
