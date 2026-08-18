"use client";

import { usePathname, useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, MoreHorizontal } from "lucide-react";

import { AppShell, Panel } from "@/components/shell/app-shell";
import { QrCode } from "@/components/ticket/qr-code";
import { RouteLine } from "@/components/route/route-line";
import {
  DetailBlock,
  MetaGrid,
  NoticeBox,
  SectionHeading,
  SeatCloud,
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
import {
  useCancelOrder,
  useConfirmOrder,
  useExpireOrder,
  useIssueTicket,
  useMarkOrderPendingPayment,
  useMarkOrderPaid,
  useOrder,
  useOrderSummary,
  useRefundOrder,
  useRemoveOrder,
  useUpdateOrderPassengers,
  useUpdateOrderSeatLabels,
} from "@/hooks/order.hook";
import { usePaymentsByOrderId } from "@/hooks/payment.hook";
import { useCreateVnpayPayment } from "@/hooks/payment.hook";
import { Input } from "@/components/ui/input";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  formatPaymentStatus,
  getOrderStatusTone,
  getPaymentStatusTone,
} from "@/lib/formatters";
import { CountdownTimer } from "@/components/motion/countdown-timer";

export default function OrderDetailPage() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const orderId = typeof params.id === "string" ? params.id : "";
  const isAdminView = pathname.startsWith("/admin");
  const isProfileView = pathname.startsWith("/profile");

  const orderQuery = useOrder(orderId);
  const summaryQuery = useOrderSummary(orderId);
  const paymentsQuery = usePaymentsByOrderId(orderId, Boolean(orderId));
  const markPaid = useMarkOrderPaid();
  const createVnpayPayment = useCreateVnpayPayment();
  const markPendingPayment = useMarkOrderPendingPayment();
  const confirm = useConfirmOrder();
  const issueTicket = useIssueTicket();
  const cancelOrder = useCancelOrder();
  const expireOrder = useExpireOrder();
  const refundOrder = useRefundOrder();
  const removeOrder = useRemoveOrder();
  const updatePassengers = useUpdateOrderPassengers();
  const updateSeatLabels = useUpdateOrderSeatLabels();

  const [seatLabelsInput, setSeatLabelsInput] = useState("");
  const [passengerNameInput, setPassengerNameInput] = useState("");
  const [passengerPhoneInput, setPassengerPhoneInput] = useState("");

  const isMutating =
    markPaid.isPending ||
    markPendingPayment.isPending ||
    confirm.isPending ||
    issueTicket.isPending ||
    cancelOrder.isPending ||
    expireOrder.isPending ||
    refundOrder.isPending ||
    removeOrder.isPending ||
    updatePassengers.isPending ||
    updateSeatLabels.isPending;

  const order = orderQuery.data;
  const summary = summaryQuery.data;
  const payments = paymentsQuery.data ?? [];

  return (
    <AppShell
      embedded={isProfileView}
      title={
        isProfileView
          ? "Chi tiết đơn của tôi"
          : isAdminView
            ? "Quản lý đơn hàng"
            : "Chi tiết đơn hàng"
      }
      description="Theo dõi hành trình, hành khách, ghế đã chọn, tổng tiền và trạng thái xử lý."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={isAdminView ? "/admin/orders" : isProfileView ? "/profile/orders" : "/orders"}>
              <ChevronLeft className="size-3.5" aria-hidden />
              Quay lại
            </Link>
          </Button>
          {isAdminView ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" disabled={!orderId || isMutating}>
                  <MoreHorizontal className="size-4" aria-hidden />
                  Thao tác
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={() => markPendingPayment.mutate({ orderId })}>
                  Chờ thanh toán
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => markPaid.mutate({ orderId })}>
                  Đánh dấu đã thanh toán
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => confirm.mutate({ orderId })}>
                  Xác nhận đơn
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => issueTicket.mutate({ orderId })}>
                  Phát hành vé
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => expireOrder.mutate({ orderId })}>
                  Đánh dấu hết hạn
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => refundOrder.mutate({ orderId })}>
                  Hoàn tiền
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => cancelOrder.mutate({ orderId, payload: { reason: "Cancelled from UI" } })}
                >
                  Huỷ đơn
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => removeOrder.mutate({ orderId })}>
                  Xoá đơn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {!isAdminView && order && (order.status === 0 || order.status === 1) ? (
            <Button
              type="button"
              size="sm"
              disabled={!orderId || createVnpayPayment.isPending}
              onClick={() => {
                createVnpayPayment.mutate(
                  {
                    orderId,
                    orderInfo: `Thanh toan don hang ${compactId(orderId)}`,
                  },
                  {
                    onSuccess: (data) => {
                      window.location.assign(data.paymentUrl);
                    },
                  },
                );
              }}
            >
              {createVnpayPayment.isPending
                ? "Đang chuyển..."
                : "Thanh toán qua VNPay"}
            </Button>
          ) : null}
          {!isAdminView ? <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!orderId || isMutating}
            onClick={() =>
              cancelOrder.mutate({ orderId, payload: { reason: "Cancelled from UI" } })
            }
          >
            Huỷ đơn
          </Button> : null}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          eyebrow="Chi tiết đơn"
          title={order?.ticketTitle ?? "Thông tin đơn hàng"}
          description="Thông tin hành trình, hành khách và ghế đã chọn."
        >
          <div className="space-y-8">
            <SectionHeading
              eyebrow="Đơn hàng"
              title={order?.trainNumber ?? "Đang tải đơn"}
              description="Tổng quan đặt chỗ và trạng thái hiện tại."
              action={
                order ? (
                  <StatusBadge
                    label={formatOrderStatus(order.status)}
                    tone={getOrderStatusTone(order.status)}
                  />
                ) : null
              }
            />

            {order ? (
              <>
                <MetaGrid
                  items={[
                    { label: "Mã đơn", value: <span className="mono tabular-nums">{compactId(order.id)}</span> },
                    { label: "Mã người dùng", value: <span className="mono tabular-nums">{compactId(order.userId)}</span> },
                    {
                      label: "Tuyến đường",
                      value: `${order.departureStationName ?? order.departureStationCode ?? "?"} → ${order.arrivalStationName ?? order.arrivalStationCode ?? "?"}`,
                    },
                    { label: "Giờ khởi hành", value: <span className="mono tabular-nums">{formatDateTime(order.departureTime)}</span> },
                    { label: "Giờ đến nơi", value: <span className="mono tabular-nums">{formatDateTime(order.arrivalTime)}</span> },
                    { label: "Ngày tạo", value: <span className="mono tabular-nums">{formatDateTime(order.createdAt)}</span> },
                  ]}
                />

                <div className="py-1">
                  <RouteLine compact aria-hidden />
                </div>

                <div className="border border-border bg-card px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                    Ghế đã chọn
                  </p>
                  <div className="mt-4">
                    <SeatCloud labels={order.seatLabels} />
                  </div>
                </div>

                <div className="border border-border bg-secondary/40 px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                    Danh sách hành khách
                  </p>
                  <div className="mt-4 space-y-3">
                    {order.passengers.length === 0 ? (
                      <p className="text-sm text-ink-muted">
                        Chưa có hành khách trong đơn này.
                      </p>
                    ) : (
                      order.passengers.map((passenger, index) => (
                        <div
                          key={`${passenger.fullName}-${index}`}
                          className="border border-border bg-card px-4 py-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-display text-base font-semibold text-ink">
                                {passenger.fullName}
                              </p>
                              <p className="mt-1 text-sm text-ink-muted">
                                {passenger.passengerType}
                                {passenger.phoneNumber ? ` · ${passenger.phoneNumber}` : ""}
                                {passenger.identityNumber ? ` · ${passenger.identityNumber}` : ""}
                              </p>
                            </div>
                            <span className="text-[11px] mono text-ink-subtle">
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {orderQuery.isLoading ? (
              <p className="text-sm text-ink-muted">Đang tải đơn hàng...</p>
            ) : null}
            {orderQuery.isError ? (
              <p className="text-sm text-destructive">
                Không tải được đơn hàng. Vui lòng thử lại sau.
              </p>
            ) : null}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel
            eyebrow="Tổng kết"
            title="Tổng thanh toán"
            description="Số lượng, giá vé và trạng thái phát hành."
          >
            {summary ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBlock label="Số lượng" value={<span className="mono tabular-nums">{String(summary.quantity)}</span>} />
                <DetailBlock label="Số ghế" value={<span className="mono tabular-nums">{String(summary.seatCount)}</span>} />
                <DetailBlock label="Hành khách" value={<span className="mono tabular-nums">{String(summary.passengerCount)}</span>} />
                <DetailBlock label="Đơn giá" value={<span className="mono tabular-nums">{formatCurrency(summary.unitPrice)}</span>} />
                <DetailBlock label="Tổng tiền" value={<span className="mono tabular-nums text-base font-semibold text-ink">{formatCurrency(summary.totalPrice)}</span>} />
                <DetailBlock label="Phát hành vé" value={summary.ticketIssued ? "Đã phát hành" : "Chưa phát hành"} />
              </div>
            ) : null}
            {summaryQuery.isLoading ? (
              <p className="text-sm text-ink-muted">Đang tải tổng thanh toán...</p>
            ) : null}
            {!isAdminView && order && (order.status === 0 || order.status === 1) ? (
              <div className="mt-5 space-y-4">
                <CountdownTimer createdAt={order.createdAt} expiryMinutes={10} />
                <NoticeBox
                  title="Đơn đang chờ hoàn tất thanh toán"
                  description="Bạn có thể tiếp tục thanh toán từ nút hành động phía trên để giữ nguyên luồng đặt vé hiện tại."
                  tone="warning"
                />
              </div>
            ) : null}
          </Panel>

          <Panel
            eyebrow="Lịch sử"
            title="Lịch sử thanh toán"
            description="Các giao dịch thanh toán gắn với đơn hàng này."
          >
            <div className="space-y-3">
              {payments.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Chưa có thanh toán nào cho đơn này.
                </p>
              ) : (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between border border-border bg-card px-4 py-3.5"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="mono text-sm font-medium text-ink tabular-nums truncate">
                        {compactId(payment.transactionId)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        <span className="mono tabular-nums">{formatCurrency(Number(payment.amount))}</span>
                        <span className="mx-1.5 text-ink-subtle">·</span>
                        <span className="mono tabular-nums">{formatDateTime(payment.updatedAt)}</span>
                      </p>
                    </div>
                    <StatusBadge
                      label={formatPaymentStatus(payment.status)}
                      tone={getPaymentStatusTone(payment.status)}
                    />
                  </div>
                ))
              )}
              {paymentsQuery.isLoading ? (
                <p className="text-sm text-ink-muted">Đang tải thanh toán...</p>
              ) : null}
            </div>
          </Panel>

          {order ? (
            <Panel
              eyebrow="Vé điện tử"
              title="Thông tin vé điện tử"
              description="Mã vé, QR và thông tin toa ghế dùng sau khi hoàn tất đơn."
            >
              <div className="space-y-5">
                {order.ticketCode && order.qrPayload ? (
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex shrink-0 flex-col items-center gap-3">
                      <div className="border border-border bg-card p-4">
                        <QrCode value={order.qrPayload} size={160} />
                      </div>
                      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
                        Quét để xác nhận
                      </p>
                    </div>
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="border-l-2 border-primary bg-primary-soft/50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                          Mã vé
                        </p>
                        <p className="mt-1.5 break-all mono text-base font-semibold text-ink tabular-nums">
                          {order.ticketCode}
                        </p>
                      </div>
                      <MetaGrid
                        items={[
                          { label: "Toa", value: order.coachCode ?? "—" },
                          { label: "Hạng ghế", value: order.seatClass ?? "—" },
                          { label: "Loại ghế", value: order.seatType ?? "—" },
                          { label: "Lý do huỷ", value: order.cancelReason ?? "Không có" },
                        ]}
                        columns={2}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-6 text-center">
                    <div className="flex size-14 items-center justify-center border border-border bg-muted text-ink-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h6v6H3V3zm0 12h6v6H3v-6zm12-12h6v6h-6V3zm0 12h6v6h-6v-6zM9 9h1v1H9V9zm0 6h1v1H9v-1zm6 0h1v1h-1v-1zm0-6h1v1h-1V9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-display text-base font-semibold text-ink">Vé chưa được phát hành</p>
                      <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                        QR code sẽ xuất hiện sau khi thanh toán hoàn tất và vé được phát hành.
                      </p>
                    </div>
                    <div className="w-full">
                      <MetaGrid
                        items={[
                          { label: "Toa", value: order.coachCode ?? "—" },
                          { label: "Hạng ghế", value: order.seatClass ?? "—" },
                        ]}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          ) : null}

          {order ? (
            <Panel
              eyebrow="Vận hành"
              title="Điều chỉnh đơn"
              description="Cập nhật nhanh hành khách hoặc ghế khi cần hỗ trợ."
            >
              <div className="space-y-3">
                <Input
                  placeholder="Seat labels CSV (vd: A1,A2)"
                  value={seatLabelsInput}
                  onChange={(event) => setSeatLabelsInput(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!orderId || updateSeatLabels.isPending}
                  onClick={() =>
                    updateSeatLabels.mutate({
                      orderId,
                      payload: {
                        seatLabels: seatLabelsInput
                          .split(",")
                          .map((value) => value.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                >
                  {updateSeatLabels.isPending ? "Đang cập nhật..." : "Cập nhật ghế"}
                </Button>
                <div className="soft-divider" />
                <Input
                  placeholder="Tên hành khách"
                  value={passengerNameInput}
                  onChange={(event) => setPassengerNameInput(event.target.value)}
                />
                <Input
                  placeholder="Số điện thoại"
                  value={passengerPhoneInput}
                  onChange={(event) => setPassengerPhoneInput(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!orderId || !passengerNameInput || updatePassengers.isPending}
                  onClick={() =>
                    updatePassengers.mutate({
                      orderId,
                      payload: {
                        passengers: [
                          {
                            fullName: passengerNameInput,
                            passengerType: "ADULT",
                            identityNumber: null,
                            phoneNumber: passengerPhoneInput || null,
                          },
                        ],
                      },
                    })
                  }
                >
                  {updatePassengers.isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật hành khách"}
                </Button>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
