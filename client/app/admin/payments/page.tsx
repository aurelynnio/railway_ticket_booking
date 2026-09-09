"use client";

import Link from "next/link";
import { useState } from "react";
import { Wallet, ArrowRight } from "lucide-react";

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
import { usePayments } from "@/hooks/payment.hook";
import { formatCurrency, formatDateTime, formatPaymentStatus, getPaymentStatusTone } from "@/lib/formatters";

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const query = usePayments({ page, limit: 20 });
  const payments = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <AdminLayout title="Quản lý thanh toán" description="Theo dõi giao dịch thanh toán.">
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
                <TableHead>Mã GD</TableHead>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">
                    #{p.id?.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {p.orderId?.slice(0, 8) ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {formatDateTime(p.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.paymentMethod ?? "VNPay"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusTone(p.status)}>
                      {formatPaymentStatus(p.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold tabular-nums">
                    {formatCurrency(p.amount ?? "0")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/payments/${p.id}`}>
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
