"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Layers3, Sparkles, TrainFront } from "lucide-react";

import { AppShell, Panel } from "@/components/app-shell";
import {
  EmptyState,
  FilterBar,
  PaginationBar,
  SectionHeading,
  StatCard,
  StatusBadge,
} from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { STATIONS } from "@/app/search/page";
import { useTickets } from "@/hooks/ticket.hook";
import {
  formatDateTime,
  formatTicketStatus,
  getTicketStatusTone,
} from "@/lib/formatters";

export default function TicketsPage() {
  const pathname = usePathname();
  const isAdminView = pathname.startsWith("/admin");
  const [departureStationCode, setDepartureStationCode] = useState("");
  const [arrivalStationCode, setArrivalStationCode] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [page, setPage] = useState(1);

  const deferredDeparture = useDeferredValue(departureStationCode);
  const deferredArrival = useDeferredValue(arrivalStationCode);
  const deferredDate = useDeferredValue(dateStart);
  const deferredPage = useDeferredValue(page);

  const query = useTickets({
    departureStationCode: deferredDeparture || undefined,
    arrivalStationCode: deferredArrival || undefined,
    dateStart: deferredDate || undefined,
    page: deferredPage,
    limit: 8,
  });

  const tickets = query.data?.data ?? [];
  const pagination = query.data?.pagination;
  const published = tickets.filter((ticket) => ticket.status === 1).length;
  const ticketItems = tickets.reduce(
    (total, ticket) => total + ticket.ticketItems.length,
    0,
  );
  const values = new Set<string>();
  tickets.forEach((ticket) => {
    if (ticket.departureStationCode) {
      values.add(ticket.departureStationCode);
    }
    if (ticket.arrivalStationCode) {
      values.add(ticket.arrivalStationCode);
    }
  });
  const stations = values.size;

  return (
    <AppShell
      title={
        isAdminView
          ? "Điều phối vé"
          : "Duyệt vé tàu đang mở bán theo dạng danh mục"
      }
      description={
        isAdminView
          ? "Kho tồn vé chính cho bộ phận điều hành theo dõi hành trình, toa, hạng ghế và khả năng mở bán."
          : "Duyệt vé đang mở bán theo tuyến, lịch chạy và hạng ghế trước khi mở chi tiết để giữ chỗ."
      }
      actions={
        <FilterBar>
          <Select
            value={departureStationCode}
            onChange={(event) => {
              setPage(1);
              setDepartureStationCode(event.target.value);
            }}
          >
            <option value="">Tất cả ga đi</option>
            {STATIONS.map((station) => (
              <option key={station.code} value={station.code}>
                {station.name} ({station.code})
              </option>
            ))}
          </Select>
          <Select
            value={arrivalStationCode}
            onChange={(event) => {
              setPage(1);
              setArrivalStationCode(event.target.value);
            }}
          >
            <option value="">Tất cả ga đến</option>
            {STATIONS.map((station) => (
              <option key={station.code} value={station.code}>
                {station.name} ({station.code})
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={dateStart}
            onChange={(event) => {
              setPage(1);
              setDateStart(event.target.value);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={isAdminView ? "outline" : "default"}
              onClick={() => setPage(1)}
            >
              {isAdminView ? "Làm mới" : "Làm mới bộ lọc"}
            </Button>
            {isAdminView ? (
              <Button asChild>
                <Link href="/admin/tickets/new">Tạo vé</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/search">
                  Tìm chuyến
                  <ArrowRight />
                </Link>
              </Button>
            )}
          </div>
        </FilterBar>
      }
    >
      {isAdminView ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <StatCard
              label="Vé hiển thị"
              value={String(tickets.length)}
              helper="Số vé trên trang hiện tại."
            />
            <StatCard
              label="Đang mở bán"
              value={String(published)}
              helper="Số hành trình đang ở trạng thái mở bán."
            />
            <StatCard
              label="Hạng vé"
              value={String(ticketItems)}
              helper={`Phủ trên ${stations} mã ga trong viewport hiện tại.`}
            />
          </div>

          <Panel
            title="Bảng tồn vé"
            description="Mỗi vé hiển thị tuyến, trạng thái, thời gian và các hạng ghế đang gắn với hành trình."
          >
            <div className="space-y-5">
              <SectionHeading
                eyebrow="Điều phối"
                title="Theo dõi tồn vé đang bán"
                description="Ticket detail, availability và seat map đều được nối tiếp từ từng item dưới đây."
              />

              {query.isLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-44 animate-pulse rounded-[1.75rem] bg-white/55"
                    />
                  ))}
                </div>
              ) : null}

              {query.isError ? (
                <EmptyState
                  title="Không tải được tồn vé"
                  description="Kiểm tra `api-gateway` và `tickets-service`, sau đó thử làm mới danh sách."
                />
              ) : null}

              {!query.isLoading && !query.isError && tickets.length === 0 ? (
                <EmptyState
                  title="Chưa có vé nào khớp bộ lọc"
                  description="Thử đổi mã ga, ngày khởi hành hoặc xóa bộ lọc để xem toàn bộ tồn vé."
                />
              ) : null}

              <div className="grid gap-4">
                {tickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="surface-panel grid gap-5 rounded-[1.95rem] px-5 py-5 xl:grid-cols-[1.2fr_0.8fr]"
                  >
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-heading text-2xl font-semibold tracking-normal text-foreground">
                            {ticket.title ?? "Vé chưa đặt tên"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {ticket.trainNumber ?? "Chưa có mã tàu"} •{" "}
                            {ticket.departureStationName ?? ticket.departureStationCode ?? "?"} đến{" "}
                            {ticket.arrivalStationName ?? ticket.arrivalStationCode ?? "?"}
                          </p>
                        </div>
                        <StatusBadge
                          label={formatTicketStatus(ticket.status)}
                          tone={getTicketStatusTone(ticket.status)}
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <TicketFact label="Khởi hành" value={formatDateTime(ticket.dateStart)} />
                        <TicketFact label="Đến nơi" value={formatDateTime(ticket.dateEnd)} />
                        <TicketFact
                          label="Hạng vé"
                          value={`${ticket.ticketItems.length} toa / khoang ghế`}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {ticket.ticketItems.slice(0, 4).map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full bg-white/72 px-3 py-1 text-xs font-medium text-foreground ring-1 ring-black/6"
                          >
                            {item.coachCode ?? item.name ?? "Toa"} • {item.seatClass ?? "N/A"}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-4 rounded-[1.7rem] bg-white/62 px-4 py-4 ring-1 ring-black/6">
                      <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                          Ghi chú hành trình
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {ticket.journeyNote ?? "Chưa có ghi chú cho vé này."}
                        </p>
                      </div>
                      <Button asChild>
                        <Link href={`/admin/tickets/${ticket.id}`}>Quản lý chi tiết</Link>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              {pagination ? (
                <PaginationBar
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  onPrev={() => setPage((current) => Math.max(1, current - 1))}
                  onNext={() =>
                    setPage((current) =>
                      pagination.totalPages === 0
                        ? current
                        : Math.min(pagination.totalPages, current + 1),
                    )
                  }
                />
              ) : null}
            </div>
          </Panel>
        </>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <section className="surface-panel rounded-[2rem] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                    Tuyến hiển thị
                  </p>
                  <p className="mt-3 font-heading text-3xl font-semibold tracking-normal text-foreground">
                    {tickets.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Số vé đang hiển thị trong grid danh mục.
                  </p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-[1rem] bg-muted text-foreground ring-1 ring-border">
                  <TrainFront className="size-5" />
                </div>
              </div>
            </section>

            <section className="surface-panel rounded-[2rem] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                    Khoang ghế
                  </p>
                  <p className="mt-3 font-heading text-3xl font-semibold tracking-normal text-foreground">
                    {ticketItems}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Tổng số block ghế mà user có thể đi sâu vào chi tiết.
                  </p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-[1rem] bg-muted text-foreground ring-1 ring-border">
                  <Layers3 className="size-5" />
                </div>
              </div>
            </section>

            <section className="surface-panel rounded-[2rem] px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                    Ga xuất hiện
                  </p>
                  <p className="mt-3 font-heading text-3xl font-semibold tracking-normal text-foreground">
                    {stations}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Số mã ga xuất hiện trong kết quả để user quét nhanh mạng lưới.
                  </p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-[1rem] bg-muted text-foreground ring-1 ring-border">
                  <Sparkles className="size-5" />
                </div>
              </div>
            </section>
          </div>

          <Panel
            title="Vé tàu nổi bật"
            description="Chọn tuyến, xem thời gian chạy và mở chi tiết để kiểm tra từng lựa chọn ghế."
          >
            <div className="space-y-5">
              <SectionHeading
                eyebrow="Danh mục hành khách"
                title="Chọn tuyến trước, rồi đi sâu vào từng lựa chọn ghế"
                description="Danh sách này giúp bạn quét nhanh tuyến đang bán trước khi vào màn chọn ghế."
                action={
                  <Button asChild variant="outline">
                    <Link href="/search">
                      Tìm theo chuyến
                      <ArrowRight />
                    </Link>
                  </Button>
                }
              />

              {query.isLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-44 animate-pulse rounded-[1.75rem] bg-white/55"
                    />
                  ))}
                </div>
              ) : null}

              {query.isError ? (
                <EmptyState
                  title="Không tải được tồn vé"
                  description="Kiểm tra `api-gateway` và `tickets-service`, sau đó thử làm mới danh sách."
                />
              ) : null}

              {!query.isLoading && !query.isError && tickets.length === 0 ? (
                <EmptyState
                  title="Chưa có vé nào khớp bộ lọc"
                  description="Thử đổi mã ga, ngày khởi hành hoặc xóa bộ lọc để xem toàn bộ tồn vé."
                />
              ) : null}

              <div className="grid gap-4">
                {tickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="surface-panel grid gap-5 rounded-[2rem] px-5 py-5 xl:grid-cols-[1.1fr_0.9fr]"
                  >
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-heading text-2xl font-semibold tracking-normal text-foreground">
                            {ticket.title ?? "Vé chưa đặt tên"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {ticket.trainNumber ?? "Chưa có mã tàu"} •{" "}
                            {ticket.departureStationName ?? ticket.departureStationCode ?? "?"} đến{" "}
                            {ticket.arrivalStationName ?? ticket.arrivalStationCode ?? "?"}
                          </p>
                        </div>
                        <StatusBadge
                          label={
                            ticket.status === 1
                              ? "Đang mở bán"
                              : formatTicketStatus(ticket.status)
                          }
                          tone={
                            ticket.status === 1
                              ? "positive"
                              : getTicketStatusTone(ticket.status)
                          }
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-[0.95fr_0.1fr_0.95fr]">
                        <TicketFact label="Khởi hành" value={formatDateTime(ticket.dateStart)} />
                        <div className="hidden items-center justify-center md:flex">
                          <div className="flex size-11 items-center justify-center rounded-full bg-white/70 ring-1 ring-black/6">
                            <ArrowRight className="size-4 text-primary" />
                          </div>
                        </div>
                        <TicketFact label="Đến nơi" value={formatDateTime(ticket.dateEnd)} />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {ticket.ticketItems.slice(0, 4).map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full bg-white/72 px-3 py-1 text-xs font-medium text-foreground ring-1 ring-black/6"
                          >
                            {item.coachCode ?? item.name ?? "Toa"} • {item.seatClass ?? "N/A"}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-4 rounded-[1.9rem] bg-muted/25 px-5 py-5 ring-1 ring-border">
                      <div className="space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                          Vì sao nên mở vé này
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {ticket.journeyNote ??
                            "Tuyến, thời gian và các hạng ghế được gom lại để bạn chọn hành trình phù hợp nhanh hơn."}
                        </p>
                        <div className="rounded-[1.4rem] bg-white/72 px-4 py-4 ring-1 ring-black/6">
                          <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
                            Độ sâu chọn ghế
                          </p>
                          <p className="mt-2 text-sm leading-6 text-foreground">
                            {ticket.ticketItems.length} coach block đang sẵn sàng để user
                            đi tiếp vào chi tiết và chọn ghế.
                          </p>
                        </div>
                      </div>
                      <Button asChild>
                        <Link href={`/tickets/${ticket.id}`}>
                          Xem chi tiết
                          <ArrowRight />
                        </Link>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              {pagination ? (
                <PaginationBar
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  onPrev={() => setPage((current) => Math.max(1, current - 1))}
                  onNext={() =>
                    setPage((current) =>
                      pagination.totalPages === 0
                        ? current
                        : Math.min(pagination.totalPages, current + 1),
                    )
                  }
                />
              ) : null}
            </div>
          </Panel>
        </>
      )}
    </AppShell>
  );
}

function TicketFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] bg-white/62 px-4 py-4 ring-1 ring-black/6">
      <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}
