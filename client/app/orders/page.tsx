"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShoppingCart,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrainFront,
  Clock,
  CreditCard,
  Search,
} from "lucide-react";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/hooks/order.hook";
import { useAuthSession } from "@/hooks/auth.hook";
import { OrderStatus } from "@/lib/api-types";
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  getOrderStatusTone,
} from "@/lib/formatters";

const STATUS_TABS: Array<{ label: string; value?: OrderStatus }> = [
  { label: "Tất cả" },
  { label: "Chờ thanh toán", value: OrderStatus.PendingPayment },
  { label: "Đã thanh toán", value: OrderStatus.Paid },
  { label: "Đã xác nhận", value: OrderStatus.Confirmed },
  { label: "Đã phát hành vé", value: OrderStatus.TicketIssued },
  { label: "Đã hủy", value: OrderStatus.Cancelled },
];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<OrderStatus | undefined>(undefined);
  const session = useAuthSession();

  const query = useOrders({
    page,
    limit: 10,
    status: activeTab,
  });

  const orders = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return (
    <AppLayout>
      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
            <span className="h-px w-10 bg-accent" />
            Lịch sử giao dịch
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Đơn hàng của tôi
          </h1>
          <p className="mt-2 max-w-xl text-base text-ink-muted">
            Theo dõi tình trạng đơn hàng, hoàn tất thanh toán hoặc xem thông tin vé đã mua.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!session.data && !session.isLoading ? (
          <Card variant="outlined" padding="lg" className="text-center py-16">
            <ShoppingCart className="mx-auto size-12 text-ink-subtle" />
            <p className="mt-4 font-display text-xl font-semibold text-ink">
              Vui lòng đăng nhập
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Đăng nhập tài khoản để xem danh sách đơn hàng và vé tàu của bạn.
            </p>
            <Button asChild variant="accent" className="mt-5">
              <Link href="/login?next=/orders">Đăng nhập ngay</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border pb-4">
              {STATUS_TABS.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.value);
                      setPage(1);
                    }}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/60 text-ink-muted hover:bg-muted hover:text-ink"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* List */}
            {query.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-6">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="mt-4 h-16 w-full" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <Card variant="outlined" padding="lg" className="text-center py-16">
                <ShoppingCart className="mx-auto size-12 text-ink-subtle" />
                <p className="mt-4 font-display text-xl font-semibold text-ink">
                  Không tìm thấy đơn hàng nào
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  {activeTab !== undefined
                    ? "Không có đơn hàng nào ở trạng thái này."
                    : "Bạn chưa có đơn đặt vé nào trong hệ thống."}
                </p>
                <Button asChild variant="accent" className="mt-5">
                  <Link href="/search">
                    <Search className="size-4 mr-2" />
                    Tìm chuyến tàu ngay
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const isPending = order.status === OrderStatus.PendingPayment;

                  return (
                    <Card
                      key={order.id}
                      variant="outlined"
                      padding="lg"
                      className="transition-all hover:border-primary/40 hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-sm font-bold text-ink">
                              #{order.id?.slice(0, 8).toUpperCase()}
                            </span>
                            <Badge variant={getOrderStatusTone(order.status)}>
                              {formatOrderStatus(order.status)}
                            </Badge>
                            {order.trainNumber && (
                              <Badge variant="outline" className="font-mono text-xs">
                                <TrainFront className="size-3 mr-1" />
                                Tàu {order.trainNumber}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-1">
                            <p className="font-display text-lg font-semibold text-ink">
                              {order.departureStationName ?? order.departureStationCode} →{" "}
                              {order.arrivalStationName ?? order.arrivalStationCode}
                            </p>
                            <p className="text-xs text-ink-muted">
                              Khởi hành: {formatDateTime(order.departureTime)} · Toa{" "}
                              {order.coachCode ?? "—"} ({order.seatClass ?? "Tiêu chuẩn"})
                            </p>
                            <p className="text-xs text-ink-muted">
                              Chỗ ngồi:{" "}
                              <span className="font-mono font-medium text-ink">
                                {order.seatLabels?.length > 0
                                  ? order.seatLabels.join(", ")
                                  : `${order.quantity} chỗ`}
                              </span>{" "}
                              · Đặt lúc: {formatDateTime(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 lg:border-t-0 lg:pt-0">
                          <div className="text-left lg:text-right">
                            <p className="text-[11px] uppercase tracking-wider text-ink-muted">
                              Tổng thanh toán
                            </p>
                            <p className="font-display text-2xl font-bold tabular-nums text-primary">
                              {formatCurrency(order.totalPrice ?? "0")}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            {isPending && (
                              <Button asChild variant="accent" size="sm">
                                <Link href={`/orders/${order.id}`}>
                                  <CreditCard className="size-3.5 mr-1" />
                                  Thanh toán
                                </Link>
                              </Button>
                            )}
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/orders/${order.id}`}>
                                Chi tiết
                                <ArrowRight className="size-3.5 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm text-ink-muted">
                      Trang {page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

