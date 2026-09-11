"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  Trash2,
  BadgePercent,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useChangePrice,
  useChangeSaleWindow,
  useReleaseSeat,
  useRemoveTicketItem,
  useReserveSeat,
  useTicket,
  useTicketItem,
  useUpdateTicketItem,
} from "@/hooks/ticket.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { requiredText } from "@/lib/validation";

const editSchema = z.object({
  name: requiredText("Tên hạng"),
  description: z.string().optional(),
  coachCode: z.string().optional(),
  seatClass: z.string().optional(),
  seatType: z.string().optional(),
});

const priceSchema = z.object({
  priceOriginal: z.string().regex(/^\d+$/, "Phải là số nguyên"),
  priceFlash: z.string().optional(),
});

const windowSchema = z
  .object({
    saleStartTime: z.string().optional(),
    saleEndTime: z.string().optional(),
  })
  .refine(
    (v) => !v.saleStartTime || !v.saleEndTime || v.saleStartTime <= v.saleEndTime,
    { message: "Mở bán phải trước đóng bán", path: ["saleEndTime"] },
  );

const seatSchema = z.object({
  seatLabel: requiredText("Số chỗ"),
});

export default function AdminTicketItemPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const itemId = (Array.isArray(params.itemId) ? params.itemId[0] : params.itemId) as string;

  const [confirmDelete, setConfirmDelete] = useState(false);

  const ticketQuery = useTicket(ticketId);
  const itemQuery = useTicketItem(ticketId, itemId);
  const item = itemQuery.data;

  const update = useUpdateTicketItem();
  const changePrice = useChangePrice();
  const changeWindow = useChangeSaleWindow();
  const reserveSeat = useReserveSeat();
  const releaseSeat = useReleaseSeat();
  const removeItem = useRemoveTicketItem();

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", description: "", coachCode: "", seatClass: "", seatType: "" },
  });
  const priceForm = useForm<z.infer<typeof priceSchema>>({
    resolver: zodResolver(priceSchema),
    defaultValues: { priceOriginal: "", priceFlash: "" },
  });
  const windowForm = useForm<z.infer<typeof windowSchema>>({
    resolver: zodResolver(windowSchema),
    defaultValues: { saleStartTime: "", saleEndTime: "" },
  });
  const seatForm = useForm<z.infer<typeof seatSchema>>({
    resolver: zodResolver(seatSchema),
    defaultValues: { seatLabel: "" },
  });

  useEffect(() => {
    if (item) {
      editForm.reset({
        name: item.name ?? "",
        description: item.description ?? "",
        coachCode: item.coachCode ?? "",
        seatClass: item.seatClass ?? "",
        seatType: item.seatType ?? "",
      });
      priceForm.reset({
        priceOriginal: item.priceOriginal ?? "",
        priceFlash: item.priceFlash ?? "",
      });
      windowForm.reset({
        saleStartTime: item.saleStartTime ?? "",
        saleEndTime: item.saleEndTime ?? "",
      });
    }
  }, [item, editForm, priceForm, windowForm]);

  if (itemQuery.isLoading || ticketQuery.isLoading) {
    return <AdminLayout title="Chi tiết hạng vé"><Skeleton className="h-60 w-full" /></AdminLayout>;
  }

  const available = item?.availableSeatLabels ?? [];
  const occupied = item?.occupiedSeatLabels ?? [];

  return (
    <AdminLayout title="Chi tiết hạng vé" description={item?.name ?? undefined}>
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.back()}>
        <ArrowLeft className="size-4" /> Quay lại
      </Button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Thông tin + sửa */}
        <Card variant="outlined" padding="lg">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink">{item?.name ?? "—"}</h3>
            <Badge variant={item?.saleOpen ? "success" : "secondary"}>
              {item?.saleOpen ? "Đang mở bán" : "Đóng bán"}
            </Badge>
          </div>
          <div className="mt-5 space-y-3 rounded-lg bg-muted/30 p-4 text-sm">
            <Row label="Toa" value={item?.coachCode ?? "—"} />
            <Row label="Hạng chỗ" value={item?.seatClass ?? "—"} />
            <Row label="Loại chỗ" value={item?.seatType ?? "—"} />
            <Row label="Giá gốc" value={formatCurrency(item?.priceOriginal ?? "0")} />
            <Row label="Giá flash" value={formatCurrency(item?.priceFlash ?? "—")} />
            <Row label="Còn chỗ" value={`${item?.stockAvailable ?? 0} / ${item?.stockInitial ?? 0}`} />
            <Row label="Mở bán lúc" value={item?.saleStartTime ? formatDateTime(item.saleStartTime) : "—"} />
            <Row label="Đóng bán lúc" value={item?.saleEndTime ? formatDateTime(item.saleEndTime) : "—"} />
          </div>

          <form
            className="mt-5 grid gap-4 sm:grid-cols-2"
            onSubmit={editForm.handleSubmit((values) =>
              update.mutate({ ticketId, ticketItemId: itemId, payload: values }),
            )}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Tên hạng</Label>
              <Input id="name" {...editForm.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach">Toa</Label>
              <Input id="coach" {...editForm.register("coachCode")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Hạng chỗ</Label>
              <Input id="class" {...editForm.register("seatClass")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Loại chỗ</Label>
              <Input id="type" {...editForm.register("seatType")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="desc">Mô tả</Label>
              <Input id="desc" {...editForm.register("description")} />
            </div>
            <Button type="submit" variant="accent" size="sm" disabled={update.isPending}>
              <Save className="size-3.5" />
              {update.isPending ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          {/* Sơ đồ chỗ */}
          <Card variant="outlined" padding="lg">
            <h3 className="text-sm font-semibold text-ink">Sơ đồ chỗ ngồi</h3>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {available.map((label) => (
                <span
                  key={label}
                  className="flex size-9 items-center justify-center rounded-md bg-primary-soft text-xs font-semibold text-primary"
                >
                  {label}
                </span>
              ))}
              {occupied.map((label) => (
                <span
                  key={label}
                  className="flex size-9 items-center justify-center rounded-md bg-destructive/10 text-xs font-medium text-destructive line-through"
                >
                  {label}
                </span>
              ))}
              {available.length + occupied.length === 0 && (
                <p className="text-sm text-ink-muted">Chưa có dữ liệu chỗ.</p>
              )}
            </div>
          </Card>

          {/* Đổi giá */}
          <Card variant="outlined" padding="lg">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <BadgePercent className="size-4 text-accent" /> Đổi giá
            </h3>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-3"
              onSubmit={priceForm.handleSubmit((values) =>
                changePrice.mutate({
                  ticketId,
                  ticketItemId: itemId,
                  payload: {
                    priceOriginal: values.priceOriginal,
                    priceFlash: values.priceFlash || undefined,
                  },
                }),
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="price">Giá gốc (đ)</Label>
                <Input id="price" {...priceForm.register("priceOriginal")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flash">Giá flash (đ)</Label>
                <Input id="flash" {...priceForm.register("priceFlash")} />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="outline" size="sm" disabled={changePrice.isPending}>
                  {changePrice.isPending ? "Đang lưu..." : "Cập nhật giá"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Đổi khung giờ bán */}
          <Card variant="outlined" padding="lg">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Clock className="size-4 text-accent" /> Khung giờ bán
            </h3>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-3"
              onSubmit={windowForm.handleSubmit((values) =>
                changeWindow.mutate({
                  ticketId,
                  ticketItemId: itemId,
                  payload: {
                    saleStartTime: values.saleStartTime || undefined,
                    saleEndTime: values.saleEndTime || undefined,
                  },
                }),
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="start">Mở bán lúc</Label>
                <Input id="start" type="datetime-local" {...windowForm.register("saleStartTime")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Đóng bán lúc</Label>
                <Input id="end" type="datetime-local" {...windowForm.register("saleEndTime")} />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="outline" size="sm" disabled={changeWindow.isPending}>
                  {changeWindow.isPending ? "Đang lưu..." : "Cập nhật"}
                </Button>
              </div>
              {windowForm.formState.errors.saleEndTime?.message && (
                <p className="text-xs font-medium text-destructive sm:col-span-3">
                  {windowForm.formState.errors.saleEndTime.message}
                </p>
              )}
            </form>
          </Card>

          {/* Điều phối chỗ */}
          <Card variant="outlined" padding="lg">
            <h3 className="text-sm font-semibold text-ink">Điều phối chỗ (admin)</h3>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-3"
              onSubmit={seatForm.handleSubmit((values) => {
                reserveSeat.mutate({ ticketId, ticketItemId: itemId, payload: values });
                seatForm.reset({ seatLabel: "" });
              })}
            >
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="seat">Số chỗ</Label>
                <Input id="seat" placeholder="VD: A1" {...seatForm.register("seatLabel")} />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" variant="outline" size="sm" disabled={reserveSeat.isPending}>
                  <ArrowDownToLine className="size-3.5" />
                  Giữ
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={releaseSeat.isPending}
                  onClick={() => {
                    const label = seatForm.getValues("seatLabel");
                    if (!label) return;
                    releaseSeat.mutate({ ticketId, ticketItemId: itemId, payload: { seatLabel: label } });
                    seatForm.reset({ seatLabel: "" });
                  }}
                >
                  <ArrowUpFromLine className="size-3.5" />
                  Trả
                </Button>
              </div>
            </form>
          </Card>

          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4" />
            Xóa hạng vé
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Xóa hạng vé?"
        description={`Hạng vé "${item?.name ?? itemId}" sẽ bị xóa khỏi chuyến ${ticketQuery.data?.trainNumber ?? ""}.`}
        confirmLabel="Xóa"
        confirmPending={removeItem.isPending}
        onConfirm={() =>
          removeItem.mutate(
            { ticketId, ticketItemId: itemId },
            { onSuccess: () => router.push(`/admin/tickets/${ticketId}/items`) },
          )
        }
      />
    </AdminLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}