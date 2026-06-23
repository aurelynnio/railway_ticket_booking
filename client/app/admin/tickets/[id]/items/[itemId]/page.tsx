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
  useRemoveTicketItem,
  useTicketItem,
  useUpdateTicketItem,
} from "@/hooks/ticket.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export default function AdminTicketItemPage() {
  const params = useParams<{ id: string; itemId: string }>();
  const ticketId = typeof params.id === "string" ? params.id : "";
  const itemId = typeof params.itemId === "string" ? params.itemId : "";

  const itemQuery = useTicketItem(ticketId, itemId);
  const updateTicketItem = useUpdateTicketItem();
  const removeTicketItem = useRemoveTicketItem();
  const changePrice = useChangePrice();
  const changeSaleWindow = useChangeSaleWindow();

  const [priceOriginal, setPriceOriginal] = useState("");
  const [priceFlash, setPriceFlash] = useState("");
  const [saleStartTime, setSaleStartTime] = useState("");
  const [saleEndTime, setSaleEndTime] = useState("");
  const [itemName, setItemName] = useState("");
  const [seatClass, setSeatClass] = useState("");

  const item = itemQuery.data;

  return (
    <AppShell
      title="Ticket item detail"
      description="View chi tiet cap ticket-item de bo phan ops doc khoang ghe, stock, price va sale window cua mot toa cu the."
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title={item?.name ?? item?.coachCode ?? "Dang tai ticket item"}
          description="Nguon du lieu tu `GET /tickets/:ticketId/ticket-items/:ticketItemId`."
        >
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Coach block"
              title={item?.seatClass ?? "Seat block"}
              description={item?.description ?? "Chua co mo ta cho ticket item nay."}
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
            title="Change price"
            description="Cap nhat gia goc va gia flash cho ticket item nay."
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
            title="Change sale window"
            description="Thay doi thoi gian mo va dong ban cua ticket item."
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
                {changeSaleWindow.isPending ? "Đang cập nhật..." : "Cập nhật sale window"}
              </Button>
            </div>
          </Panel>

          <Panel
            title="Update ticket item"
            description="Cap nhat ten va hang ghe cua ticket item."
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
            description="Xoa ticket item nay khoi ticket. Hanh dong khong the hoan tac."
          >
            <Button
              type="button"
              variant="destructive"
              disabled={!ticketId || !itemId || removeTicketItem.isPending}
              onClick={() =>
                removeTicketItem.mutate({ ticketId, ticketItemId: itemId })
              }
            >
              {removeTicketItem.isPending ? "Đang xoá..." : "Xoá ticket item"}
            </Button>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
