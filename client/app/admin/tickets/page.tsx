"use client";

import Link from "next/link";
import { useState } from "react";
import { Ticket, Plus, ArrowRight, TrainFront } from "lucide-react";

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
import { useTickets } from "@/hooks/ticket.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export default function AdminTicketsPage() {
  const [page, setPage] = useState(1);
  const query = useTickets({ page, limit: 20 });
  const tickets = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <AdminLayout
      title="Quản lý vé tàu"
      description="Tạo và quản lý các chuyến tàu."
      actions={
        <Button asChild variant="accent" size="sm">
          <Link href="/admin/tickets/new">
            <Plus className="size-4" />
            Tạo vé
          </Link>
        </Button>
      }
    >
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
                <TableHead>Tàu</TableHead>
                <TableHead>Hành trình</TableHead>
                <TableHead>Ngày đi</TableHead>
                <TableHead className="text-right">Giá</TableHead>
                <TableHead className="text-center">Chỗ</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Badge variant="default" className="font-mono">
                      <TrainFront className="size-3" />
                      {t.trainNumber ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-ink">
                    {t.departureStationName ?? t.departureStationCode} → {t.arrivalStationName ?? t.arrivalStationCode}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {formatDateTime(t.dateStart)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold tabular-nums">
                    {formatCurrency(t.ticketItems?.[0]?.priceOriginal ?? "0")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={(t.ticketItems?.[0]?.stockAvailable ?? 0) > 0 ? "success" : "destructive"}>
                      {t.ticketItems?.reduce((s, i) => s + (i.stockAvailable ?? 0), 0) ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/tickets/${t.id}`}>
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
