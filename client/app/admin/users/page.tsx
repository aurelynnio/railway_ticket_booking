"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCreateUser, useDeleteUser, useListUsers } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";
import { emailField, passwordField, requiredText } from "@/lib/validation";

const createSchema = z.object({
  username: requiredText("Username"),
  email: emailField,
  password: passwordField,
  role: z.number().optional(),
});

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    email?: string | null;
  } | null>(null);

  const query = useListUsers(page, 20);
  const users = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  const create = useCreateUser();
  const remove = useDeleteUser();

  const createForm = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: "", email: "", password: "", role: 0 },
  });

  return (
    <AdminLayout title="Quản lý người dùng" description="Quản lý tài khoản người dùng.">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="size-3.5" />
          {showCreate ? "Đóng" : "Thêm người dùng"}
        </Button>
      </div>

      {showCreate && (
        <Card variant="outlined" padding="lg" className="mt-4">
          <h3 className="font-display text-base font-semibold text-ink">
            Tạo tài khoản mới
          </h3>
          <form
            className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={createForm.handleSubmit((values) =>
              create.mutate(values, {
                onSuccess: () => {
                  createForm.reset({ username: "", email: "", password: "", role: 0 });
                  setShowCreate(false);
                },
              }),
            )}
          >
            <div className="space-y-2">
              <Label htmlFor="u">Username</Label>
              <Input id="u" {...createForm.register("username")} />
              {createForm.formState.errors.username?.message && (
                <p className="text-xs font-medium text-destructive">
                  {createForm.formState.errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="e">Email</Label>
              <Input id="e" type="email" {...createForm.register("email")} />
              {createForm.formState.errors.email?.message && (
                <p className="text-xs font-medium text-destructive">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="p">Mật khẩu</Label>
              <Input id="p" type="password" {...createForm.register("password")} />
              {createForm.formState.errors.password?.message && (
                <p className="text-xs font-medium text-destructive">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" variant="accent" size="sm" disabled={create.isPending}>
                {create.isPending ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card variant="outlined" padding="none" className="mt-4">
        {query.isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Xác minh</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                        {(u.email || "U")[0].toUpperCase()}
                      </span>
                      <span className="font-medium text-ink">{u.username ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.emailVerified ? "success" : "warning"}>
                      {u.emailVerified ? "Đã xác minh" : "Chưa xác minh"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {formatDateTime(u.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/users/${u.id}`}>
                          Chi tiết
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Xóa người dùng"
                        onClick={() => setDeleteTarget({ id: u.id, email: u.email })}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <span className="text-sm text-ink-muted">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          >
            Sau
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xóa người dùng?"
        description={
          deleteTarget
            ? `Người dùng "${deleteTarget.email ?? deleteTarget.id}" sẽ bị xóa khỏi hệ thống.`
            : undefined
        }
        confirmLabel="Xóa"
        confirmPending={remove.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          remove.mutate({ userId: deleteTarget.id }, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </AdminLayout>
  );
}