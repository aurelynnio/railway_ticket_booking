"use client";

import Link from "next/link";
import { useState } from "react";
import { Users, ArrowRight } from "lucide-react";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListUsers } from "@/hooks/user.hook";
import { formatDateTime } from "@/lib/formatters";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const query = useListUsers(page, 20);
  const users = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <AdminLayout title="Quản lý người dùng" description="Quản lý tài khoản người dùng.">
      <Card variant="outlined" padding="none">
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
                        {(u.email ?? "U")[0].toUpperCase()}
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
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/users/${u.id}`}>
                        Chi tiết
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
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
    </AdminLayout>
  );
}
