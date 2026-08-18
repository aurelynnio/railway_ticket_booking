"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import {
  Armchair,
  ChevronLeft,
  MapPinned,
  Ticket as TicketIcon,
  Wrench,
} from "lucide-react";

import { AppShell } from "@/components/shell/app-shell";
import { RouteMap } from "@/components/route/route-map";
import { StatusBadge } from "@/components/ui/railway-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AddItemTab,
  BookingTab,
  EditTab,
  OperationsTab,
  SeatMapTab,
  TicketOverviewTab,
} from "@/components/ticket/tabs";
import { useAuthSession } from "@/hooks/auth.hook";
import {
  useReleaseTicket,
  useReserveTicket,
  useSeatMap,
  useTicket,
  useTicketAvailability,
} from "@/hooks/ticket.hook";
import {
  formatTicketStatus,
  getTicketStatusTone,
} from "@/lib/formatters";

export default function TicketDetailPage() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const ticketId = typeof params.id === "string" ? params.id : "";
  const isAdminView = pathname.startsWith("/admin");

  const ticketQuery = useTicket(ticketId);
  const availabilityQuery = useTicketAvailability(ticketId);
  const seatMapQuery = useSeatMap(ticketId);
  const sessionQuery = useAuthSession();
  const sessionUserId = sessionQuery.data?.userId;
  const reserveTicket = useReserveTicket();
  const releaseTicket = useReleaseTicket();

  const ticket = ticketQuery.data;
  const [selectedTicketItemId, setSelectedTicketItemId] = useState("");
  const [reservationSeatLabel, setReservationSeatLabel] = useState("");
  const [reservationQuantity, setReservationQuantity] = useState("1");

  const selectedItem = useMemo(
    () =>
      ticket?.ticketItems.find((item) => item.id === selectedTicketItemId) ??
      ticket?.ticketItems[0] ??
      null,
    [selectedTicketItemId, ticket?.ticketItems],
  );

  return (
    <AppShell
      title={isAdminView ? "Chi tiết điều phối vé" : "Chi tiết vé"}
      description="Xem hành trình, hạng ghế, tình trạng chỗ và thao tác đặt vé trong cùng một màn hình."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={isAdminView ? "/admin/tickets" : "/tickets"}>
              <ChevronLeft className="size-3.5" aria-hidden />
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
      <Tabs defaultValue="overview" className="gap-6">
        <TabsList>
          <TabsTrigger value="overview">
            <MapPinned className="size-3.5" aria-hidden />
            Hành trình
          </TabsTrigger>
          <TabsTrigger value="booking">
            <TicketIcon className="size-3.5" aria-hidden />
            Đặt chỗ
          </TabsTrigger>
          <TabsTrigger value="seats">
            <Armchair className="size-3.5" aria-hidden />
            Sơ đồ ghế
          </TabsTrigger>
          {isAdminView ? (
            <>
              <TabsTrigger value="operations">
                <Wrench className="size-3.5" aria-hidden />
                Vận hành
              </TabsTrigger>
              <TabsTrigger value="edit">Chỉnh sửa</TabsTrigger>
              <TabsTrigger value="add">Thêm hạng</TabsTrigger>
            </>
          ) : null}
        </TabsList>

        <TabsContent value="overview">
          {ticket ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <TicketOverviewTab
                ticket={ticket}
                selectedTicketItemId={selectedTicketItemId}
                onSelectItem={setSelectedTicketItemId}
              />
              <RouteMap
                from={ticket.departureStationCode ?? undefined}
                to={ticket.arrivalStationCode ?? undefined}
              />
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="booking">
          {ticket ? (
            <BookingTab
              ticket={ticket}
              selectedItem={selectedItem}
              sessionUserId={sessionUserId}
            />
          ) : null}
        </TabsContent>

        <TabsContent value="seats">
          {ticket ? (
            <div className="grid gap-5">
              <SeatMapTab seatMap={seatMapQuery.data} />
              {isAdminView && selectedItem ? (
                <Card variant="outlined" padding="md">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary mb-3">
                    Thao tác nhanh (admin)
                  </p>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_92px_auto_auto]">
                    <Input
                      placeholder="Mã ghế (tùy chọn)"
                      value={reservationSeatLabel}
                      onChange={(event) =>
                        setReservationSeatLabel(event.target.value)
                      }
                    />
                    <Input
                      type="number"
                      min="1"
                      value={reservationQuantity}
                      onChange={(event) =>
                        setReservationQuantity(event.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={reserveTicket.isPending}
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
                      size="sm"
                      disabled={releaseTicket.isPending}
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
                </Card>
              ) : null}
            </div>
          ) : null}
        </TabsContent>

        {isAdminView ? (
          <>
            <TabsContent value="operations">
              <OperationsTab
                ticketId={ticketId}
                ticket={ticket}
                selectedItem={selectedItem}
              />
            </TabsContent>
            <TabsContent value="edit">
              <EditTab ticketId={ticketId} ticket={ticket} />
            </TabsContent>
            <TabsContent value="add">
              <AddItemTab ticketId={ticketId} />
            </TabsContent>
          </>
        ) : null}
      </Tabs>

      {availabilityQuery.data ? (
        <p className="mt-3 text-xs text-ink-muted">
          Tình trạng bán:{" "}
          <span className="font-semibold text-ink">
            {availabilityQuery.data.saleOpen ? "Đang mở bán" : "Tạm đóng bán"}
          </span>
        </p>
      ) : null}
    </AppShell>
  );
}
