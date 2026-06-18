"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import {
  MetaGrid,
  SectionHeading,
  SeatCloud,
  StatusBadge,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthSession } from "@/hooks/auth.hook";
import { useCreateOrder } from "@/hooks/order.hook";
import { useSeatMap, useTicket, useTicketAvailability } from "@/hooks/ticket.hook";
import {
  formatCurrency,
  formatDateTime,
  formatTicketStatus,
  getTicketStatusTone,
} from "@/lib/formatters";

export default function TicketDetailPage() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ticketId = typeof params.id === "string" ? params.id : "";
  const isAdminView = pathname.startsWith("/admin");

  const ticketQuery = useTicket(ticketId);
  const availabilityQuery = useTicketAvailability(ticketId);
  const seatMapQuery = useSeatMap(ticketId);
  const createOrder = useCreateOrder();
  const sessionQuery = useAuthSession();
  const sessionUserId = sessionQuery.data?.userId;

  const [selectedTicketItemId, setSelectedTicketItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [seatLabels, setSeatLabels] = useState("");
  const [passengerName, setPassengerName] = useState("");

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

  async function handleCreateOrder() {
    if (!ticket || !selectedItem) {
      return;
    }

    const numericQuantity = Number(quantity);
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
      seatLabels: seatLabels
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
        passengers: passengerName
          ? [{ fullName: passengerName, passengerType: "ADULT" }]
          : [],
    });

    router.push(`/payments/${result.payment.id}`);
  }

  return (
    <AppShell
      title={isAdminView ? "Chi tiết điều phối vé" : "Chi tiết vé"}
      description="Xem ticket core, availability, seat map và lựa chọn ticket item trên cùng một nhịp. Admin mode ưu tiên tồn vé, còn passenger mode ưu tiên đặt chỗ."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost">
            <Link href={isAdminView ? "/admin/tickets" : "/tickets"}>
              Quay lại danh sách
            </Link>
          </Button>
          {ticket ? (
            <StatusBadge
              label={formatTicketStatus(ticket.status)}
              tone={getTicketStatusTone(ticket.status)}
            />
          ) : null}
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title={ticket?.title ?? "Đang tải vé"}
          description="Hành trình, lịch chạy và danh sách ticket item bên trong vé."
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
                        className={`rounded-[1.7rem] px-4 py-4 text-left transition ${
                          isSelected
                            ? "bg-muted/55 ring-1 ring-foreground/18"
                            : "bg-background ring-1 ring-border hover:bg-muted/25"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-foreground">
                                {item.name ?? item.coachCode ?? "Hạng vé"}
                              </p>
                              {isSelected ? (
                                <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold uppercase tracking-normal text-background">
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

        <div className="grid gap-6">
          <Panel
            title="Ảnh chụp khả dụng"
            description="Lấy từ `/availability` để đọc tồn chỗ và trạng thái mở bán hiện tại."
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
                    className="rounded-[1.45rem] bg-white/64 px-4 py-4 ring-1 ring-black/6"
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
              title={isAdminView ? "Khối tồn vé đang chọn" : "Khung đặt chỗ"}
              description={
                isAdminView
                  ? "Thông tin chi tiết của ticket item đang chọn, kèm lượng ghế và khoảng giá."
                  : "Nhập payload đặt vé nhanh trên ticket item đang chọn."
              }
            >
              <div className="space-y-4">
                <MetaGrid
                  items={[
                    { label: "Toa", value: selectedItem.coachCode ?? "N/A" },
                    { label: "Hạng ghế", value: selectedItem.seatClass ?? "N/A" },
                    { label: "Loại ghế", value: selectedItem.seatType ?? "N/A" },
                    {
                      label: "Giá gốc",
                      value: formatCurrency(selectedItem.priceOriginal),
                    },
                    {
                      label: "Giá hiện tại",
                      value: formatCurrency(selectedItem.priceFlash),
                    },
                    {
                      label: "Chỗ còn",
                      value: String(selectedItem.availableSeatLabels.length),
                    },
                  ]}
                  columns={3}
                />
                <SeatCloud labels={selectedItem.availableSeatLabels} />

                {isAdminView ? (
                  <Button asChild variant="outline">
                    <Link href={`/admin/tickets/${ticketId}/items/${selectedItem.id}`}>
                      Mở ticket item
                    </Link>
                  </Button>
                ) : (
                  <div className="grid gap-3">
                    <Input
                      placeholder="Họ tên hành khách"
                      value={passengerName}
                      onChange={(event) => setPassengerName(event.target.value)}
                    />
                    <Input
                      placeholder="Mã ghế, ví dụ A1,A2"
                      value={seatLabels}
                      onChange={(event) => setSeatLabels(event.target.value)}
                    />
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                    />
                    <Button
                      type="button"
                      disabled={!sessionUserId || createOrder.isPending}
                      onClick={() => void handleCreateOrder()}
                    >
                      {createOrder.isPending
                        ? "Đang giữ chỗ..."
                        : "Giữ chỗ & tạo thanh toán"}
                    </Button>
                  </div>
                )}
              </div>
            </Panel>
          ) : null}

          <Panel
            title="Sơ đồ ghế"
            description="Snapshot từ `/seat-map` để nhìn nhanh trạng thái ghế."
          >
            <div className="grid gap-3">
              {seatMapQuery.data?.items.map((item) => (
                <div
                  key={item.ticketItemId}
                  className="rounded-[1.45rem] bg-white/64 px-4 py-4 ring-1 ring-black/6"
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
    <div className="rounded-[1.15rem] bg-muted/35 px-3 py-3 ring-1 ring-border">
      <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
