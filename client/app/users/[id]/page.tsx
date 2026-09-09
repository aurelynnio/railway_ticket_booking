"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const query = useUser(params.id as string);
  const user = query.data;

  if (query.isLoading) {
    return <AppLayout><div className="p-10"><Skeleton className="h-60 w-full" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Quay lại
        </Button>
        <Card variant="outlined" padding="lg">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
              {(user?.email ?? "U")[0].toUpperCase()}
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">{user?.username ?? user?.email}</h1>
              <p className="text-sm text-ink-muted">{user?.email}</p>
              <Badge variant={user?.emailVerified ? "success" : "warning"} className="mt-2">
                {user?.emailVerified ? "Đã xác minh" : "Chưa xác minh"}
              </Badge>
            </div>
          </div>
          <div className="mt-8 space-y-3 border-t border-border pt-6">
            <div className="flex justify-between"><span className="text-sm text-ink-muted">ID</span><span className="font-mono text-sm">{user?.id}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-muted">Ngày đăng ký</span><span className="text-sm">{formatDateTime(user?.createdAt)}</span></div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
