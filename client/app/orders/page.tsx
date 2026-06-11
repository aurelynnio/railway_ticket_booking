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
import { OrderStatus } from "@/lib/api-types";
import { useOrders } from "@/hooks/order.hook";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusTone,
} from "@/lib/formatters";

export default function OrdersPage() {
  const pathname = usePathname();
  const isAdminView = pathname.startsWith("/admin");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");

  const query = useOrders({
    page,
    limit: 10,
    userId: userId || undefined,
    status: status ? Number(status) : undefined,
  });

  const orders = query.data?.data ?? [];
  const pagination = query.data?.pagination;
  const totalAmount = orders.reduce((total, order) => total + order.totalPrice, 0);
  const issued = orders.filter((order) => order.status === OrderStatus.TicketIssued).length;
  const pending = orders.filter((order) => order.status === OrderStatus.PendingPayment).length;

  return (
    <AppShell
      title={isAdminView ? "Orders command center" : "Orders registry"}
      description={
        isAdminView
          ? "Goc nhin dieu hanh cho `orders-service`, giup doi van hanh doc nhanh route, trang thai thanh toan, issue ticket va seat payload."
          : "Muc chung de soat order, phuc vu ca debug flow dat ve lan dieu huong sang chi tiet tung order."
      }
      actions={
        <FilterBar>
          <Input
            placeholder="Filter by userId"
            value={userId}
            onChange={(event) => {
              setPage(1);
              setUserId(event.target.value);
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
            {Object.entries(OrderStatus)
              .filter(([, value]) => typeof value === "number")
              .map(([label, value]) => (
                <option key={label} value={String(value)}>
                  {formatOrderStatus(value as number)}
                </option>
              ))}
          </Select>
          <div className="md:col-span-2 xl:col-span-2 flex gap-2">
            <Button type="button" variant="outline" onClick={() => setPage(1)}>
              Lam moi
            </Button>
            <Button asChild variant="ghost">
              <Link href="/profile/orders">Mo orders cua toi</Link>
            </Button>
          </div>
        </FilterBar>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Orders in view"
          value={String(orders.length)}
          helper="Ban ghi dang hien thi tren page hien tai."
        />
        <StatCard
          label="Ticket issued"
          value={String(issued)}
          helper="So order da issue ticket trong viewport."
        />
        <StatCard
          label="Page GMV"
          value={formatCurrency(totalAmount)}
          helper={`${pending} order dang cho thanh toan.`}
        />
      </div>

      <Panel
        title="Orders table"
        description="Bang tap trung vao route, seat payload, trang thai va tong tien de giai quyet debug va support nhanh."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow={isAdminView ? "Operations" : "Repository"}
            title="Danh sach order"
            description="Click vao tung dong de mo chi tiet va chay cac action status nhu mark paid, confirm, issue ticket hoac cancel."
          />

          {query.isError ? (
            <EmptyState
              title="Khong tai duoc orders"
              description="Kiem tra `orders-service` va `api-gateway` truoc khi thu lai."
            />
          ) : null}

          {!query.isLoading && !query.isError && orders.length === 0 ? (
            <EmptyState
              title="Chua co order trong viewport"
              description="Thu bo user filter hoac doi status filter de mo rong ket qua."
            />
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{order.ticketTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {compactId(order.id)} • {order.ticketCode ?? "No ticket code"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        {order.departureStationName ?? order.departureStationCode ?? "?"} den{" "}
                        {order.arrivalStationName ?? order.arrivalStationCode ?? "?"}
                      </p>
                      <p className="text-xs">
                        {order.seatLabels.join(", ") || "Chua chon ghe"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={formatOrderStatus(order.status)}
                      tone={getOrderStatusTone(order.status)}
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                  <TableCell>{formatDateTime(order.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${isAdminView ? "/admin/orders" : "/orders"}/${order.id}`}>
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
