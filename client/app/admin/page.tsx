"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  RefreshCw,
  Search,
} from "lucide-react";

import { AppShell, Panel } from "@/components/app-shell";
import {
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
  useCancelOrder,
  useConfirmOrder,
  useCreateOrderRecord,
  useIssueTicket,
  useMarkOrderPaid,
  useOrders,
} from "@/hooks/order.hook";
import {
  useCancelPayment,
  useCreatePayment,
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

type HealthResult = {
  key: string;
  label: string;
  path: string;
  healthy: boolean;
  value: string;
};

const healthTargets = [
  { key: "tickets", label: "Tickets", path: "/tickets/health" },
  { key: "orders", label: "Orders", path: "/orders/health" },
  { key: "payments", label: "Payments", path: "/payments/health" },
  { key: "search", label: "Search", path: "/search/health" },
] as const;

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
          value: "Unavailable",
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

  const createPayment = useCreatePayment();
  const markPaymentProcessing = useMarkPaymentProcessing();
  const markPaymentPaid = useMarkPaymentPaid();
  const markPaymentFailed = useMarkPaymentFailed();
  const cancelPayment = useCancelPayment();

  const createUser = useCreateUser();

  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketTrain, setTicketTrain] = useState("");
  const [ticketFromCode, setTicketFromCode] = useState("");
  const [ticketFromName, setTicketFromName] = useState("");
  const [ticketToCode, setTicketToCode] = useState("");
  const [ticketToName, setTicketToName] = useState("");
  const [ticketStart, setTicketStart] = useState("");
  const [ticketEnd, setTicketEnd] = useState("");
  const [ticketCoach, setTicketCoach] = useState("");
  const [ticketSeatClass, setTicketSeatClass] = useState("");
  const [ticketSeats, setTicketSeats] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");

  const [orderUserId, setOrderUserId] = useState("");
  const [orderTicketId, setOrderTicketId] = useState("");
  const [orderTicketItemId, setOrderTicketItemId] = useState("");
  const [orderTitle, setOrderTitle] = useState("");
  const [orderQuantity, setOrderQuantity] = useState("1");
  const [orderUnitPrice, setOrderUnitPrice] = useState("0");
  const [orderSeats, setOrderSeats] = useState("");

  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentUserId, setPaymentUserId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("manual");

  const [newUsername, setNewUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [submittedLookupEmail, setSubmittedLookupEmail] = useState("");
  const lookupQuery = useUserByEmail(
    submittedLookupEmail,
    Boolean(submittedLookupEmail),
  );

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
      description="Theo dõi vé, đơn hàng, thanh toán và người dùng trong một không gian vận hành thống nhất."
      actions={
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
              Xem trang đặt vé
              <Search className="size-4" />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Tickets"
          value={String(totals.tickets)}
          helper={`${operationalSummary.openTickets} hành trình đang mở bán.`}
        />
        <StatCard
          label="Orders"
          value={String(totals.orders)}
          helper={`${operationalSummary.pendingOrders} đơn chờ thanh toán.`}
        />
        <StatCard
          label="Payments"
          value={String(totals.payments)}
          helper={`${operationalSummary.paidPayments} giao dịch đã hoàn tất.`}
        />
        <StatCard
          label="Users"
          value={String(totals.users)}
          helper="Tổng tài khoản đang quản lý."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Trạng thái hệ thống"
          description="Kiểm tra nhanh khả năng phản hồi của các phân hệ chính."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {(healthQuery.data ?? []).map((result) => (
              <div
                key={result.key}
                className="rounded-lg bg-muted/35 px-4 py-4 border border-border"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{result.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {result.path}
                    </p>
                  </div>
                  <StatusBadge
                    label={result.healthy ? "Online" : "Down"}
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
          title="Khu vực quản lý"
          description="Mở nhanh các module cần xử lý trong ngày."
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
        <div className="rounded-lg bg-destructive px-5 py-4 text-sm text-white">
          Một hoặc nhiều phân hệ chưa sẵn sàng. Một số thao tác có thể tạm thời
          không thực hiện được.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Tạo nhanh vé"
          description="Thiết lập hành trình và hạng ghế đầu tiên."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Title"
              value={ticketTitle}
              onChange={(event) => setTicketTitle(event.target.value)}
            />
            <Input
              placeholder="Train number"
              value={ticketTrain}
              onChange={(event) => setTicketTrain(event.target.value)}
            />
            <Input
              placeholder="Departure code"
              value={ticketFromCode}
              onChange={(event) => setTicketFromCode(event.target.value)}
            />
            <Input
              placeholder="Departure name"
              value={ticketFromName}
              onChange={(event) => setTicketFromName(event.target.value)}
            />
            <Input
              placeholder="Arrival code"
              value={ticketToCode}
              onChange={(event) => setTicketToCode(event.target.value)}
            />
            <Input
              placeholder="Arrival name"
              value={ticketToName}
              onChange={(event) => setTicketToName(event.target.value)}
            />
            <Input
              type="datetime-local"
              value={ticketStart}
              onChange={(event) => setTicketStart(event.target.value)}
            />
            <Input
              type="datetime-local"
              value={ticketEnd}
              onChange={(event) => setTicketEnd(event.target.value)}
            />
            <Input
              placeholder="Coach"
              value={ticketCoach}
              onChange={(event) => setTicketCoach(event.target.value)}
            />
            <Input
              placeholder="Seat class"
              value={ticketSeatClass}
              onChange={(event) => setTicketSeatClass(event.target.value)}
            />
            <Textarea
              className="md:col-span-2"
              placeholder="Seat labels CSV, ví dụ A1,A2,A3"
              value={ticketSeats}
              onChange={(event) => setTicketSeats(event.target.value)}
            />
            <Input
              placeholder="Original price"
              value={ticketPrice}
              onChange={(event) => setTicketPrice(event.target.value)}
            />
            <Button
              type="button"
              disabled={!ticketTitle || createTicket.isPending}
              onClick={() => {
                const seats = splitCsv(ticketSeats);
                createTicket.mutate({
                  title: ticketTitle,
                  trainNumber: ticketTrain || undefined,
                  departureStationCode: ticketFromCode || undefined,
                  departureStationName: ticketFromName || undefined,
                  arrivalStationCode: ticketToCode || undefined,
                  arrivalStationName: ticketToName || undefined,
                  dateStart: ticketStart
                    ? new Date(ticketStart).toISOString()
                    : undefined,
                  dateEnd: ticketEnd ? new Date(ticketEnd).toISOString() : undefined,
                  ticketItems: [
                    {
                      coachCode: ticketCoach || undefined,
                      seatClass: ticketSeatClass || undefined,
                      seatLabels: seats,
                      availableSeatLabels: seats,
                      stockInitial: seats.length || undefined,
                      stockAvailable: seats.length || undefined,
                      priceOriginal: ticketPrice || undefined,
                    },
                  ],
                });
              }}
            >
              {createTicket.isPending ? "Đang tạo..." : "Tạo ticket"}
            </Button>
          </div>
        </Panel>

        <Panel
          title="Tạo nhanh đơn và thanh toán"
          description="Dùng khi cần hỗ trợ đặt chỗ hoặc đối soát thủ công."
        >
          <div className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Order user ID"
                value={orderUserId}
                onChange={(event) => setOrderUserId(event.target.value)}
              />
              <Input
                placeholder="Ticket ID"
                value={orderTicketId}
                onChange={(event) => setOrderTicketId(event.target.value)}
              />
              <Input
                placeholder="Ticket item ID"
                value={orderTicketItemId}
                onChange={(event) => setOrderTicketItemId(event.target.value)}
              />
              <Input
                placeholder="Ticket title"
                value={orderTitle}
                onChange={(event) => setOrderTitle(event.target.value)}
              />
              <Input
                type="number"
                min="1"
                placeholder="Quantity"
                value={orderQuantity}
                onChange={(event) => setOrderQuantity(event.target.value)}
              />
              <Input
                type="number"
                min="0"
                placeholder="Unit price"
                value={orderUnitPrice}
                onChange={(event) => setOrderUnitPrice(event.target.value)}
              />
              <Textarea
                className="md:col-span-2"
                placeholder="Seat labels CSV"
                value={orderSeats}
                onChange={(event) => setOrderSeats(event.target.value)}
              />
              <Button
                type="button"
                className="md:col-span-2"
                disabled={
                  !orderUserId ||
                  !orderTicketId ||
                  !orderTicketItemId ||
                  !orderTitle ||
                  createOrderRecord.isPending
                }
                onClick={() =>
                  createOrderRecord.mutate({
                    userId: orderUserId,
                    ticketId: orderTicketId,
                    ticketItemId: orderTicketItemId,
                    ticketTitle: orderTitle,
                    quantity: Number(orderQuantity) || 1,
                    unitPrice: Number(orderUnitPrice) || 0,
                    seatLabels: splitCsv(orderSeats),
                  })
                }
              >
                {createOrderRecord.isPending ? "Đang tạo đơn..." : "Tạo đơn"}
              </Button>
            </div>

            <div className="soft-divider" />

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Payment order ID"
                value={paymentOrderId}
                onChange={(event) => setPaymentOrderId(event.target.value)}
              />
              <Input
                placeholder="Payment user ID"
                value={paymentUserId}
                onChange={(event) => setPaymentUserId(event.target.value)}
              />
              <Input
                placeholder="Amount"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
              />
              <Input
                placeholder="Method"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              />
              <Button
                type="button"
                className="md:col-span-2"
                disabled={
                  !paymentOrderId ||
                  !paymentAmount ||
                  !paymentMethod ||
                  createPayment.isPending
                }
                onClick={() =>
                  createPayment.mutate({
                    orderId: paymentOrderId,
                    userId: paymentUserId || undefined,
                    amount: paymentAmount,
                    paymentMethod,
                  })
                }
              >
                {createPayment.isPending ? "Đang tạo thanh toán..." : "Tạo thanh toán"}
              </Button>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Quản lý người dùng"
        description="Tạo tài khoản mới hoặc tìm nhanh theo email."
      >
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              placeholder="Username"
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
            />
            <Input
              placeholder="Email"
              value={newUserEmail}
              onChange={(event) => setNewUserEmail(event.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={newUserPassword}
              onChange={(event) => setNewUserPassword(event.target.value)}
            />
            <Button
              type="button"
              disabled={
                !newUsername ||
                !newUserEmail ||
                !newUserPassword ||
                createUser.isPending
              }
              onClick={() => {
                createUser.mutate({
                  username: newUsername,
                  email: newUserEmail,
                  password: newUserPassword,
                });
                setNewUsername("");
                setNewUserEmail("");
                setNewUserPassword("");
              }}
            >
              {createUser.isPending ? "Đang tạo..." : "Tạo user"}
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              placeholder="Find user by email"
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
                className="rounded-lg bg-muted/25 px-4 py-4 border border-border"
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
                        {ticket.title ?? "Untitled ticket"}
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
                      Publish
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => unpublishTicket.mutate({ ticketId: ticket.id })}
                    >
                      Unpublish
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
                      Prepare
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
                      Open
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => closeSale.mutate({ ticketId: ticket.id })}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {tickets.length === 0 ? (
            <EmptyState
              title="Chưa có ticket"
                description="Tạo vé mới để bắt đầu quản lý tồn chỗ."
            />
          ) : null}
        </div>
      </Panel>

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
                  className="rounded-lg bg-muted/25 px-4 py-4 border border-border"
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
                        Paid
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => confirmOrder.mutate({ orderId: order.id })}
                      >
                        Confirm
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => issueTicket.mutate({ orderId: order.id })}
                      >
                        Issue
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
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {orders.length === 0 ? (
              <EmptyState
                title="Chưa có order"
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
                  className="rounded-lg bg-muted/25 px-4 py-4 border border-border"
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
                          {compactId(payment.transactionId)} · Order{" "}
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
                        Processing
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => markPaymentPaid.mutate({ id: payment.id })}
                      >
                        Paid
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => markPaymentFailed.mutate({ id: payment.id })}
                      >
                        Failed
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => cancelPayment.mutate({ id: payment.id })}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {payments.length === 0 ? (
              <EmptyState
                title="Chưa có payment"
                description="Các giao dịch mới sẽ xuất hiện tại đây."
              />
            ) : null}
          </div>
        </Panel>
      </div>

      <Panel
        title="Người dùng mới nhất"
        description="Mở nhanh hồ sơ tài khoản cần kiểm tra."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="rounded-lg bg-muted/25 px-4 py-4 border border-border transition-colors hover:bg-muted"
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
                    {user.email ?? "No email"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
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

      <Panel
        title="Tóm tắt hiện tại"
        description="Các trạng thái nổi bật trong dữ liệu đang hiển thị."
      >
        <MetaGrid
          columns={3}
          items={[
            {
              label: "Vé nháp",
              value: String(operationalSummary.draftTickets),
            },
            {
              label: "Đơn chờ thanh toán",
              value: String(operationalSummary.pendingOrders),
            },
            {
              label: "Thanh toán hoàn tất",
              value: String(operationalSummary.paidPayments),
            },
            {
              label: "Vé đang hiển thị",
              value: String(tickets.length),
            },
            {
              label: "Đơn đang hiển thị",
              value: String(orders.length),
            },
            {
              label: "Thanh toán đang hiển thị",
              value: String(payments.length),
            },
          ]}
        />
      </Panel>
    </AppShell>
  );
}
