"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, ArrowRight, RefreshCw, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppShell, Panel } from "@/components/app-shell";
import { BarChart, DonutStat } from "@/components/analytics-chart";
import { FormField } from "@/components/form-field";
import {
  NoticeBox,
  EmptyState,
  MetaGrid,
  StatCard,
  StatusBadge,
  SurfaceLink,
  compactId,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useCancelOrder,
  useConfirmOrder,
  useCreateOrderRecord,
  useIssueTicket,
  useMarkOrderPaid,
  useOrders,
} from "@/hooks/order.hook";
import {
  useCancelPayment,
  useMarkPaymentFailed,
  useMarkPaymentPaid,
  useMarkPaymentProcessing,
  usePayments,
} from "@/hooks/payment.hook";
import {
  useCloseSale,
  useCreateTicket,
  useOpenSale,
  usePrepareStock,
  usePublishTicket,
  useTickets,
  useUnpublishTicket,
} from "@/hooks/ticket.hook";
import {
  useCreateUser,
  useListUsers,
  useUserByEmail,
} from "@/hooks/user.hook";
import { OrderStatus, PaymentStatus } from "@/lib/api-types";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  formatPaymentStatus,
  formatTicketStatus,
  getOrderStatusTone,
  getPaymentStatusTone,
  getTicketStatusTone,
} from "@/lib/formatters";
import instance from "@/lib/http";
import {
  emailField,
  integerText,
  optionalDateTimeText,
  optionalText,
  passwordField,
  requiredText,
  toOptionalIsoDateTime,
  toOptionalString,
} from "@/lib/validation";

type HealthResult = {
  key: string;
  label: string;
  path: string;
  healthy: boolean;
  value: string;
};

const healthTargets = [
  { key: "auth", label: "Xác thực", path: "/auth/health" },
  { key: "users", label: "Người dùng", path: "/users/health" },
  { key: "tickets", label: "Vé", path: "/tickets/health" },
  { key: "orders", label: "Đơn hàng", path: "/orders/health" },
  { key: "payments", label: "Thanh toán", path: "/payments/health" },
  { key: "search", label: "Tra cứu", path: "/search/health" },
] as const;

const quickTicketSchema = z
  .object({
    title: requiredText("Title"),
    trainNumber: optionalText(),
    departureCode: requiredText("Departure code"),
    departureName: requiredText("Departure name"),
    arrivalCode: requiredText("Arrival code"),
    arrivalName: requiredText("Arrival name"),
    dateStart: optionalDateTimeText("Khởi hành"),
    dateEnd: optionalDateTimeText("Đến nơi"),
    coachCode: requiredText("Coach"),
    seatClass: requiredText("Seat class"),
    seatLabels: requiredText("Seat labels"),
    priceOriginal: integerText("Original price", 0),
  })
  .refine(
    (values) =>
      !values.dateStart ||
      !values.dateEnd ||
      new Date(values.dateEnd).getTime() >= new Date(values.dateStart).getTime(),
    {
      message: "Giờ đến phải sau giờ khởi hành",
      path: ["dateEnd"],
    },
  );

const quickOrderSchema = z.object({
  userId: requiredText("Order user ID"),
  ticketId: requiredText("Ticket ID"),
  ticketItemId: requiredText("Ticket item ID"),
  ticketTitle: requiredText("Ticket title"),
  quantity: integerText("Quantity", 1),
  unitPrice: integerText("Unit price", 0),
  seatLabels: optionalText(),
});

const quickUserSchema = z.object({
  username: requiredText("Username"),
  email: emailField,
  password: passwordField,
});

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminPage() {
  const ticketsQuery = useTickets({ page: 1, limit: 6 });
  const ordersQuery = useOrders({ page: 1, limit: 6 });
  const paymentsQuery = usePayments({ page: 1, limit: 6 });
  const usersQuery = useListUsers(1, 6);
  const healthQuery = useQuery({
    queryKey: ["admin-health"],
    queryFn: async () => {
      const settled = await Promise.allSettled(
        healthTargets.map(async (target) => {
          const res = await instance.get(target.path);
          return {
            key: target.key,
            label: target.label,
            path: target.path,
            healthy: true,
            value:
              typeof res.data === "string"
                ? res.data
                : JSON.stringify(res.data),
          };
        }),
      );

      return settled.map((result, index): HealthResult => {
        const target = healthTargets[index];

        if (result.status === "fulfilled") {
          return result.value;
        }

        return {
          key: target.key,
          label: target.label,
          path: target.path,
          healthy: false,
          value: "Không phản hồi",
        };
      });
    },
  });

  const createTicket = useCreateTicket();
  const publishTicket = usePublishTicket();
  const unpublishTicket = useUnpublishTicket();
  const prepareStock = usePrepareStock();
  const openSale = useOpenSale();
  const closeSale = useCloseSale();

  const createOrderRecord = useCreateOrderRecord();
  const markOrderPaid = useMarkOrderPaid();
  const confirmOrder = useConfirmOrder();
  const issueTicket = useIssueTicket();
  const cancelOrder = useCancelOrder();

  const markPaymentProcessing = useMarkPaymentProcessing();
  const markPaymentPaid = useMarkPaymentPaid();
  const markPaymentFailed = useMarkPaymentFailed();
  const cancelPayment = useCancelPayment();

  const createUser = useCreateUser();
  const [lookupEmail, setLookupEmail] = useState("");
  const [submittedLookupEmail, setSubmittedLookupEmail] = useState("");
  const lookupQuery = useUserByEmail(
    submittedLookupEmail,
    Boolean(submittedLookupEmail),
  );
  const quickTicketForm = useForm<z.infer<typeof quickTicketSchema>>({
    resolver: zodResolver(quickTicketSchema),
    defaultValues: {
      title: "",
      trainNumber: "",
      departureCode: "",
      departureName: "",
      arrivalCode: "",
      arrivalName: "",
      dateStart: "",
      dateEnd: "",
      coachCode: "",
      seatClass: "",
      seatLabels: "",
      priceOriginal: "",
    },
  });
  const quickOrderForm = useForm<z.infer<typeof quickOrderSchema>>({
    resolver: zodResolver(quickOrderSchema),
    defaultValues: {
      userId: "",
      ticketId: "",
      ticketItemId: "",
      ticketTitle: "",
      quantity: "1",
      unitPrice: "0",
      seatLabels: "",
    },
  });
  const quickUserForm = useForm<z.infer<typeof quickUserSchema>>({
    resolver: zodResolver(quickUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const tickets = ticketsQuery.data?.data ?? [];
  const orders = ordersQuery.data?.data ?? [];
  const payments = paymentsQuery.data?.data ?? [];
  const users = usersQuery.data?.data ?? [];

  const totals = {
    tickets: ticketsQuery.data?.pagination.total ?? 0,
    orders: ordersQuery.data?.pagination.total ?? 0,
    payments: paymentsQuery.data?.pagination.total ?? 0,
    users: usersQuery.data?.pagination.total ?? 0,
  };

  const operationalSummary = {
    pendingOrders: orders.filter(
      (order) => order.status === OrderStatus.PendingPayment,
    ).length,
    paidPayments: payments.filter(
      (payment) => payment.status === PaymentStatus.Paid,
    ).length,
    draftTickets: tickets.filter((ticket) => ticket.status === 0).length,
    openTickets: tickets.filter((ticket) =>
      ticket.ticketItems.some((item) => item.saleOpen),
    ).length,
  };

  const anyHealthDown =
    healthQuery.data?.some((result) => !result.healthy) ?? false;

  return (
    <AppShell
      title="Trung tâm quản trị"
      description="Không gian điều hành tập trung cho vé, đơn hàng, thanh toán và tài khoản."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={healthQuery.isFetching}
            onClick={() => void healthQuery.refetch()}
          >
            <RefreshCw className="size-4" />
            {healthQuery.isFetching ? "Đang kiểm tra..." : "Trạng thái hệ thống"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/tickets/new">
              Tạo vé mới
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/search">
              Xem khu vực đặt vé
              <Search className="size-4" />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Tổng vé"
          value={String(totals.tickets)}
          helper={`${operationalSummary.openTickets} hành trình đang mở bán.`}
        />
        <StatCard
          label="Tổng đơn"
          value={String(totals.orders)}
          helper={`${operationalSummary.pendingOrders} đơn chờ thanh toán.`}
        />
        <StatCard
          label="Tổng giao dịch"
          value={String(totals.payments)}
          helper={`${operationalSummary.paidPayments} giao dịch đã hoàn tất.`}
        />
        <StatCard
          label="Tài khoản"
          value={String(totals.users)}
          helper="Tổng tài khoản đang quản lý."
        />
      </div>

      <Tabs defaultValue="overview" className="gap-5">
        <TabsList className="w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="tickets">Vé mới nhất</TabsTrigger>
          <TabsTrigger value="orders">Đơn & Thanh toán</TabsTrigger>
          <TabsTrigger value="create">Tạo nhanh</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DonutStat
              value={operationalSummary.openTickets}
              total={Math.max(totals.tickets, 1)}
              label="Tỷ lệ mở bán"
            />
            <DonutStat
              value={operationalSummary.paidPayments}
              total={Math.max(totals.payments, 1)}
              label="Giao dịch thành công"
            />
            <DonutStat
              value={orders.filter((o) => o.status === OrderStatus.TicketIssued).length}
              total={Math.max(orders.length, 1)}
              label="Vé đã phát hành"
            />
            <DonutStat
              value={operationalSummary.pendingOrders}
              total={Math.max(totals.orders, 1)}
              label="Chờ thanh toán"
            />
          </div>

          <Panel
            title="Phân tích vận hành"
            description="Tổng quan trạng thái vé, đơn hàng và thanh toán trong kỳ hiện tại."
          >
            <div className="grid gap-6 md:grid-cols-3">
              <BarChart
                title="Trạng thái vé"
                data={[
                  { label: "Nháp", value: operationalSummary.draftTickets, color: "var(--muted-foreground)" },
                  { label: "Mở bán", value: operationalSummary.openTickets, color: "var(--primary)" },
                  { label: "Tổng", value: totals.tickets, color: "var(--accent-foreground)" },
                ]}
              />
              <BarChart
                title="Trạng thái đơn"
                data={[
                  { label: "Chờ TT", value: operationalSummary.pendingOrders, color: "var(--warning)" },
                  { label: "Hoàn tất", value: orders.filter((o) => o.status === OrderStatus.TicketIssued).length, color: "var(--success)" },
                  { label: "Tổng", value: totals.orders, color: "var(--accent-foreground)" },
                ]}
              />
              <BarChart
                title="Giao dịch"
                data={[
                  { label: "Hoàn tất", value: operationalSummary.paidPayments, color: "var(--success)" },
                  { label: "Chờ", value: payments.filter((p) => p.status === PaymentStatus.Pending).length, color: "var(--warning)" },
                  { label: "Tổng", value: totals.payments, color: "var(--accent-foreground)" },
                ]}
              />
            </div>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Panel
              title="Trạng thái hệ thống"
              description="Kiểm tra nhanh phản hồi của các phân hệ chính trước khi thao tác."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {(healthQuery.data ?? []).map((result) => (
                  <div
                    key={result.key}
                    className="rounded-lg border border-border/80 bg-secondary/45 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{result.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {result.path}
                        </p>
                      </div>
                      <StatusBadge
                        label={result.healthy ? "Ổn định" : "Lỗi"}
                        tone={result.healthy ? "positive" : "danger"}
                      />
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {result.value}
                    </p>
                  </div>
                ))}
                {!healthQuery.data ? (
                  <EmptyState
                    title="Chưa có trạng thái"
                    description="Bấm kiểm tra để cập nhật tình trạng các phân hệ."
                  />
                ) : null}
              </div>
            </Panel>

            <Panel
              title="Lối tắt điều hành"
              description="Đi tới các khu vực xử lý chính của ca vận hành."
            >
              <div className="grid gap-3">
                <SurfaceLink
                  href="/admin/tickets"
                  title="Kho vé"
                  description="Tạo, sửa, mở bán và quản lý từng hạng ghế."
                />
                <SurfaceLink
                  href="/admin/orders"
                  title="Đơn hàng"
                  description="Theo dõi trạng thái, hành khách và ghế đã chọn."
                />
                <SurfaceLink
                  href="/admin/payments"
                  title="Thanh toán"
                  description="Đối soát giao dịch và xử lý trạng thái thanh toán."
                />
                <SurfaceLink
                  href="/admin/users"
                  title="Người dùng"
                  description="Tạo, cập nhật và tra cứu tài khoản."
                />
              </div>
            </Panel>
          </div>

          {anyHealthDown ? (
            <NoticeBox
              title="Một hoặc nhiều phân hệ chưa sẵn sàng"
              description="Một số thao tác vận hành có thể tạm thời không thực hiện được."
              tone="danger"
            />
          ) : null}

          <Panel
            title="Tóm tắt hiện tại"
            description="Các trạng thái nổi bật trong dữ liệu đang hiển thị."
          >
            <MetaGrid
              columns={3}
              items={[
                { label: "Vé nháp", value: String(operationalSummary.draftTickets) },
                { label: "Đơn chờ thanh toán", value: String(operationalSummary.pendingOrders) },
                { label: "Thanh toán hoàn tất", value: String(operationalSummary.paidPayments) },
                { label: "Vé đang hiển thị", value: String(tickets.length) },
                { label: "Đơn đang hiển thị", value: String(orders.length) },
                { label: "Thanh toán đang hiển thị", value: String(payments.length) },
              ]}
            />
          </Panel>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-5">
          <Panel
            title="Vé mới nhất"
            description="Mở nhanh vé cần điều chỉnh hoặc chuyển trạng thái bán."
          >
            <div className="grid gap-3">
              {tickets.map((ticket) => {
                const primaryItem = ticket.ticketItems[0];
                const isBusy =
                  publishTicket.isPending ||
                  unpublishTicket.isPending ||
                  prepareStock.isPending ||
                  openSale.isPending ||
                  closeSale.isPending;

                return (
                  <div
                    key={ticket.id}
                    className="rounded-lg border border-border/80 bg-secondary/45 px-4 py-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            label={formatTicketStatus(ticket.status)}
                            tone={getTicketStatusTone(ticket.status)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {compactId(ticket.id)}
                          </span>
                        </div>
                        <div>
                          <p className="font-heading text-lg font-semibold tracking-tight">
                            {ticket.title ?? "Vé chưa đặt tên"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {ticket.departureStationName ?? ticket.departureStationCode ?? "?"}
                            {" -> "}
                            {ticket.arrivalStationName ?? ticket.arrivalStationCode ?? "?"}
                            {" · "}
                            {formatDateTime(ticket.dateStart)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/tickets/${ticket.id}`}>Mở</Link>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => publishTicket.mutate({ ticketId: ticket.id })}
                        >
                          Công bố
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => unpublishTicket.mutate({ ticketId: ticket.id })}
                        >
                          Gỡ công bố
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() =>
                            prepareStock.mutate({
                              ticketId: ticket.id,
                              payload: { ticketItemId: primaryItem?.id },
                            })
                          }
                        >
                          Chuẩn bị
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() =>
                            openSale.mutate({
                              ticketId: ticket.id,
                              payload: { ticketItemId: primaryItem?.id },
                            })
                          }
                        >
                          Mở bán
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() => closeSale.mutate({ ticketId: ticket.id })}
                        >
                          Đóng bán
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {tickets.length === 0 ? (
                <EmptyState
                  title="Chưa có vé"
                  description="Tạo vé mới để bắt đầu quản lý tồn chỗ."
                />
              ) : null}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="orders" className="space-y-5">
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel
              title="Đơn mới nhất"
              description="Xử lý nhanh các bước thanh toán, xác nhận và phát hành vé."
            >
              <div className="grid gap-3">
                {orders.map((order) => {
                  const isBusy =
                    markOrderPaid.isPending ||
                    confirmOrder.isPending ||
                    issueTicket.isPending ||
                    cancelOrder.isPending;

                  return (
                    <div
                      key={order.id}
                      className="rounded-lg border border-border/80 bg-secondary/45 px-4 py-4"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <StatusBadge
                              label={formatOrderStatus(order.status)}
                              tone={getOrderStatusTone(order.status)}
                            />
                            <p className="mt-3 font-medium text-foreground">
                              {order.ticketTitle}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {compactId(order.id)} · {formatCurrency(order.totalPrice)}
                            </p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/orders/${order.id}`}>Mở</Link>
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => markOrderPaid.mutate({ orderId: order.id })}
                          >
                            Đã thanh toán
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => confirmOrder.mutate({ orderId: order.id })}
                          >
                            Xác nhận
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => issueTicket.mutate({ orderId: order.id })}
                          >
                            Phát hành
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() =>
                              cancelOrder.mutate({
                                orderId: order.id,
                                payload: { reason: "Cancelled from admin dashboard" },
                              })
                            }
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {orders.length === 0 ? (
                  <EmptyState
                    title="Chưa có đơn"
                    description="Các đơn mới sẽ xuất hiện tại đây."
                  />
                ) : null}
              </div>
            </Panel>

            <Panel
              title="Thanh toán mới nhất"
              description="Cập nhật nhanh trạng thái giao dịch."
            >
              <div className="grid gap-3">
                {payments.map((payment) => {
                  const isBusy =
                    markPaymentProcessing.isPending ||
                    markPaymentPaid.isPending ||
                    markPaymentFailed.isPending ||
                    cancelPayment.isPending;

                  return (
                    <div
                      key={payment.id}
                      className="rounded-lg border border-border/80 bg-secondary/45 px-4 py-4"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <StatusBadge
                              label={formatPaymentStatus(payment.status)}
                              tone={getPaymentStatusTone(payment.status)}
                            />
                            <p className="mt-3 font-medium text-foreground">
                              {formatCurrency(Number(payment.amount))}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {compactId(payment.transactionId)} · Đơn{" "}
                              {compactId(payment.orderId)}
                            </p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/payments/${payment.id}`}>Mở</Link>
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => markPaymentProcessing.mutate({ id: payment.id })}
                          >
                            Xử lý
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => markPaymentPaid.mutate({ id: payment.id })}
                          >
                            Đã trả
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => markPaymentFailed.mutate({ id: payment.id })}
                          >
                            Lỗi
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isBusy}
                            onClick={() => cancelPayment.mutate({ id: payment.id })}
                          >
                            Hủy
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {payments.length === 0 ? (
                  <EmptyState
                    title="Chưa có giao dịch"
                    description="Các giao dịch mới sẽ xuất hiện tại đây."
                  />
                ) : null}
              </div>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-5">
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel
              title="Tạo nhanh vé"
              description="Lập hành trình đầu tiên mà không cần rời dashboard."
            >
              <form
                className="grid gap-3 md:grid-cols-2"
                onSubmit={quickTicketForm.handleSubmit((values) => {
                  const seats = splitCsv(values.seatLabels);
                  createTicket.mutate(
                    {
                      title: values.title,
                      trainNumber: toOptionalString(values.trainNumber),
                      departureStationCode: values.departureCode,
                      departureStationName: values.departureName,
                      arrivalStationCode: values.arrivalCode,
                      arrivalStationName: values.arrivalName,
                      dateStart: toOptionalIsoDateTime(values.dateStart),
                      dateEnd: toOptionalIsoDateTime(values.dateEnd),
                      ticketItems: [
                        {
                          coachCode: values.coachCode,
                          seatClass: values.seatClass,
                          seatLabels: seats,
                          availableSeatLabels: seats,
                          stockInitial: seats.length,
                          stockAvailable: seats.length,
                          priceOriginal: values.priceOriginal,
                        },
                      ],
                    },
                    { onSuccess: () => quickTicketForm.reset() },
                  );
                })}
              >
                <FormField label="Tên vé" required error={quickTicketForm.formState.errors.title?.message}>
                  <Input aria-invalid={Boolean(quickTicketForm.formState.errors.title)} {...quickTicketForm.register("title")} />
                </FormField>
                <FormField label="Số tàu" error={quickTicketForm.formState.errors.trainNumber?.message}>
                  <Input aria-invalid={Boolean(quickTicketForm.formState.errors.trainNumber)} {...quickTicketForm.register("trainNumber")} />
                </FormField>
                <FormField label="Mã ga đi" required error={quickTicketForm.formState.errors.departureCode?.message}>
                  <Input aria-invalid={Boolean(quickTicketForm.formState.errors.departureCode)} {...quickTicketForm.register("departureCode")} />
                </FormField>
                <FormField label="Tên ga đi" required error={quickTicketForm.formState.errors.departureName?.message}>
                  <Input aria-invalid={Boolean(quickTicketForm.formState.errors.departureName)} {...quickTicketForm.register("departureName")} />
                </FormField>
                <FormField label="Mã ga đến" required error={quickTicketForm.formState.errors.arrivalCode?.message}>
                  <Input aria-invalid={Boolean(quickTicketForm.formState.errors.arrivalCode)} {...quickTicketForm.register("arrivalCode")} />
                </FormField>
                <FormField label="Tên ga đến" required error={quickTicketForm.formState.errors.arrivalName?.message}>
                  <Input aria-invalid={Boolean(quickTicketForm.formState.errors.arrivalName)} {...quickTicketForm.register("arrivalName")} />
                </FormField>
                <FormField label="Khởi hành" error={quickTicketForm.formState.errors.dateStart?.message}>
                  <Input type="datetime-local" aria-invalid={Boolean(quickTicketForm.formState.errors.dateStart)} {...quickTicketForm.register("dateStart")} />
                </FormField>
                <FormField label="Đến nơi" error={quickTicketForm.formState.errors.dateEnd?.message}>
                  <Input type="datetime-local" aria-invalid={Boolean(quickTicketForm.formState.errors.dateEnd)} {...quickTicketForm.register("dateEnd")} />
                </FormField>
                <FormField label="Mã toa" required error={quickTicketForm.formState.errors.coachCode?.message}>
                  <Input aria-invalid={Boolean(quickTicketForm.formState.errors.coachCode)} {...quickTicketForm.register("coachCode")} />
                </FormField>
                <FormField label="Hạng ghế" required error={quickTicketForm.formState.errors.seatClass?.message}>
                  <Input aria-invalid={Boolean(quickTicketForm.formState.errors.seatClass)} {...quickTicketForm.register("seatClass")} />
                </FormField>
                <FormField
                  className="md:col-span-2"
                  label="Danh sách ghế CSV"
                  hint="Ví dụ A1,A2,A3"
                  required
                  error={quickTicketForm.formState.errors.seatLabels?.message}
                >
                  <Textarea aria-invalid={Boolean(quickTicketForm.formState.errors.seatLabels)} {...quickTicketForm.register("seatLabels")} />
                </FormField>
                <FormField label="Giá gốc" required error={quickTicketForm.formState.errors.priceOriginal?.message}>
                  <Input aria-invalid={Boolean(quickTicketForm.formState.errors.priceOriginal)} {...quickTicketForm.register("priceOriginal")} />
                </FormField>
                <Button type="submit" disabled={createTicket.isPending}>
                  {createTicket.isPending ? "Đang tạo..." : "Tạo vé"}
                </Button>
              </form>
            </Panel>

            <Panel
              title="Tạo nhanh đơn"
              description="Dùng khi cần hỗ trợ đặt chỗ thủ công ngay từ dashboard."
            >
              <form
                className="grid gap-3 md:grid-cols-2"
                onSubmit={quickOrderForm.handleSubmit((values) =>
                  createOrderRecord.mutate(
                    {
                      userId: values.userId,
                      ticketId: values.ticketId,
                      ticketItemId: values.ticketItemId,
                      ticketTitle: values.ticketTitle,
                      quantity: Number(values.quantity),
                      unitPrice: Number(values.unitPrice),
                      seatLabels: splitCsv(values.seatLabels),
                    },
                    { onSuccess: () => quickOrderForm.reset() },
                  ),
                )}
              >
                <FormField label="Mã người dùng" required error={quickOrderForm.formState.errors.userId?.message}>
                  <Input aria-invalid={Boolean(quickOrderForm.formState.errors.userId)} {...quickOrderForm.register("userId")} />
                </FormField>
                <FormField label="Mã vé" required error={quickOrderForm.formState.errors.ticketId?.message}>
                  <Input aria-invalid={Boolean(quickOrderForm.formState.errors.ticketId)} {...quickOrderForm.register("ticketId")} />
                </FormField>
                <FormField label="Mã hạng ghế" required error={quickOrderForm.formState.errors.ticketItemId?.message}>
                  <Input aria-invalid={Boolean(quickOrderForm.formState.errors.ticketItemId)} {...quickOrderForm.register("ticketItemId")} />
                </FormField>
                <FormField label="Tên vé" required error={quickOrderForm.formState.errors.ticketTitle?.message}>
                  <Input aria-invalid={Boolean(quickOrderForm.formState.errors.ticketTitle)} {...quickOrderForm.register("ticketTitle")} />
                </FormField>
                <FormField label="Số lượng" required error={quickOrderForm.formState.errors.quantity?.message}>
                  <Input aria-invalid={Boolean(quickOrderForm.formState.errors.quantity)} {...quickOrderForm.register("quantity")} />
                </FormField>
                <FormField label="Đơn giá" required error={quickOrderForm.formState.errors.unitPrice?.message}>
                  <Input aria-invalid={Boolean(quickOrderForm.formState.errors.unitPrice)} {...quickOrderForm.register("unitPrice")} />
                </FormField>
                <FormField
                  className="md:col-span-2"
                  label="Danh sách ghế CSV"
                  error={quickOrderForm.formState.errors.seatLabels?.message}
                >
                  <Textarea aria-invalid={Boolean(quickOrderForm.formState.errors.seatLabels)} {...quickOrderForm.register("seatLabels")} />
                </FormField>
                <Button type="submit" className="md:col-span-2" disabled={createOrderRecord.isPending}>
                  {createOrderRecord.isPending ? "Đang tạo đơn..." : "Tạo đơn"}
                </Button>
              </form>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-5">
          <Panel
            title="Quản lý người dùng"
            description="Tạo tài khoản mới hoặc tìm nhanh theo email."
          >
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <form
                className="grid gap-3 md:grid-cols-4"
                onSubmit={quickUserForm.handleSubmit((values) =>
                  createUser.mutate(values, {
                    onSuccess: () => quickUserForm.reset(),
                  }),
                )}
              >
                <FormField label="Tên đăng nhập" required error={quickUserForm.formState.errors.username?.message}>
                  <Input aria-invalid={Boolean(quickUserForm.formState.errors.username)} {...quickUserForm.register("username")} />
                </FormField>
                <FormField label="Email" required error={quickUserForm.formState.errors.email?.message}>
                  <Input aria-invalid={Boolean(quickUserForm.formState.errors.email)} {...quickUserForm.register("email")} />
                </FormField>
                <FormField label="Mật khẩu" required error={quickUserForm.formState.errors.password?.message}>
                  <Input type="password" aria-invalid={Boolean(quickUserForm.formState.errors.password)} {...quickUserForm.register("password")} />
                </FormField>
                <div className="flex items-end">
                  <Button type="submit" disabled={createUser.isPending}>
                    {createUser.isPending ? "Đang tạo..." : "Tạo tài khoản"}
                  </Button>
                </div>
              </form>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  placeholder="Tìm theo email"
                  value={lookupEmail}
                  onChange={(event) => setLookupEmail(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!lookupEmail}
                  onClick={() => setSubmittedLookupEmail(lookupEmail)}
                >
                  Tìm
                </Button>
                {lookupQuery.data ? (
                  <Button asChild variant="ghost" className="md:col-span-2">
                    <Link href={`/admin/users/${lookupQuery.data.id}`}>
                      Mở {lookupQuery.data.email ?? compactId(lookupQuery.data.id)}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </Panel>

          <Panel
            title="Người dùng mới nhất"
            description="Mở nhanh hồ sơ tài khoản cần kiểm tra."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="rounded-lg border border-border/80 bg-secondary/45 px-4 py-4 transition-colors hover:bg-muted/35"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <Activity className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {user.name ?? user.username ?? user.email ?? compactId(user.id)}
                      </p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {user.email ?? "Chưa có email"}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {user.username ?? "Chưa có tên đăng nhập"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cập nhật{" "}
                        {formatDateTime(
                          typeof user.updatedAt === "string" ? user.updatedAt : null,
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
