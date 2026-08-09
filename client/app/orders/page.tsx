"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { MoreHorizontal, Plus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppShell, Panel } from "@/components/app-shell";
import { FormField } from "@/components/form-field";
import {
  EmptyState,
  FilterBar,
  PaginationBar,
  SectionHeading,
  StatusBadge,
  compactId,
} from "@/components/railway-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  useConfirmOrder,
  useCreateOrderRecord,
  useIssueTicket,
  useMarkOrderPaid,
  useOrders,
} from "@/hooks/order.hook";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusTone,
} from "@/lib/formatters";
import {
  integerText,
  requiredText,
} from "@/lib/validation";

const createOrderRecordSchema = z.object({
  userId: requiredText("User ID"),
  ticketId: requiredText("Ticket ID"),
  ticketItemId: requiredText("Ticket item ID"),
  ticketTitle: requiredText("Ticket title"),
  quantity: integerText("Quantity", 1),
  unitPrice: integerText("Unit price", 0),
});

export default function OrdersPage() {
  const pathname = usePathname();
  const isAdminView = pathname.startsWith("/admin");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [userId, setUserId] = useState("");
  const createOrderRecord = useCreateOrderRecord();
  const markOrderPaid = useMarkOrderPaid();
  const confirmOrder = useConfirmOrder();
  const issueTicket = useIssueTicket();
  const createOrderForm = useForm<z.infer<typeof createOrderRecordSchema>>({
    resolver: zodResolver(createOrderRecordSchema),
    defaultValues: {
      userId: "",
      ticketId: "",
      ticketItemId: "",
      ticketTitle: "",
      quantity: "1",
      unitPrice: "0",
    },
  });

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
  const isAdminActionPending =
    markOrderPaid.isPending || confirmOrder.isPending || issueTicket.isPending;

  return (
    <AppShell
      title={isAdminView ? "Quản lý đơn hàng" : "Đơn hàng của tôi"}
      description={
        isAdminView
          ? "Theo dõi, đối soát và xử lý các đơn đặt vé trong hệ thống."
          : "Theo dõi tuyến đi, ghế đã chọn và trạng thái xử lý của từng đơn."
      }
    >
      <div className="space-y-6">
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
          {!isAdminView ? (
            <Button asChild variant="ghost">
              <Link href="/profile/orders">Mở đơn của tôi</Link>
            </Button>
          ) : null}
        </div>
      </FilterBar>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card variant="outlined" padding="lg" className="gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Đơn hiển thị
          </p>
          <p className="font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
            {orders.length}
          </p>
          <p className="text-sm leading-relaxed text-ink-muted">Số đơn trong trang hiện tại.</p>
        </Card>
        <Card variant="outlined" padding="lg" className="gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Đã phát hành vé
          </p>
          <p className="font-display text-3xl font-semibold tracking-tight text-success tabular-nums">
            {issued}
          </p>
          <p className="text-sm leading-relaxed text-ink-muted">Số đơn đã hoàn tất phát hành vé.</p>
        </Card>
        <Card variant="outlined" padding="lg" className="gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Tổng tiền trang
          </p>
          <p className="font-display text-3xl font-semibold tracking-tight text-ink tabular-nums mono">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-sm leading-relaxed text-ink-muted">
            <span className="text-warning font-medium">{pending}</span> đơn đang chờ thanh toán.
          </p>
        </Card>
      </div>

      <Panel
        eyebrow={isAdminView ? "Điều phối" : "Đơn hàng"}
        title="Danh sách đơn"
        description="Theo dõi tuyến, ghế, trạng thái và tổng tiền của từng đơn."
      >
        <div className="space-y-5">
          <SectionHeading
            eyebrow={isAdminView ? "Vận hành" : "Tra cứu"}
            title="Đơn hàng"
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

          {query.isLoading ? (
            <Card variant="outlined" padding="none">
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-sm bg-muted/40" />
                ))}
              </div>
            </Card>
          ) : null}

          {!query.isLoading && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Đơn hàng</TableHead>
                  <TableHead>Tuyến</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden md:table-cell">Tổng tiền</TableHead>
                  <TableHead className="hidden lg:table-cell">Cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-ink">{order.ticketTitle}</p>
                        <p className="text-xs text-ink-muted">
                          <span className="mono font-medium text-ink">{compactId(order.id)}</span>
                          {" • "}
                          <span className="mono">{order.ticketCode ?? "Chưa có mã vé"}</span>
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-ink-muted">
                        <p>
                          {order.departureStationName ?? order.departureStationCode ?? "?"}
                          {" → "}
                          {order.arrivalStationName ?? order.arrivalStationCode ?? "?"}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {order.seatLabels.length > 0 ? (
                            order.seatLabels.map((seat) => (
                              <Badge key={seat} variant="outline" className="mono text-[10px] h-5">
                                {seat}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs">Chưa chọn ghế</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={formatOrderStatus(order.status)}
                        tone={getOrderStatusTone(order.status)}
                      />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="mono text-sm font-medium tabular-nums text-ink">
                        {formatCurrency(order.totalPrice)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="mono text-xs tabular-nums text-ink-muted">
                        {formatDateTime(order.updatedAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {isAdminView ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" size="sm" variant="outline">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                disabled={isAdminActionPending}
                                onSelect={() => markOrderPaid.mutate({ orderId: order.id })}
                              >
                                Đã thanh toán
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isAdminActionPending}
                                onSelect={() => confirmOrder.mutate({ orderId: order.id })}
                              >
                                Xác nhận
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isAdminActionPending}
                                onSelect={() => issueTicket.mutate({ orderId: order.id })}
                              >
                                Phát hành
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                        <Button asChild size="sm" variant="outline">
                          <Link href={`${isAdminView ? "/admin/orders" : "/orders"}/${order.id}`}>
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

      {isAdminView ? (
        <Panel
          eyebrow="Vận hành"
          title="Tạo order thủ công"
          description="Tạo nhanh một đơn thủ công để hỗ trợ vận hành hoặc kiểm thử."
        >
          <form
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            onSubmit={createOrderForm.handleSubmit((values) =>
              createOrderRecord.mutate(
                {
                  userId: values.userId,
                  ticketId: values.ticketId,
                  ticketItemId: values.ticketItemId,
                  ticketTitle: values.ticketTitle,
                  quantity: Number(values.quantity),
                  unitPrice: Number(values.unitPrice),
                },
                {
                  onSuccess: () => {
                    createOrderForm.reset();
                  },
                },
              ),
            )}
          >
            <FormField label="Mã người dùng" error={createOrderForm.formState.errors.userId?.message}>
              <Input aria-invalid={Boolean(createOrderForm.formState.errors.userId)} {...createOrderForm.register("userId")} />
            </FormField>
            <FormField label="Mã vé" error={createOrderForm.formState.errors.ticketId?.message}>
              <Input aria-invalid={Boolean(createOrderForm.formState.errors.ticketId)} {...createOrderForm.register("ticketId")} />
            </FormField>
            <FormField label="Mã hạng ghế" error={createOrderForm.formState.errors.ticketItemId?.message}>
              <Input aria-invalid={Boolean(createOrderForm.formState.errors.ticketItemId)} {...createOrderForm.register("ticketItemId")} />
            </FormField>
            <FormField label="Tên vé" error={createOrderForm.formState.errors.ticketTitle?.message}>
              <Input aria-invalid={Boolean(createOrderForm.formState.errors.ticketTitle)} {...createOrderForm.register("ticketTitle")} />
            </FormField>
            <FormField label="Số lượng" error={createOrderForm.formState.errors.quantity?.message}>
              <Input aria-invalid={Boolean(createOrderForm.formState.errors.quantity)} {...createOrderForm.register("quantity")} className="mono" />
            </FormField>
            <FormField label="Đơn giá" error={createOrderForm.formState.errors.unitPrice?.message}>
              <Input aria-invalid={Boolean(createOrderForm.formState.errors.unitPrice)} {...createOrderForm.register("unitPrice")} className="mono" />
            </FormField>
            <Button
              type="submit"
              className="md:col-span-2 lg:col-span-3 gap-2"
              disabled={createOrderRecord.isPending}
            >
              <Plus className="size-4" />
              {createOrderRecord.isPending ? "Đang tạo..." : "Tạo đơn"}
            </Button>
          </form>
        </Panel>
      ) : null}
      </div>
    </AppShell>
  );
}
