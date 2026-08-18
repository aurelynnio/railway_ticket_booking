"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { AppShell, Panel } from "@/components/shell/app-shell";
import {
  EmptyState,
  FilterBar,
  PaginationBar,
  SectionHeading,
  StatusBadge,
  compactId,
} from "@/components/ui/railway-ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ManualPaymentForm } from "@/components/payment/manual-payment-form";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthSession } from "@/hooks/auth.hook";
import {
  usePayments,
  usePaymentsByUserId,
  useCancelPayment,
  useMarkPaymentFailed,
  useMarkPaymentPaid,
  useMarkPaymentProcessing,
} from "@/hooks/payment.hook";
import { PaymentStatus } from "@/lib/api-types";
import {
  formatCurrency,
  formatDateTime,
  formatPaymentStatus,
  getPaymentStatusTone,
} from "@/lib/formatters";

export default function PaymentsPage() {
  const pathname = usePathname();
  const isAdminView = pathname.startsWith("/admin");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [orderId, setOrderId] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const session = useAuthSession();
  const markProcessing = useMarkPaymentProcessing();
  const markPaid = useMarkPaymentPaid();
  const markFailed = useMarkPaymentFailed();
  const cancelPayment = useCancelPayment();

  const adminQuery = usePayments(
    {
      page,
      limit: 10,
      status: status || undefined,
      orderId: orderId || undefined,
      transactionId: transactionId || undefined,
    },
    isAdminView,
  );

  const userQuery = usePaymentsByUserId(
    {
      userId: session.data?.userId ?? "",
      page,
      limit: 10,
    },
    !isAdminView && Boolean(session.data?.userId),
  );

  const query = isAdminView ? adminQuery : userQuery;

  const payments = query.data?.data ?? [];
  const pagination = query.data?.pagination;
  const totalAmount = payments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );
  const paidCount = payments.filter((payment) => payment.status === PaymentStatus.Paid).length;
  const failedCount = payments.filter(
    (payment) =>
      payment.status === PaymentStatus.Failed ||
      payment.status === PaymentStatus.Cancelled,
  ).length;
  const processingCount = payments.filter(
    (payment) => payment.status === PaymentStatus.Processing,
  ).length;
  const isAdminActionPending =
    markProcessing.isPending ||
    markPaid.isPending ||
    markFailed.isPending ||
    cancelPayment.isPending;

  return (
    <AppShell
      title={isAdminView ? "Quản lý thanh toán" : "Thanh toán của tôi"}
      description={
        isAdminView
          ? "Đối soát giao dịch, trạng thái thanh toán và mã tham chiếu."
          : "Theo dõi các giao dịch gắn với đơn đặt vé của bạn."
      }
    >
      <div className="space-y-6">
      <FilterBar>
        <Input
          placeholder="Order ID"
          value={orderId}
          onChange={(event) => {
            setPage(1);
            setOrderId(event.target.value);
          }}
        />
        <Input
          placeholder="Transaction ID"
          value={transactionId}
          onChange={(event) => {
            setPage(1);
            setTransactionId(event.target.value);
          }}
        />
        <Select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(PaymentStatus)
            .filter(([, value]) => typeof value === "number")
            .map(([label, value]) => (
              <option key={label} value={String(value)}>
                {formatPaymentStatus(value as number)}
              </option>
            ))}
        </Select>
        <Button type="button" variant="outline" onClick={() => setPage(1)}>
          Làm mới
        </Button>
      </FilterBar>

      {isAdminView ? (
        <ManualPaymentForm />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Thanh toán hiển thị"
          value={String(payments.length)}
          helper="Số giao dịch trong trang hiện tại."
        />
        <StatCard
          label="Đã thanh toán"
          value={String(paidCount)}
          helper={`${failedCount} bản ghi lỗi hoặc bị hủy.`}
          tone="success"
        />
        <StatCard
          label="Tổng tiền trang"
          value={formatCurrency(totalAmount)}
          helper={`${processingCount} giao dịch đang xử lý.`}
        />
      </div>

      <Panel
        eyebrow={isAdminView ? "Đối soát" : "Giao dịch"}
        title="Bảng thanh toán"
        description="Đối chiếu orderId, transactionId, userId, số tiền và trạng thái thanh toán."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow={isAdminView ? "Đối soát" : "Truy vết"}
            title="Danh sách thanh toán"
            description="Mở chi tiết để xử lý trạng thái thanh toán khi cần."
          />

          {query.isError ? (
            <EmptyState
              title="Không tải được thanh toán"
              description="Vui lòng kiểm tra kết nối dịch vụ và thử lại."
            />
          ) : null}

          {!query.isLoading && !query.isError && payments.length === 0 ? (
            <EmptyState
              title="Không có thanh toán phù hợp"
              description="Thử bỏ transactionId hoặc orderId để xem nhiều bản ghi hơn."
            />
          ) : null}

          {query.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-sm border border-border bg-muted/40"
                />
              ))}
            </div>
          ) : null}

          {!query.isLoading && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead>Đơn / Người dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden md:table-cell">Số tiền</TableHead>
                  <TableHead className="hidden lg:table-cell">Thanh toán lúc</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-ink mono">
                          {compactId(payment.id)}
                        </p>
                        <p className="mono text-xs text-ink-muted">
                          {compactId(payment.transactionId)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-ink-muted">
                        <p className="mono">Order {compactId(payment.orderId)}</p>
                        <p className="mono text-xs">User {compactId(payment.userId)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={formatPaymentStatus(payment.status)}
                        tone={getPaymentStatusTone(payment.status)}
                      />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="mono text-sm font-medium tabular-nums text-ink">
                        {formatCurrency(Number(payment.amount))}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="mono text-xs tabular-nums text-ink-muted">
                        {formatDateTime(payment.paidAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {isAdminView ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" size="xs" variant="outline">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                disabled={isAdminActionPending}
                                onSelect={() => markProcessing.mutate({ id: payment.id })}
                              >
                                Xử lý
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isAdminActionPending}
                                onSelect={() => markPaid.mutate({ id: payment.id })}
                              >
                                Đã trả
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isAdminActionPending}
                                onSelect={() => markFailed.mutate({ id: payment.id })}
                              >
                                Lỗi
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={isAdminActionPending}
                                onSelect={() => cancelPayment.mutate({ id: payment.id })}
                              >
                                Hủy
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                        <Button asChild size="sm" variant="outline">
                          <Link href={`${isAdminView ? "/admin/payments" : "/payments"}/${payment.id}`}>
                            Chi tiết
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}

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
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "success" | "warning" | "destructive";
}) {
  const valueColor =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "text-ink";
  return (
    <div className="space-y-2 border border-border bg-card p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
        {label}
      </p>
      <p className={`font-display text-3xl font-semibold tracking-tight tabular-nums ${valueColor}`}>
        {value}
      </p>
      {helper ? (
        <p className="text-sm leading-relaxed text-ink-muted">{helper}</p>
      ) : null}
    </div>
  );
}
