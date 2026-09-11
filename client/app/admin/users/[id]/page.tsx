"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
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
import { useDeleteUser, useUpdateUser, useUser } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";
import { emailField, requiredText } from "@/lib/validation";

const updateSchema = z.object({
  username: requiredText("Username"),
  email: emailField,
  name: z.string().optional(),
});

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const query = useUser(userId);
  const user = query.data;

  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = useUpdateUser(userId);
  const remove = useDeleteUser();

  const form = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: { username: "", email: "", name: "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username ?? "",
        email: user.email ?? "",
        name: user.name ?? "",
      });
    }
  }, [user, form]);

  if (query.isLoading) {
    return <AdminLayout title="Chi tiết người dùng"><Skeleton className="h-60 w-full" /></AdminLayout>;
  }

  return (
    <AdminLayout title="Chi tiết người dùng" description={user?.email ?? undefined}>
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.back()}>
        <ArrowLeft className="size-4" /> Quay lại
      </Button>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="outlined" padding="lg">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
              {(user?.email || "U")[0].toUpperCase()}
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">{user?.username ?? user?.email}</h2>
              <p className="text-sm text-ink-muted">{user?.email}</p>
              <Badge variant={user?.emailVerified ? "success" : "warning"} className="mt-2">
                {user?.emailVerified ? "Đã xác minh" : "Chưa xác minh"}
              </Badge>
            </div>
          </div>
          <div className="mt-6 space-y-3 rounded-lg bg-muted/30 p-4">
            <Row label="ID" value={user?.id ?? "—"} />
            <Row label="Ngày đăng ký" value={formatDateTime(user?.createdAt)} />
            <Row label="Cập nhật" value={formatDateTime(user?.updatedAt)} />
          </div>
        </Card>

        <Card variant="outlined" padding="lg">
          <h3 className="font-display text-base font-semibold text-ink">Chỉnh sửa thông tin</h3>
          <form
            className="mt-5 space-y-4"
            onSubmit={form.handleSubmit((values) => update.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...form.register("username")} />
              {form.formState.errors.username?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Tên hiển thị (tùy chọn)</Label>
              <Input id="name" {...form.register("name")} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="accent" disabled={update.isPending}>
                <Save className="size-4" />
                {update.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" />
                Xóa người dùng
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Xóa người dùng?"
        description={`Tài khoản "${user?.email ?? userId}" sẽ bị xóa khỏi hệ thống.`}
        confirmLabel="Xóa"
        confirmPending={remove.isPending}
        onConfirm={() =>
          remove.mutate({ userId }, { onSuccess: () => router.push("/admin/users") })
        }
      />
    </AdminLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}