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
import { usePayments } from "@/hooks/payment.hook";
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

  const query = usePayments({
    page,
    limit: 10,
    status: status || undefined,
    orderId: orderId || undefined,
    transactionId: transactionId || undefined,
  });

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

  return (
    <AppShell
      title={isAdminView ? "Payment control room" : "Payments ledger"}
      description={
        isAdminView
          ? "Khung doi soat thanh toan cua `payments-service`, tap trung vao transaction, order link, user link va state machine sau giao dich."
          : "Trang tong hop cac ban ghi payment de truy vet thanh toan theo order hoac transaction."
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
            <option value="">All statuses</option>
            {Object.entries(PaymentStatus)
              .filter(([, value]) => typeof value === "number")
              .map(([label, value]) => (
                <option key={label} value={String(value)}>
                  {formatPaymentStatus(value as number)}
                </option>
              ))}
          </Select>
          <Button type="button" variant="outline" onClick={() => setPage(1)}>
            Lam moi
          </Button>
        </FilterBar>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Records in view"
          value={String(payments.length)}
          helper="So payment dang hien thi."
        />
        <StatCard
          label="Paid records"
          value={String(paidCount)}
          helper={`${failedCount} ban ghi loi hoac bi huy trong viewport.`}
        />
        <StatCard
          label="Page volume"
          value={formatCurrency(totalAmount)}
          helper="Tong so tien dang duoc bo loc hien tai."
        />
      </div>

      <Panel
        title="Payments table"
        description="Bang toi uu cho doi soat: co orderId, transactionId, userId, amount va payment status."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow={isAdminView ? "Reconciliation" : "Traceability"}
            title="Danh sach payment"
            description="Tu day co the click vao payment detail de mark processing, paid, failed, cancel hoac expire."
          />

          {query.isError ? (
            <EmptyState
              title="Khong tai duoc payments"
              description="Kiem tra ket noi gateway va `payments-service`, sau do lam moi truy van."
            />
          ) : null}

          {!query.isLoading && !query.isError && payments.length === 0 ? (
            <EmptyState
              title="Khong co payment nao khop bo loc"
              description="Thu bo transactionId hoac orderId filter de xem nhiu ban ghi hon."
            />
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment</TableHead>
                <TableHead>Order / User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid at</TableHead>
                <TableHead className="text-right">Action</TableHead>
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
                  <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                  <TableCell>{formatDateTime(payment.paidAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${isAdminView ? "/admin/payments" : "/payments"}/${payment.id}`}>
                        Chi tiet
                      </Link>
                    </Button>
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
