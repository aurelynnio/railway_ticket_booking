"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppShell, Panel } from "@/components/app-shell";
import { FormField } from "@/components/form-field";
import {
  NoticeBox,
  PaginationBar,
  SectionHeading,
  StatCard,
  compactId,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
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
      title={isAdminView ? "Quản lý người dùng" : "Danh bạ người dùng"}
      description="Theo dõi tài khoản, thông tin liên hệ và các hoạt động liên quan."
    >
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
            <div className="grid gap-3 rounded-lg border border-border/80 bg-secondary/45 p-4">
              <form
                className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]"
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
                    disabled={createUser.isPending}
                  >
                    {createUser.isPending ? "Đang tạo..." : "Tạo người dùng"}
                  </Button>
                </div>
              </form>
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <Input
                  placeholder="Tìm theo email"
                  value={lookupEmail}
                  onChange={(event) => setLookupEmail(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!lookupEmail}
                  onClick={() => setSubmittedLookupEmail(lookupEmail)}
                >
                  Tìm email
                </Button>
              </div>
              {lookupQuery.data ? (
                <Button asChild variant="ghost" className="justify-self-start">
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã người dùng</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Cập nhật</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{compactId(user.id)}</TableCell>
                  <TableCell>{user.name ?? user.username ?? "N/A"}</TableCell>
                  <TableCell className="hidden md:table-cell">{user.email ?? "N/A"}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatDateTime(
                      typeof user.updatedAt === "string" ? user.updatedAt : null,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`${isAdminView ? "/admin/users" : "/users"}/${user.id}`}>
                          Chi tiết
                        </Link>
                      </Button>
                      {isAdminView ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={deleteUser.isPending}
                          onClick={() => {
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
                          Xóa
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
    </AppShell>
  );
}
