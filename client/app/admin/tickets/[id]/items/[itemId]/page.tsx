"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import { MetaGrid, SeatCloud, SectionHeading } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useChangePrice,
  useChangeSaleWindow,
  useReleaseSeat,
  useRemoveTicketItem,
  useReserveSeat,
  useTicketItemAvailability,
  useTicketItem,
  useUpdateTicketItem,
} from "@/hooks/ticket.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export default function AdminTicketItemPage() {
  const params = useParams<{ id: string; itemId: string }>();
  const ticketId = typeof params.id === "string" ? params.id : "";
  const itemId = typeof params.itemId === "string" ? params.itemId : "";

  const itemQuery = useTicketItem(ticketId, itemId);
  const availabilityQuery = useTicketItemAvailability(ticketId, itemId);
  const updateTicketItem = useUpdateTicketItem();
  const removeTicketItem = useRemoveTicketItem();
  const changePrice = useChangePrice();
  const changeSaleWindow = useChangeSaleWindow();
  const reserveSeat = useReserveSeat();
  const releaseSeat = useReleaseSeat();

  const [priceOriginal, setPriceOriginal] = useState("");
  const [priceFlash, setPriceFlash] = useState("");
  const [saleStartTime, setSaleStartTime] = useState("");
  const [saleEndTime, setSaleEndTime] = useState("");
  const [itemName, setItemName] = useState("");
  const [seatClass, setSeatClass] = useState("");
  const [seatLabel, setSeatLabel] = useState("");

  const item = itemQuery.data;

  return (
    <AppShell
      title="Chi tiết hạng ghế"
      description="Quản lý giá, thời gian bán và tình trạng ghế của một toa hoặc hạng vé."
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title={item?.name ?? item?.coachCode ?? "Đang tải hạng ghế"}
          description="Thông tin ghế, tồn chỗ, giá và thời gian mở bán."
        >
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Coach block"
              title={item?.seatClass ?? "Seat block"}
              description={item?.description ?? "Chưa có mô tả cho hạng ghế này."}
            />

            {item ? (
              <>
                <MetaGrid
                  items={[
                    { label: "Coach", value: item.coachCode ?? "N/A" },
                    { label: "Seat class", value: item.seatClass ?? "N/A" },
                    { label: "Seat type", value: item.seatType ?? "N/A" },
                    { label: "Stock initial", value: String(item.stockInitial ?? 0) },
                    { label: "Stock available", value: String(item.stockAvailable ?? 0) },
                    { label: "Prepared", value: item.stockPrepared ? "Yes" : "No" },
                    { label: "Original price", value: formatCurrency(item.priceOriginal) },
                    { label: "Flash price", value: formatCurrency(item.priceFlash) },
                    { label: "Sale start", value: formatDateTime(item.saleStartTime) },
                    { label: "Sale end", value: formatDateTime(item.saleEndTime) },
                    { label: "Created", value: formatDateTime(item.createdAt) },
                    { label: "Updated", value: formatDateTime(item.updatedAt) },
                  ]}
                  columns={3}
                />

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg bg-background px-4 py-4 border border-border">
                    <p className="text-xs font-medium text-muted-foreground">
                      Seat labels
                    </p>
                    <div className="mt-3">
                      <SeatCloud labels={item.seatLabels} />
                    </div>
                  </div>
                  <div className="rounded-lg bg-background px-4 py-4 border border-border">
                    <p className="text-xs font-medium text-muted-foreground">
                      Available seats
                    </p>
                    <div className="mt-3">
                      <SeatCloud labels={item.availableSeatLabels} />
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel
            title="Cập nhật giá"
            description="Điều chỉnh giá gốc và giá ưu đãi."
          >
            <div className="grid gap-3">
              <Input
                placeholder="Giá gốc"
                value={priceOriginal}
                onChange={(event) => setPriceOriginal(event.target.value)}
              />
              <Input
                placeholder="Giá flash"
                value={priceFlash}
                onChange={(event) => setPriceFlash(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!ticketId || !itemId || changePrice.isPending}
                onClick={() =>
                  changePrice.mutate({
                    ticketId,
                    ticketItemId: itemId,
                    payload: {
                      priceOriginal: priceOriginal || undefined,
                      priceFlash: priceFlash || undefined,
                    },
                  })
                }
              >
                {changePrice.isPending ? "Đang cập nhật..." : "Cập nhật giá"}
              </Button>
            </div>
          </Panel>

          <Panel
            title="Giữ chỗ thủ công"
            description="Giữ hoặc hoàn một ghế cụ thể khi cần hỗ trợ vận hành."
          >
            <div className="space-y-4">
              {availabilityQuery.data ? (
                <MetaGrid
                  items={[
                    {
                      label: "Sale open",
                      value: availabilityQuery.data.saleOpen ? "Yes" : "No",
                    },
                    {
                      label: "Available",
                      value: String(
                        availabilityQuery.data.availableSeatLabels.length,
                      ),
                    },
                    {
                      label: "Occupied",
                      value: String(
                        availabilityQuery.data.occupiedSeatLabels.length,
                      ),
                    },
                  ]}
                  columns={3}
                />
              ) : null}
              <Input
                placeholder="Seat label, vd A1"
                value={seatLabel}
                onChange={(event) => setSeatLabel(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!ticketId || !itemId || !seatLabel || reserveSeat.isPending}
                  onClick={() =>
                    reserveSeat.mutate({
                      ticketId,
                      ticketItemId: itemId,
                      payload: { seatLabel },
                    })
                  }
                >
                  Giữ ghế
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!ticketId || !itemId || !seatLabel || releaseSeat.isPending}
                  onClick={() =>
                    releaseSeat.mutate({
                      ticketId,
                      ticketItemId: itemId,
                      payload: { seatLabel },
                    })
                  }
                >
                  Hoàn ghế
                </Button>
              </div>
            </div>
          </Panel>

          <Panel
            title="Thời gian mở bán"
            description="Cập nhật thời điểm bắt đầu và kết thúc bán vé."
          >
            <div className="grid gap-3">
              <Input
                type="datetime-local"
                placeholder="Sale start"
                value={saleStartTime}
                onChange={(event) => setSaleStartTime(event.target.value)}
              />
              <Input
                type="datetime-local"
                placeholder="Sale end"
                value={saleEndTime}
                onChange={(event) => setSaleEndTime(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!ticketId || !itemId || changeSaleWindow.isPending}
                onClick={() =>
                  changeSaleWindow.mutate({
                    ticketId,
                    ticketItemId: itemId,
                    payload: {
                      saleStartTime: saleStartTime || undefined,
                      saleEndTime: saleEndTime || undefined,
                    },
                  })
                }
              >
                {changeSaleWindow.isPending ? "Đang cập nhật..." : "Cập nhật thời gian"}
              </Button>
            </div>
          </Panel>

          <Panel
            title="Thông tin hạng ghế"
            description="Cập nhật tên hiển thị và hạng ghế."
          >
            <div className="grid gap-3">
              <Input
                placeholder="Tên hạng vé"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
              />
              <Input
                placeholder="Hạng ghế"
                value={seatClass}
                onChange={(event) => setSeatClass(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!ticketId || !itemId || updateTicketItem.isPending}
                onClick={() =>
                  updateTicketItem.mutate({
                    ticketId,
                    ticketItemId: itemId,
                    payload: {
                      name: itemName || undefined,
                      seatClass: seatClass || undefined,
                    },
                  })
                }
              >
                {updateTicketItem.isPending ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </Panel>

          <Panel
            title="Danger zone"
            description="Xoá hạng ghế khỏi hành trình. Hành động này không thể hoàn tác."
          >
            <Button
              type="button"
              variant="destructive"
              disabled={!ticketId || !itemId || removeTicketItem.isPending}
              onClick={() =>
                removeTicketItem.mutate({ ticketId, ticketItemId: itemId })
              }
            >
              {removeTicketItem.isPending ? "Đang xoá..." : "Xoá hạng ghế"}
            </Button>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
