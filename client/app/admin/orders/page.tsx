"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, ArrowRight } from "lucide-react";

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
import { useOrders } from "@/hooks/order.hook";
import { formatCurrency, formatDateTime, formatOrderStatus, getOrderStatusTone } from "@/lib/formatters";

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const query = useOrders({ page, limit: 20 });
  const orders = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <AdminLayout title="Quản lý đơn hàng" description="Theo dõi và xử lý đơn hàng.">
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
                <TableHead>Mã đơn</TableHead>
                <TableHead>Người dùng</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    #{o.id?.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm text-ink">
                    {o.userId?.slice(0, 8) ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {formatDateTime(o.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getOrderStatusTone(o.status)}>
                      {formatOrderStatus(o.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold tabular-nums">
                    {formatCurrency(o.totalPrice ?? "0")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/orders/${o.id}`}>
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
