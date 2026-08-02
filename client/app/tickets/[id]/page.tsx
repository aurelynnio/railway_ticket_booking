"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppShell, Panel } from "@/components/app-shell";
import { FormField } from "@/components/form-field";
import { RouteMap } from "@/components/route-map";
import {
  DetailBlock,
  MetaGrid,
  NoticeBox,
  SectionHeading,
  SeatCloud,
  StatusBadge,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSession } from "@/hooks/auth.hook";
import { useCreateOrder } from "@/hooks/order.hook";
import { useCreateVnpayPayment } from "@/hooks/payment.hook";
import {
  useAddTicketItem,
  useCloseSale,
  useOpenSale,
  usePrepareStock,
  usePublishTicket,
  useReleaseTicket,
  useRemoveTicket,
  useReserveTicket,
  useSeatMap,
  useTicket,
  useTicketAvailability,
  useUnpublishTicket,
  useUpdateTicket,
} from "@/hooks/ticket.hook";
import {
  formatCurrency,
  formatDateTime,
  formatTicketStatus,
  getTicketStatusTone,
} from "@/lib/formatters";
import { integerText, optionalText } from "@/lib/validation";

const createOrderSchema = z.object({
  passengerName: optionalText(),
  seatLabels: optionalText(),
  quantity: integerText("Số lượng", 1),
});

export default function TicketDetailPage() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const ticketId = typeof params.id === "string" ? params.id : "";
  const isAdminView = pathname.startsWith("/admin");

  const ticketQuery = useTicket(ticketId);
  const availabilityQuery = useTicketAvailability(ticketId);
  const seatMapQuery = useSeatMap(ticketId);
  const createOrder = useCreateOrder();
  const createVnpayPayment = useCreateVnpayPayment();
  const sessionQuery = useAuthSession();
  const sessionUserId = sessionQuery.data?.userId;
  const publishTicket = usePublishTicket();
  const unpublishTicket = useUnpublishTicket();
  const closeSale = useCloseSale();
  const prepareStock = usePrepareStock();
  const openSale = useOpenSale();
  const removeTicket = useRemoveTicket();
  const reserveTicket = useReserveTicket();
  const releaseTicket = useReleaseTicket();
  const addTicketItem = useAddTicketItem();
  const updateTicket = useUpdateTicket(ticketId);
  const createOrderForm = useForm<z.infer<typeof createOrderSchema>>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      passengerName: "",
      seatLabels: "",
      quantity: "1",
    },
  });

  const [selectedTicketItemId, setSelectedTicketItemId] = useState("");
  const [reservationSeatLabel, setReservationSeatLabel] = useState("");
  const [reservationQuantity, setReservationQuantity] = useState("1");
  const [newItemCoach, setNewItemCoach] = useState("");
  const [newItemSeatClass, setNewItemSeatClass] = useState("");
  const [newItemSeats, setNewItemSeats] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editTrainNumber, setEditTrainNumber] = useState("");
  const [editJourneyNote, setEditJourneyNote] = useState("");

  const ticket = ticketQuery.data;
  const resolvedSelectedTicketItemId =
    selectedTicketItemId || ticket?.ticketItems[0]?.id || "";

  const selectedItem = useMemo(
    () =>
      ticket?.ticketItems.find((item) => item.id === resolvedSelectedTicketItemId) ??
      ticket?.ticketItems[0] ??
      null,
    [resolvedSelectedTicketItemId, ticket?.ticketItems],
  );

  async function handleCreateOrder(values: z.infer<typeof createOrderSchema>) {
    if (!ticket || !selectedItem) {
      return;
    }

    const numericQuantity = Number(values.quantity);
    const unitPrice = selectedItem.priceFlash ?? selectedItem.priceOriginal ?? 0;

    const result = await createOrder.mutateAsync({
      userId: sessionUserId ?? "",
      ticketId: ticket.id,
      ticketItemId: selectedItem.id,
      ticketTitle: ticket.title ?? "Untitled ticket",
      trainNumber: ticket.trainNumber,
      departureStationCode: ticket.departureStationCode,
      departureStationName: ticket.departureStationName,
      arrivalStationCode: ticket.arrivalStationCode,
      arrivalStationName: ticket.arrivalStationName,
      departureTime: ticket.dateStart,
      arrivalTime: ticket.dateEnd,
      coachCode: selectedItem.coachCode,
      seatClass: selectedItem.seatClass,
      seatType: selectedItem.seatType,
      quantity: Number.isNaN(numericQuantity) ? 1 : numericQuantity,
      unitPrice,
      seatLabels: values.seatLabels
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
        passengers: values.passengerName
          ? [{ fullName: values.passengerName.trim(), passengerType: "ADULT" }]
          : [],
    });
    const vnpay = await createVnpayPayment.mutateAsync({
      orderId: result.order.id,
      orderInfo: `Thanh toan don hang ${result.order.id.slice(0, 8)}`,
    });

    window.location.assign(vnpay.paymentUrl);
  }

  return (
    <AppShell
      title={isAdminView ? "Chi tiết điều phối vé" : "Chi tiết vé"}
      description="Xem hành trình, hạng ghế, tình trạng chỗ và thao tác đặt vé trong cùng một màn hình."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost">
            <Link href={isAdminView ? "/admin/tickets" : "/tickets"}>
              Quay lại danh sách
            </Link>
          </Button>
          {isAdminView && ticket ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => publishTicket.mutate({ ticketId })}
              >
                Công bố
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  openSale.mutate({
                    ticketId,
                    payload: { ticketItemId: selectedItem?.id },
                  })
                }
              >
                Mở bán
              </Button>
            </>
          ) : null}
          {ticket ? (
            <StatusBadge
              label={formatTicketStatus(ticket.status)}
              tone={getTicketStatusTone(ticket.status)}
            />
          ) : null}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          title={ticket?.title ?? "Đang tải vé"}
          description="Hành trình, lịch chạy và các hạng ghế đang mở."
        >
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Hành trình"
              title={ticket?.trainNumber ?? "Tổng quan tuyến"}
              description={ticket?.journeyNote ?? "Chưa có ghi chú hành trình."}
            />

            {ticket ? (
              <>
                <MetaGrid
                  items={[
                    {
                      label: "Ga đi",
                      value: ticket.departureStationName ?? ticket.departureStationCode ?? "?",
                    },
                    {
                      label: "Ga đến",
                      value: ticket.arrivalStationName ?? ticket.arrivalStationCode ?? "?",
                    },
                    { label: "Khởi hành", value: formatDateTime(ticket.dateStart) },
                    { label: "Đến nơi", value: formatDateTime(ticket.dateEnd) },
                    { label: "Trạng thái", value: formatTicketStatus(ticket.status) },
                    { label: "Hạng vé", value: String(ticket.ticketItems.length) },
                  ]}
                  columns={3}
                />

                <div className="grid gap-3 lg:grid-cols-2">
                  {ticket.ticketItems.map((item) => {
                    const isSelected = item.id === resolvedSelectedTicketItemId;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedTicketItemId(item.id)}
                        className={`rounded-lg border px-4 py-4 text-left transition-colors ${
                          isSelected
                            ? "border-primary/30 bg-accent/45"
                            : "border-border/80 bg-background hover:bg-muted/20"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-foreground">
                                {item.name ?? item.coachCode ?? "Hạng vé"}
                              </p>
                              {isSelected ? (
                                <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold uppercase tracking-tight text-background">
                                  Đang chọn
                                </span>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.seatClass ?? "Chưa rõ hạng ghế"} •{" "}
                              {item.seatType ?? "Chưa rõ loại ghế"}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(item.priceFlash ?? item.priceOriginal)}
                          </p>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <ItemMetric label="Toa" value={item.coachCode ?? "N/A"} />
                          <ItemMetric
                            label="Chỗ còn"
                            value={String(item.availableSeatLabels.length)}
                          />
                          <ItemMetric
                            label="Giá gốc"
                            value={formatCurrency(item.priceOriginal)}
                          />
                          <ItemMetric
                            label="Mã ghế"
                            value={item.availableSeatLabels.slice(0, 3).join(", ") || "N/A"}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </Panel>

        {/* Route map visualization - only visible to non-admin users */}
        {!isAdminView && ticket && (
          <RouteMap
            from={ticket.departureStationCode ?? undefined}
            to={ticket.arrivalStationCode ?? undefined}
          />
        )}

        <div className="grid gap-8">
          <Panel
            title="Tình trạng chỗ"
            description="Số ghế còn lại và trạng thái mở bán theo từng hạng."
          >
            {availabilityQuery.data ? (
              <div className="space-y-4">
                <StatusBadge
                  label={availabilityQuery.data.saleOpen ? "Đang mở bán" : "Tạm đóng bán"}
                  tone={availabilityQuery.data.saleOpen ? "positive" : "warning"}
                />
                {availabilityQuery.data.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border/80 bg-secondary/45 px-4 py-4"
                  >
                    <p className="font-medium text-foreground">
                      {item.name ?? item.coachCode ?? item.id}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Còn {item.availableSeatLabels.length} / {item.seatLabels.length} chỗ
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Panel>

          {selectedItem ? (
            <Panel
              title={isAdminView ? "Hạng ghế đang chọn" : "Đặt chỗ"}
              description={
                isAdminView
                  ? "Thông tin ghế, giá và lượng chỗ còn lại."
                  : "Điền thông tin hành khách và số ghế mong muốn."
              }
            >
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailBlock label="Toa" value={selectedItem.coachCode ?? "N/A"} />
                  <DetailBlock label="Hạng ghế" value={selectedItem.seatClass ?? "N/A"} />
                  <DetailBlock label="Loại ghế" value={selectedItem.seatType ?? "N/A"} />
                  <DetailBlock label="Giá gốc" value={formatCurrency(selectedItem.priceOriginal)} />
                  <DetailBlock label="Giá hiện tại" value={formatCurrency(selectedItem.priceFlash)} />
                  <DetailBlock
                    label="Chỗ còn"
                    value={String(selectedItem.availableSeatLabels.length)}
                  />
                </div>
                <SeatCloud labels={selectedItem.availableSeatLabels} />

                {isAdminView ? (
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_92px]">
                      <Input
                        placeholder="Seat label"
                        value={reservationSeatLabel}
                        onChange={(event) => setReservationSeatLabel(event.target.value)}
                      />
                      <Input
                        type="number"
                        min="1"
                        value={reservationQuantity}
                        onChange={(event) => setReservationQuantity(event.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/admin/tickets/${ticketId}/items/${selectedItem.id}`}>
                        Mở hạng ghế
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!ticketId || reserveTicket.isPending}
                      onClick={() =>
                        reserveTicket.mutate({
                          ticketId,
                          payload: {
                            ticketItemId: selectedItem.id,
                            seatLabel: reservationSeatLabel || undefined,
                            quantity: Number(reservationQuantity) || 1,
                          },
                        })
                      }
                    >
                      Giữ chỗ
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!ticketId || releaseTicket.isPending}
                      onClick={() =>
                        releaseTicket.mutate({
                          ticketId,
                          payload: {
                            ticketItemId: selectedItem.id,
                            seatLabel: reservationSeatLabel || undefined,
                            quantity: Number(reservationQuantity) || 1,
                          },
                        })
                      }
                    >
                      Hoàn chỗ
                    </Button>
                    </div>
                  </div>
                ) : (
                  <form
                    className="grid gap-3"
                    onSubmit={createOrderForm.handleSubmit((values) =>
                      void handleCreateOrder(values),
                    )}
                  >
                    <FormField
                      label="Họ tên hành khách"
                      error={createOrderForm.formState.errors.passengerName?.message}
                    >
                      <Input
                        placeholder="Họ tên hành khách"
                        aria-invalid={Boolean(createOrderForm.formState.errors.passengerName)}
                        {...createOrderForm.register("passengerName")}
                      />
                    </FormField>
                    <FormField
                      label="Mã ghế"
                      hint="Ví dụ A1,A2"
                      error={createOrderForm.formState.errors.seatLabels?.message}
                    >
                      <Input
                        placeholder="Mã ghế, ví dụ A1,A2"
                        aria-invalid={Boolean(createOrderForm.formState.errors.seatLabels)}
                        {...createOrderForm.register("seatLabels")}
                      />
                    </FormField>
                    <FormField
                      label="Số lượng"
                      error={createOrderForm.formState.errors.quantity?.message}
                    >
                      <Input
                        type="number"
                        min="1"
                        aria-invalid={Boolean(createOrderForm.formState.errors.quantity)}
                        {...createOrderForm.register("quantity")}
                      />
                    </FormField>
                    <Button
                      type="submit"
                      disabled={
                        !sessionUserId ||
                        createOrder.isPending ||
                        createVnpayPayment.isPending
                      }
                    >
                      {createOrder.isPending || createVnpayPayment.isPending
                        ? "Đang chuyển sang VNPay..."
                        : "Giữ chỗ & thanh toán VNPay"}
                    </Button>
                    {!sessionUserId ? (
                      <NoticeBox
                        title="Cần đăng nhập để tiếp tục"
                        description="Đăng nhập trước khi giữ chỗ và chuyển sang thanh toán VNPay."
                        tone="warning"
                      />
                    ) : null}
                  </form>
                )}
              </div>
            </Panel>
          ) : null}

          {isAdminView ? (
            <>
              <Panel
                title="Điều phối vé"
                description="Điều chỉnh trạng thái bán và tồn chỗ của hành trình."
              >
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!ticket}
                    onClick={() => publishTicket.mutate({ ticketId })}
                  >
                    Publish
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!ticket}
                    onClick={() => unpublishTicket.mutate({ ticketId })}
                  >
                    Unpublish
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!ticket}
                    onClick={() =>
                      prepareStock.mutate({
                        ticketId,
                        payload: { ticketItemId: selectedItem?.id },
                      })
                    }
                  >
                    Chuẩn bị chỗ
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!ticket}
                    onClick={() =>
                      openSale.mutate({
                        ticketId,
                        payload: { ticketItemId: selectedItem?.id },
                      })
                    }
                  >
                    Mở bán
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!ticket}
                    onClick={() => closeSale.mutate({ ticketId })}
                  >
                    Đóng bán
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={!ticket}
                    onClick={() => removeTicket.mutate({ ticketId })}
                  >
                    Xoá vé
                  </Button>
                </div>
              </Panel>

              <Panel
                title="Chỉnh sửa vé"
                description="Cập nhật tiêu đề, số tàu và ghi chú hành trình."
              >
                <div className="grid gap-3">
                  <Input
                    placeholder={ticket?.title ?? "Tiêu đề vé"}
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                  />
                  <Input
                    placeholder={ticket?.trainNumber ?? "Số tàu"}
                    value={editTrainNumber}
                    onChange={(event) => setEditTrainNumber(event.target.value)}
                  />
                  <Input
                    placeholder={ticket?.journeyNote ?? "Ghi chú hành trình"}
                    value={editJourneyNote}
                    onChange={(event) => setEditJourneyNote(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!ticketId || updateTicket.isPending}
                    onClick={() =>
                      updateTicket.mutate({
                        title: editTitle || undefined,
                        trainNumber: editTrainNumber || undefined,
                        journeyNote: editJourneyNote || undefined,
                      })
                    }
                  >
                    {updateTicket.isPending ? "Đang cập nhật..." : "Cập nhật vé"}
                  </Button>
                  {updateTicket.isSuccess ? (
                    <p className="text-sm text-emerald-700">Cập nhật thành công.</p>
                  ) : null}
                  {updateTicket.isError ? (
                    <p className="text-sm text-rose-700">Cập nhật thất bại.</p>
                  ) : null}
                </div>
              </Panel>

              <Panel
                title="Thêm hạng ghế"
                description="Bổ sung toa hoặc hạng ghế mới cho hành trình."
              >
                <div className="grid gap-3">
                  <Input
                    placeholder="Coach code"
                    value={newItemCoach}
                    onChange={(event) => setNewItemCoach(event.target.value)}
                  />
                  <Input
                    placeholder="Seat class"
                    value={newItemSeatClass}
                    onChange={(event) => setNewItemSeatClass(event.target.value)}
                  />
                  <Input
                    placeholder="Seat labels CSV"
                    value={newItemSeats}
                    onChange={(event) => setNewItemSeats(event.target.value)}
                  />
                  <Input
                    placeholder="Original price"
                    value={newItemPrice}
                    onChange={(event) => setNewItemPrice(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!ticketId || addTicketItem.isPending}
                    onClick={() => {
                      const parsedSeats = newItemSeats
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean);

                      addTicketItem.mutate({
                        ticketId,
                        payload: {
                          coachCode: newItemCoach || undefined,
                          seatClass: newItemSeatClass || undefined,
                          seatLabels: parsedSeats,
                          availableSeatLabels: parsedSeats,
                          stockInitial: parsedSeats.length || undefined,
                          stockAvailable: parsedSeats.length || undefined,
                          priceOriginal: newItemPrice || undefined,
                        },
                      });
                    }}
                  >
                    {addTicketItem.isPending ? "Đang thêm..." : "Thêm hạng ghế"}
                  </Button>
                </div>
              </Panel>
            </>
          ) : null}

          <Panel
            title="Sơ đồ ghế"
            description="Snapshot từ `/seat-map` để nhìn nhanh trạng thái ghế."
          >
            <div className="grid gap-3">
              {seatMapQuery.data?.items.map((item) => (
                <div
                  key={item.ticketItemId}
                  className="rounded-lg border border-border/80 bg-background px-4 py-4"
                >
                  <p className="font-medium text-foreground">
                    {item.coachCode ?? "Toa"} • {item.seatClass ?? "Chưa rõ"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Còn trống: {item.availableSeatLabels.join(", ") || "N/A"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Đã giữ: {item.occupiedSeatLabels.join(", ") || "Chưa có"}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function ItemMetric({ label, value }: { label: string; value: string }) {
  return (
    <DetailBlock label={label} value={value} />
  );
}
