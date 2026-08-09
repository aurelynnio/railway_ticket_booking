"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppShell, Panel } from "@/components/app-shell";
import { FormField } from "@/components/form-field";
import {
  EmptyState,
  NoticeBox,
  PaginationBar,
  SectionHeading,
  compactId,
} from "@/components/railway-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  useCreateUser,
  useDeleteUser,
  useListUsers,
  useUserByEmail,
} from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";
import { emailField, passwordField, requiredText } from "@/lib/validation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const createUserSchema = z.object({
  username: requiredText("Username"),
  email: emailField,
  password: passwordField,
});

export default function UsersPage() {
  const pathname = usePathname();
  const isAdminView = pathname.startsWith("/admin");
  const [page, setPage] = useState(1);
  const query = useListUsers(page, 10, isAdminView);
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const users = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  const [lookupEmail, setLookupEmail] = useState("");
  const [submittedLookupEmail, setSubmittedLookupEmail] = useState("");
  const lookupQuery = useUserByEmail(submittedLookupEmail, Boolean(submittedLookupEmail) && isAdminView);
  const createUserForm = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  return (
    <AppShell
      title={isAdminView ? "Quản lý người dùng" : "Danh sách người dùng"}
      description={
        isAdminView
          ? "Tra cứu, tạo và quản lý tài khoản trong hệ thống."
          : "Tra cứu thông tin người dùng đang có trong hệ thống."
      }
    >
      <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Người dùng"
          value={String(users.length)}
          helper="Số tài khoản trong trang hiện tại."
        />
        <StatCard
          label="Cập nhật mới nhất"
          value={users[0]?.updatedAt ? formatDateTime(users[0].updatedAt) : "N/A"}
          helper="Mốc thay đổi gần nhất."
        />
        <StatCard
          label="Chế độ"
          value={isAdminView ? "Quản trị" : "Công khai"}
          helper="Không gian xem hiện tại."
        />
      </div>

      <Panel
        eyebrow={isAdminView ? "Tài khoản" : "Danh bạ"}
        title="Danh sách người dùng"
        description="Mở từng tài khoản để xem chi tiết và dữ liệu liên quan."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow={isAdminView ? "Tài khoản" : "Danh bạ"}
            title="Tài khoản hiện có"
            description="Thông tin được giữ gọn để dễ quét và mở chi tiết khi cần."
          />

          {isAdminView ? (
            <div className="space-y-4 border border-border bg-secondary/50 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                  Tạo người dùng
                </p>
              </div>
              <form
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                onSubmit={createUserForm.handleSubmit((values) =>
                  createUser.mutate(values, {
                    onSuccess: () => {
                      createUserForm.reset();
                    },
                  }),
                )}
              >
                <FormField
                  label="Username"
                  error={createUserForm.formState.errors.username?.message}
                >
                  <Input
                    placeholder="Username"
                    aria-invalid={Boolean(createUserForm.formState.errors.username)}
                    {...createUserForm.register("username")}
                  />
                </FormField>
                <FormField
                  label="Email"
                  error={createUserForm.formState.errors.email?.message}
                >
                  <Input
                    placeholder="Email"
                    aria-invalid={Boolean(createUserForm.formState.errors.email)}
                    {...createUserForm.register("email")}
                  />
                </FormField>
                <FormField
                  label="Password"
                  error={createUserForm.formState.errors.password?.message}
                >
                  <Input
                    type="password"
                    placeholder="Password"
                    aria-invalid={Boolean(createUserForm.formState.errors.password)}
                    {...createUserForm.register("password")}
                  />
                </FormField>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createUser.isPending}
                  >
                    {createUser.isPending ? "Đang tạo..." : "Tạo người dùng"}
                  </Button>
                </div>
              </form>
              <div className="border-t border-border pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted mb-3">
                  Tìm kiếm nhanh
                </p>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <Input
                    placeholder="Tìm theo email"
                    value={lookupEmail}
                    onChange={(event) => setLookupEmail(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!lookupEmail}
                    onClick={() => setSubmittedLookupEmail(lookupEmail)}
                  >
                    Tìm email
                  </Button>
                </div>
              </div>
              {lookupQuery.data ? (
                <Button asChild variant="ghost" size="sm" className="justify-self-start">
                  <Link href={`/admin/users/${lookupQuery.data.id}`}>
                    Mở {lookupQuery.data.email ?? compactId(lookupQuery.data.id)}
                  </Link>
                </Button>
              ) : null}
              {lookupQuery.isError ? (
                <NoticeBox
                  title="Không tìm thấy email"
                  description="Thử lại với email khác hoặc kiểm tra dữ liệu người dùng."
                  tone="warning"
                />
              ) : null}
            </div>
          ) : null}

          {query.isError ? (
            <EmptyState
              title="Không tải được người dùng"
              description="Vui lòng kiểm tra kết nối dịch vụ và thử lại."
            />
          ) : null}

          {!query.isLoading && !query.isError && users.length === 0 ? (
            <EmptyState
              title="Chưa có người dùng nào"
              description="Tạo người dùng mới hoặc kiểm tra bộ lọc."
            />
          ) : null}

          {query.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-sm border border-border bg-muted/40"
                />
              ))}
            </div>
          ) : null}

          {!query.isLoading && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã người dùng</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Vai trò</TableHead>
                  <TableHead className="hidden lg:table-cell">Cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <span className="mono text-xs font-medium text-ink">
                        {compactId(user.id)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium text-ink">{user.name ?? user.username ?? "N/A"}</p>
                        <p className="text-xs text-ink-muted mono">{user.username ?? ""}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="mono text-xs text-ink-muted">
                        {user.email ?? "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge
                        variant={user.role === 1 ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {user.role === 1 ? "Admin" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="mono text-xs tabular-nums text-ink-muted">
                        {formatDateTime(
                          typeof user.updatedAt === "string" ? user.updatedAt : null,
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`${isAdminView ? "/admin/users" : "/users"}/${user.id}`}>
                            Chi tiết
                          </Link>
                        </Button>
                        {isAdminView ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" size="sm" variant="outline">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={deleteUser.isPending}
                                onSelect={() => {
                                  if (
                                    typeof window !== "undefined" &&
                                    !window.confirm(
                                      `Xóa người dùng ${user.email ?? compactId(user.id)}?`,
                                    )
                                  ) {
                                    return;
                                  }

                                  deleteUser.mutate({ userId: user.id });
                                }}
                              >
                                Xóa người dùng
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}

          {pagination ? (
            <PaginationBar
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPrev={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() =>
                setPage((current) =>
                  pagination.totalPages === 0
                    ? current
                    : Math.min(pagination.totalPages, current + 1),
                )
              }
            />
          ) : null}
        </div>
      </Panel>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "success" | "warning" | "destructive";
}) {
  const valueColor =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "text-ink";
  return (
    <div className="space-y-2 border border-border bg-card p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
        {label}
      </p>
      <p className={`font-display text-2xl font-semibold tracking-tight tabular-nums ${valueColor}`}>
        {value}
      </p>
      {helper ? (
        <p className="text-sm leading-relaxed text-ink-muted">{helper}</p>
      ) : null}
    </div>
  );
}
