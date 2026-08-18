"use client";

import Link from "next/link";
import { type ReactNode, useDeferredValue, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Layers3, MoreHorizontal, Sparkles, TrainFront, MapPin, Calendar } from "lucide-react";

import { AppShell, Panel } from "@/components/shell/app-shell";
import { TicketNotch } from "@/components/ticket/ticket-notch";
import {
  EmptyState,
  FilterBar,
  PaginationBar,
  SectionHeading,
  StatusBadge,
} from "@/components/ui/railway-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      title={isAdminView ? "Quản lý vé tàu" : "Danh mục vé tàu"}
      description={
        isAdminView
          ? "Theo dõi tồn vé, trạng thái công bố và lịch mở bán của từng hành trình."
          : "Khám phá các tuyến đang mở bán, so sánh lịch trình và chọn hạng ghế phù hợp."
      }
    >
      <div className="space-y-6">
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
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </FilterBar>

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
              tone="success"
            />
            <StatCard
              label="Hạng vé"
              value={String(ticketItems)}
              helper={`Phủ trên ${stations} mã ga.`}
            />
          </div>

          <Panel
            eyebrow="Điều phối"
            title="Bảng tồn vé"
            description="Theo dõi nhanh trạng thái mở bán, thời gian chạy và số hạng ghế trên từng hành trình."
          >
            <div className="space-y-5">
              {query.isLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-44 animate-pulse rounded-sm border border-border bg-muted/40"
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
                          <p className="font-medium text-ink">
                            {ticket.title ?? "Vé chưa đặt tên"}
                          </p>
                          <p className="text-xs text-ink-muted">
                            <span className="mono font-medium text-ink">{ticket.trainNumber ?? "Chưa có mã tàu"}</span>
                            {" • "}
                            {ticket.departureStationName ?? ticket.departureStationCode ?? "?"}
                            {" → "}
                            {ticket.arrivalStationName ?? ticket.arrivalStationCode ?? "?"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1 text-sm text-ink-muted">
                          <p className="mono tabular-nums">{formatDateTime(ticket.dateStart)}</p>
                          <p className="mono tabular-nums text-xs">{formatDateTime(ticket.dateEnd)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {ticket.ticketItems.slice(0, 3).map((item) => (
                            <Badge
                              key={item.id}
                              variant="secondary"
                              className="mono text-[10px]"
                            >
                              {item.coachCode ?? item.name ?? "Toa"} • {item.seatClass ?? "N/A"}
                            </Badge>
                          ))}
                          {ticket.ticketItems.length > 3 ? (
                            <Badge variant="outline" className="text-[10px]">
                              +{ticket.ticketItems.length - 3}
                            </Badge>
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
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/tickets/${ticket.id}`}>Chi tiết</Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" size="sm" variant="outline">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                disabled={isAdminActionPending}
                                onSelect={() => publishTicket.mutate({ ticketId: ticket.id })}
                              >
                                Công bố
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isAdminActionPending}
                                onSelect={() =>
                                  openSale.mutate({
                                    ticketId: ticket.id,
                                    payload: { ticketItemId: ticket.ticketItems[0]?.id },
                                  })
                                }
                              >
                                Mở bán
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isAdminActionPending}
                                onSelect={() => unpublishTicket.mutate({ ticketId: ticket.id })}
                              >
                                Gỡ công bố
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={isAdminActionPending}
                                onSelect={() => closeSale.mutate({ ticketId: ticket.id })}
                              >
                                Đóng bán
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
            <CatalogStat label="Tuyến hiển thị" value={String(tickets.length)} icon={<TrainFront className="size-5" strokeWidth={1.75} />} />
            <CatalogStat label="Khoang ghế" value={String(ticketItems)} icon={<Layers3 className="size-5" strokeWidth={1.75} />} />
            <CatalogStat label="Ga xuất hiện" value={String(stations)} icon={<Sparkles className="size-5" strokeWidth={1.75} />} />
          </div>

          <Panel
            eyebrow="Danh mục"
            title="Vé tàu đang mở bán"
            description="Chọn tuyến, xem thời gian chạy và mở chi tiết để kiểm tra từng lựa chọn ghế."
          >
            <div className="space-y-5">
              <SectionHeading
                eyebrow="Hành khách"
                title="Chọn tuyến trước, rồi đi sâu vào từng lựa chọn ghế"
                description="Danh sách này giúp bạn quét nhanh tuyến đang bán trước khi vào màn chọn ghế."
                action={
                  <Button asChild variant="outline">
                    <Link href="/search">
                      Tìm theo chuyến
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                }
              />

              {query.isLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-44 animate-pulse rounded-sm border border-border bg-muted/40"
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
                  <TicketNotch key={ticket.id} dashed>
                    <Card variant="outlined" padding="none" className="iso-card-tilt overflow-hidden">
                      <CardContent className="p-0">
                        <div className="grid xl:grid-cols-[minmax(0,1fr)_240px]">
                          <div className="p-5 md:p-6 space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <TrainFront className="size-3.5 text-primary" strokeWidth={2} />
                                  <span className="mono text-xs font-medium text-ink-muted">
                                    {ticket.trainNumber ?? "Chưa có mã tàu"}
                                  </span>
                                </div>
                                <h3 className="font-display text-xl font-semibold tracking-tight text-ink">
                                  {ticket.title ?? "Vé chưa đặt tên"}
                                </h3>
                                <p className="text-sm text-ink-muted flex items-center gap-1.5">
                                  <MapPin className="size-3 text-primary" />
                                  {ticket.departureStationName ?? ticket.departureStationCode ?? "?"}
                                  <span className="text-ink-subtle">→</span>
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
                                    ? "success"
                                    : getTicketStatusTone(ticket.status)
                                }
                              />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="border border-border bg-muted/20 p-4 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                                  <Calendar className="size-3" />
                                  Khởi hành
                                </div>
                                <p className="mono text-sm font-medium tabular-nums text-ink">
                                  {formatDateTime(ticket.dateStart)}
                                </p>
                              </div>
                              <div className="border border-border bg-muted/20 p-4 space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                                  <MapPin className="size-3" />
                                  Đến nơi
                                </div>
                                <p className="mono text-sm font-medium tabular-nums text-ink">
                                  {formatDateTime(ticket.dateEnd)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {ticket.ticketItems.slice(0, 4).map((item) => (
                                <Badge
                                  key={item.id}
                                  variant="secondary"
                                  className="mono text-[10px]"
                                >
                                  {item.coachCode ?? item.name ?? "Toa"} • {item.seatClass ?? "N/A"}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-border xl:border-t-0 xl:border-l bg-muted/30 p-5 md:p-6 flex flex-col justify-between gap-4">
                            <div className="space-y-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                                Tóm tắt
                              </p>
                              <p className="text-sm leading-relaxed text-ink-muted">
                                {ticket.journeyNote ??
                                  "Tuyến, thời gian và các hạng ghế được gom lại để bạn chọn hành trình phù hợp nhanh hơn."}
                              </p>
                              <div className="space-y-2 text-sm text-ink-muted pt-1">
                                <div className="flex items-center justify-between gap-3">
                                  <span>Trạng thái</span>
                                  <span className="font-medium text-ink">
                                    {ticket.status === 1
                                      ? "Đang mở bán"
                                      : formatTicketStatus(ticket.status)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span>Lựa chọn ghế</span>
                                  <span className="font-medium text-ink tabular-nums">
                                    {ticket.ticketItems.length}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button asChild className="w-full gap-1.5">
                              <Link href={`/tickets/${ticket.id}`}>
                                Xem chi tiết
                                <ArrowRight className="size-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TicketNotch>
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
      </div>
    </AppShell>
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
    <Card variant="outlined" padding="lg" className="gap-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink tabular-nums">
            {value}
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-sm border border-border bg-primary-soft/50 text-primary">
          {icon}
        </div>
      </div>
    </Card>
  );
}

function StatCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "success" | "warning" | "destructive";
}) {
  const valueColor =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "destructive"
          ? "text-destructive"
          : "text-ink";
  return (
    <Card variant="outlined" padding="lg" className="gap-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p className={`font-display text-3xl font-semibold tracking-tight tabular-nums ${valueColor}`}>
        {value}
      </p>
      {helper ? (
        <p className="text-sm leading-relaxed text-ink-muted">{helper}</p>
      ) : null}
    </Card>
  );
}
