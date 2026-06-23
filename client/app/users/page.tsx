"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import {
  PaginationBar,
  SectionHeading,
  StatCard,
  compactId,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreateUser, useListUsers, useUserByEmail } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";

export default function UsersPage() {
  const pathname = usePathname();
  const isAdminView = pathname.startsWith("/admin");
  const [page, setPage] = useState(1);
  const query = useListUsers(page, 10, isAdminView);
  const createUser = useCreateUser();
  const users = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [submittedLookupEmail, setSubmittedLookupEmail] = useState("");
  const lookupQuery = useUserByEmail(submittedLookupEmail, Boolean(submittedLookupEmail) && isAdminView);

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
            <div className="grid gap-3 rounded-lg border border-border bg-muted/50 p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                <Input
                  placeholder="Username"
                  value={newUsername}
                  onChange={(event) => setNewUsername(event.target.value)}
                />
                <Input
                  placeholder="Email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <Button
                  type="button"
                  disabled={
                    !newUsername ||
                    !newEmail ||
                    !newPassword ||
                    createUser.isPending
                  }
                  onClick={() => {
                    createUser.mutate({
                      username: newUsername,
                      email: newEmail,
                      password: newPassword,
                    });
                    setNewUsername("");
                    setNewEmail("");
                    setNewPassword("");
                  }}
                >
                  {createUser.isPending ? "Đang tạo..." : "Tạo người dùng"}
                </Button>
              </div>
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
            </div>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã người dùng</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{compactId(user.id)}</TableCell>
                  <TableCell>{user.name ?? user.username ?? "N/A"}</TableCell>
                  <TableCell>{user.email ?? "N/A"}</TableCell>
                  <TableCell>
                    {formatDateTime(
                      typeof user.updatedAt === "string" ? user.updatedAt : null,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${isAdminView ? "/admin/users" : "/users"}/${user.id}`}>
                        Chi tiết
                      </Link>
                    </Button>
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
