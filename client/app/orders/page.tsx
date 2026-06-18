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
      title={isAdminView ? "Điều phối đơn hàng" : "Danh sách đơn hàng"}
      description={
        isAdminView
          ? "Theo dõi tuyến, trạng thái thanh toán, phát hành vé và ghế đã chọn trong từng đơn."
          : "Tra cứu đơn hàng, kiểm tra trạng thái và mở chi tiết từng đơn khi cần."
      }
      actions={
        <FilterBar>
          <Input
            placeholder="Lọc theo userId"
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
            <option value="">Tất cả trạng thái</option>
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
              Làm mới
            </Button>
            <Button asChild variant="ghost">
              <Link href="/profile/orders">Mở đơn của tôi</Link>
            </Button>
          </div>
        </FilterBar>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Đơn hiển thị"
          value={String(orders.length)}
          helper="Bản ghi đang hiển thị trên trang hiện tại."
        />
        <StatCard
          label="Đã phát hành vé"
          value={String(issued)}
          helper="Số đơn đã phát hành vé trong trang hiện tại."
        />
        <StatCard
          label="Tổng tiền trang"
          value={formatCurrency(totalAmount)}
          helper={`${pending} đơn đang chờ thanh toán.`}
        />
      </div>

      <Panel
        title="Bảng đơn hàng"
        description="Theo dõi tuyến, ghế, trạng thái và tổng tiền của từng đơn."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow={isAdminView ? "Điều phối" : "Đơn hàng"}
            title="Danh sách đơn"
            description="Mở chi tiết để xem hành khách, thanh toán và các thao tác trạng thái."
          />

          {query.isError ? (
            <EmptyState
              title="Không tải được đơn hàng"
              description="Vui lòng kiểm tra kết nối dịch vụ và thử lại."
            />
          ) : null}

          {!query.isLoading && !query.isError && orders.length === 0 ? (
            <EmptyState
              title="Chưa có đơn hàng phù hợp"
              description="Thử bỏ lọc user hoặc đổi trạng thái để mở rộng kết quả."
            />
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Cập nhật</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{order.ticketTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {compactId(order.id)} • {order.ticketCode ?? "Chưa có mã vé"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        {order.departureStationName ?? order.departureStationCode ?? "?"} đến{" "}
                        {order.arrivalStationName ?? order.arrivalStationCode ?? "?"}
                      </p>
                      <p className="text-xs">
                        {order.seatLabels.join(", ") || "Chưa chọn ghế"}
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
                        Chi tiết
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
