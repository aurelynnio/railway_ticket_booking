"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import {
  EmptyState,
  FilterBar,
  PaginationBar,
  SectionHeading,
  StatCard,
  StatusBadge,
  compactId,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  // Admin: xem tất cả payments. Non-admin: chỉ xem payment của mình
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
  const isAdminActionPending =
    markProcessing.isPending ||
    markPaid.isPending ||
    markFailed.isPending ||
    cancelPayment.isPending;

  return (
    <AppShell
      title={isAdminView ? "Đối soát thanh toán" : "Danh sách thanh toán"}
      description={
        isAdminView
          ? "Theo dõi giao dịch, đơn hàng, người dùng và trạng thái xử lý sau thanh toán."
          : "Tổng hợp các bản ghi thanh toán để truy vết theo đơn hàng hoặc mã giao dịch."
      }
      actions={
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
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Thanh toán hiển thị"
          value={String(payments.length)}
          helper="Số giao dịch trong trang hiện tại."
        />
        <StatCard
          label="Đã thanh toán"
          value={String(paidCount)}
          helper={`${failedCount} bản ghi lỗi hoặc bị hủy trong trang hiện tại.`}
        />
        <StatCard
          label="Tổng tiền trang"
          value={formatCurrency(totalAmount)}
          helper="Tổng số tiền đang được bộ lọc hiện tại trả về."
        />
      </div>

      <Panel
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
                      <p className="font-medium text-foreground">
                        {compactId(payment.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {compactId(payment.transactionId)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Order {compactId(payment.orderId)}</p>
                      <p className="text-xs">User {compactId(payment.userId)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={formatPaymentStatus(payment.status)}
                      tone={getPaymentStatusTone(payment.status)}
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatCurrency(Number(payment.amount))}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDateTime(payment.paidAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {isAdminView ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isAdminActionPending}
                            onClick={() => markProcessing.mutate({ id: payment.id })}
                          >
                            Xử lý
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isAdminActionPending}
                            onClick={() => markPaid.mutate({ id: payment.id })}
                          >
                            Đã trả
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isAdminActionPending}
                            onClick={() => markFailed.mutate({ id: payment.id })}
                          >
                            Lỗi
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isAdminActionPending}
                            onClick={() => cancelPayment.mutate({ id: payment.id })}
                          >
                            Hủy
                          </Button>
                        </>
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
