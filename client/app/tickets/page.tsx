"use client";

import Link from "next/link";
import { type ReactNode, useDeferredValue, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATIONS } from "@/app/search/page";
import {
  useCloseSale,
  useOpenSale,
  usePublishTicket,
  useTickets,
  useUnpublishTicket,
} from "@/hooks/ticket.hook";
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
  const publishTicket = usePublishTicket();
  const unpublishTicket = useUnpublishTicket();
  const openSale = useOpenSale();
  const closeSale = useCloseSale();

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
  const isAdminActionPending =
    publishTicket.isPending ||
    unpublishTicket.isPending ||
    openSale.isPending ||
    closeSale.isPending;

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
              onClick={() => {
                setPage(1);
              }}
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
              helper="Kết quả trong trang hiện tại."
            />
            <StatCard
              label="Đang mở bán"
              value={String(published)}
              helper="Hành trình có thể bán ngay."
            />
            <StatCard
              label="Hạng vé"
              value={String(ticketItems)}
              helper={`Phủ trên ${stations} mã ga.`}
            />
          </div>

          <Panel
            title="Bảng tồn vé"
            description="Theo dõi nhanh trạng thái mở bán, thời gian chạy và số hạng ghế trên từng hành trình."
          >
            <div className="space-y-5">
              <SectionHeading
                eyebrow="Điều phối"
                title="Theo dõi tồn vé đang bán"
                description="Ưu tiên mở chi tiết khi cần xử lý tồn chỗ, trạng thái bán hoặc hạng ghế."
              />

              {query.isLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-44 animate-pulse rounded-lg bg-background"
                    />
                  ))}
                </div>
              ) : null}

              {query.isError ? (
                <EmptyState
                  title="Không tải được tồn vé"
                  description="Không thể tải danh sách vé lúc này. Vui lòng thử lại sau."
                />
              ) : null}

              {!query.isLoading && !query.isError && tickets.length === 0 ? (
                <EmptyState
                  title="Chưa có vé nào khớp bộ lọc"
                  description="Thử đổi mã ga, ngày khởi hành hoặc xóa bộ lọc để xem toàn bộ tồn vé."
                />
              ) : null}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hành trình</TableHead>
                    <TableHead className="hidden md:table-cell">Lịch chạy</TableHead>
                    <TableHead className="hidden lg:table-cell">Hạng ghế</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {ticket.title ?? "Vé chưa đặt tên"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.trainNumber ?? "Chưa có mã tàu"} •{" "}
                            {ticket.departureStationName ?? ticket.departureStationCode ?? "?"} đến{" "}
                            {ticket.arrivalStationName ?? ticket.arrivalStationCode ?? "?"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{formatDateTime(ticket.dateStart)}</p>
                          <p className="text-xs">{formatDateTime(ticket.dateEnd)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {ticket.ticketItems.slice(0, 3).map((item) => (
                            <span
                              key={item.id}
                              className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                            >
                              {item.coachCode ?? item.name ?? "Toa"} • {item.seatClass ?? "N/A"}
                            </span>
                          ))}
                          {ticket.ticketItems.length > 3 ? (
                            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                              +{ticket.ticketItems.length - 3}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={formatTicketStatus(ticket.status)}
                          tone={getTicketStatusTone(ticket.status)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isAdminActionPending}
                            onClick={() => publishTicket.mutate({ ticketId: ticket.id })}
                          >
                            Công bố
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isAdminActionPending}
                            onClick={() =>
                              openSale.mutate({
                                ticketId: ticket.id,
                                payload: { ticketItemId: ticket.ticketItems[0]?.id },
                              })
                            }
                          >
                            Mở bán
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isAdminActionPending}
                            onClick={() => unpublishTicket.mutate({ ticketId: ticket.id })}
                          >
                            Gỡ
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isAdminActionPending}
                            onClick={() => closeSale.mutate({ ticketId: ticket.id })}
                          >
                            Đóng
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/tickets/${ticket.id}`}>Chi tiết</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
            <CatalogStat label="Tuyến hiển thị" value={String(tickets.length)} icon={<TrainFront className="size-5" />} />
            <CatalogStat label="Khoang ghế" value={String(ticketItems)} icon={<Layers3 className="size-5" />} />
            <CatalogStat label="Ga xuất hiện" value={String(stations)} icon={<Sparkles className="size-5" />} />
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
                      className="h-44 animate-pulse rounded-lg bg-background"
                    />
                  ))}
                </div>
              ) : null}

              {query.isError ? (
                <EmptyState
                  title="Không tải được tồn vé"
                description="Không thể tải danh sách vé lúc này. Vui lòng thử lại sau."
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
                    className="surface-panel grid gap-5 rounded-lg px-5 py-5 xl:grid-cols-[minmax(0,1fr)_240px]"
                  >
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">
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
                          <div className="flex size-11 items-center justify-center rounded-full border border-border/80 bg-background">
                            <ArrowRight className="size-4 text-primary" />
                          </div>
                        </div>
                        <TicketFact label="Đến nơi" value={formatDateTime(ticket.dateEnd)} />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {ticket.ticketItems.slice(0, 4).map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                          >
                            {item.coachCode ?? item.name ?? "Toa"} • {item.seatClass ?? "N/A"}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-between gap-4 rounded-lg border border-border/80 bg-secondary/45 px-5 py-5">
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Tóm tắt
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {ticket.journeyNote ??
                            "Tuyến, thời gian và các hạng ghế được gom lại để bạn chọn hành trình phù hợp nhanh hơn."}
                        </p>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-between gap-3">
                            <span>Trạng thái</span>
                            <span className="font-medium text-foreground">
                              {ticket.status === 1
                                ? "Đang mở bán"
                                : formatTicketStatus(ticket.status)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Lựa chọn ghế</span>
                            <span className="font-medium text-foreground">
                              {ticket.ticketItems.length}
                            </span>
                          </div>
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
    <div className="rounded-lg border border-border/80 bg-background px-4 py-4">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function CatalogStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <section className="surface-panel rounded-lg px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-foreground">
          {icon}
        </div>
      </div>
    </section>
  );
}
