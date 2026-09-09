"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const query = useUser(params.id as string);
  const user = query.data;

  if (query.isLoading) {
    return <AdminLayout title="Chi tiết người dùng"><Skeleton className="h-60 w-full" /></AdminLayout>;
  }

  return (
    <AdminLayout title="Chi tiết người dùng" description={user?.email ?? undefined}>
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.back()}>
        <ArrowLeft className="size-4" /> Quay lại
      </Button>
      <Card variant="outlined" padding="lg">
        <div className="flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
            {(user?.email ?? "U")[0].toUpperCase()}
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
        </div>
      </Card>
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
