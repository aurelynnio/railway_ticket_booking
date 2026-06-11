"use client";

import { useParams } from "next/navigation";

import { AppShell, Panel } from "@/components/app-shell";
import { MetaGrid, SeatCloud, SectionHeading } from "@/components/railway-ui";
import { useTicketItem } from "@/hooks/ticket.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export default function AdminTicketItemPage() {
  const params = useParams<{ id: string; itemId: string }>();
  const ticketId = typeof params.id === "string" ? params.id : "";
  const itemId = typeof params.itemId === "string" ? params.itemId : "";

  const itemQuery = useTicketItem(ticketId, itemId);
  const item = itemQuery.data;

  return (
    <AppShell
      title="Ticket item detail"
      description="View chi tiet cap ticket-item de bo phan ops doc khoang ghe, stock, price va sale window cua mot toa cu the."
    >
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
                <div className="rounded-[1.7rem] bg-white/62 px-4 py-4 ring-1 ring-black/6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Seat labels
                  </p>
                  <div className="mt-3">
                    <SeatCloud labels={item.seatLabels} />
                  </div>
                </div>
                <div className="rounded-[1.7rem] bg-white/62 px-4 py-4 ring-1 ring-black/6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
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
    </AppShell>
  );
}
