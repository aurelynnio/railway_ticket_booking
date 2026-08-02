"use client";

import { usePathname, useParams } from "next/navigation";
import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import { QrCode } from "@/components/qr-code";
import {
  DetailBlock,
  MetaGrid,
  NoticeBox,
  SectionHeading,
  SeatCloud,
  StatusBadge,
  compactId,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
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
import { CountdownTimer } from "@/components/countdown-timer";

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
      title={
        isProfileView
          ? "Chi tiết đơn của tôi"
          : isAdminView
            ? "Quản lý đơn hàng"
            : "Chi tiết đơn hàng"
      }
      description="Theo dõi hành trình, hành khách, ghế đã chọn, tổng tiền và trạng thái xử lý."
      actions={
        <div className="flex flex-wrap gap-2">
          {isAdminView ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={!orderId || isMutating}
                onClick={() => markPendingPayment.mutate({ orderId })}
              >
                Chờ thanh toán
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!orderId || isMutating}
                onClick={() => markPaid.mutate({ orderId })}
              >
                Đánh dấu đã thanh toán
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!orderId || isMutating}
                onClick={() => confirm.mutate({ orderId })}
              >
                Xác nhận
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!orderId || isMutating}
                onClick={() => issueTicket.mutate({ orderId })}
              >
                Phát hành vé
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!orderId || isMutating}
                onClick={() => expireOrder.mutate({ orderId })}
              >
                Hết hạn
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!orderId || isMutating}
                onClick={() => refundOrder.mutate({ orderId })}
              >
                Hoàn tiền
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={!orderId || isMutating}
                onClick={() => removeOrder.mutate({ orderId })}
              >
                Xoá
              </Button>
            </>
          ) : null}
          {!isAdminView && order && (order.status === 0 || order.status === 1) ? (
            <Button
              type="button"
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
          <Button
            type="button"
            variant="destructive"
            disabled={!orderId || isMutating}
            onClick={() =>
              cancelOrder.mutate({ orderId, payload: { reason: "Cancelled from UI" } })
            }
          >
            Huỷ đơn
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          title={order?.ticketTitle ?? "Thông tin đơn hàng"}
          description="Thông tin hành trình, hành khách và ghế đã chọn."
        >
          <div className="space-y-5">
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
                    { label: "Mã đơn", value: compactId(order.id) },
                    { label: "Người dùng", value: compactId(order.userId) },
                    {
                      label: "Tuyến",
                      value: `${order.departureStationName ?? order.departureStationCode ?? "?"} đến ${order.arrivalStationName ?? order.arrivalStationCode ?? "?"}`,
                    },
                    { label: "Khởi hành", value: formatDateTime(order.departureTime) },
                    { label: "Đến nơi", value: formatDateTime(order.arrivalTime) },
                    { label: "Ngày tạo", value: formatDateTime(order.createdAt) },
                  ]}
                />

                <div className="rounded-lg border border-border/80 bg-background px-5 py-5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Ghế đã chọn
                  </p>
                  <div className="mt-3">
                    <SeatCloud labels={order.seatLabels} />
                  </div>
                </div>

                <div className="rounded-lg border border-border/80 bg-secondary/45 px-5 py-5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Hành khách
                  </p>
                  <div className="mt-4 grid gap-3">
                    {order.passengers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Chưa có hành khách trong đơn này.
                      </p>
                    ) : (
                      order.passengers.map((passenger, index) => (
                        <div
                          key={`${passenger.fullName}-${index}`}
                          className="rounded-lg border border-border/80 bg-background px-4 py-4"
                        >
                          <p className="font-medium text-foreground">
                            {passenger.fullName}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {passenger.passengerType} •{" "}
                            {passenger.phoneNumber ?? "Chưa có số điện thoại"} •{" "}
                            {passenger.identityNumber ?? "Chưa có giấy tờ"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {orderQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải đơn hàng...</p>
            ) : null}
            {orderQuery.isError ? (
              <p className="text-sm text-rose-700">
                Không tải được đơn hàng. Vui lòng thử lại sau.
              </p>
            ) : null}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel
            title="Tổng thanh toán"
            description="Số lượng, giá vé và trạng thái phát hành."
          >
            {summary ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBlock label="Số lượng" value={String(summary.quantity)} />
                <DetailBlock label="Số ghế" value={String(summary.seatCount)} />
                <DetailBlock label="Hành khách" value={String(summary.passengerCount)} />
                <DetailBlock label="Đơn giá" value={formatCurrency(summary.unitPrice)} />
                <DetailBlock label="Tổng tiền" value={formatCurrency(summary.totalPrice)} />
                <DetailBlock label="Đã phát hành" value={summary.ticketIssued ? "Có" : "Chưa"} />
              </div>
            ) : null}
            {summaryQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải tổng thanh toán...</p>
            ) : null}
            {!isAdminView && order && (order.status === 0 || order.status === 1) ? (
              <div className="mt-4 space-y-3">
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
            title="Thanh toán liên quan"
            description="Các giao dịch thanh toán gắn với đơn hàng này."
          >
            <div className="grid gap-3">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có thanh toán nào cho đơn này.
                </p>
              ) : (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-border/80 bg-background px-4 py-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {compactId(payment.transactionId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Number(payment.amount))} • {formatDateTime(payment.updatedAt)}
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
                <p className="text-sm text-muted-foreground">Đang tải thanh toán...</p>
              ) : null}
            </div>
          </Panel>

          {order ? (
            <Panel
              title="Thông tin phát hành"
              description="Mã vé, QR và thông tin toa ghế dùng sau khi hoàn tất đơn."
            >
              <div className="space-y-5">
                {order.ticketCode && order.qrPayload ? (
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex shrink-0 flex-col items-center gap-3">
                      <div className="rounded-xl border border-border/80 bg-white p-3 shadow-sm">
                        <QrCode value={order.qrPayload} size={160} />
                      </div>
                      <p className="text-center text-xs font-medium text-muted-foreground">
                        Quét để xác nhận vé
                      </p>
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="rounded-lg bg-accent/50 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Mã vé
                        </p>
                        <p className="mt-1.5 break-all font-mono text-base font-semibold text-foreground">
                          {order.ticketCode}
                        </p>
                      </div>
                      <MetaGrid
                        items={[
                          { label: "Toa", value: order.coachCode ?? "Chưa có" },
                          { label: "Hạng ghế", value: order.seatClass ?? "Chưa có" },
                          { label: "Loại ghế", value: order.seatType ?? "Chưa có" },
                          { label: "Lý do huỷ", value: order.cancelReason ?? "Không có" },
                        ]}
                        columns={2}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h6v6H3V3zm0 12h6v6H3v-6zm12-12h6v6h-6V3zm0 12h6v6h-6v-6zM9 9h1v1H9V9zm0 6h1v1H9v-1zm6 0h1v1h-1v-1zm0-6h1v1h-1V9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Vé chưa được phát hành</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        QR code sẽ xuất hiện sau khi thanh toán hoàn tất và vé được phát hành.
                      </p>
                    </div>
                    <MetaGrid
                      items={[
                        { label: "Toa", value: order.coachCode ?? "Chưa có" },
                        { label: "Hạng ghế", value: order.seatClass ?? "Chưa có" },
                      ]}
                    />
                  </div>
                )}
              </div>
            </Panel>
          ) : null}

          {order ? (
            <Panel
              title="Điều chỉnh đơn"
              description="Cập nhật nhanh hành khách hoặc ghế khi cần hỗ trợ."
            >
              <div className="grid gap-3">
                <Input
                  placeholder="Seat labels CSV"
                  value={seatLabelsInput}
                  onChange={(event) => setSeatLabelsInput(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
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
