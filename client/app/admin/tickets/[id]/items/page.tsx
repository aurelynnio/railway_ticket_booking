"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash2, TrainFront } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAddTicketItem, useRemoveTicketItem, useTicket } from "@/hooks/ticket.hook";
import { formatCurrency } from "@/lib/formatters";
import { optionalIntegerText, requiredCsvText, requiredText, splitCsv } from "@/lib/validation";

const itemSchema = z
  .object({
    name: requiredText("Tên hạng"),
    coachCode: z.string().optional(),
    seatClass: z.string().optional(),
    seatType: z.string().optional(),
    priceOriginal: z
      .string()
      .trim()
      .min(1, "Giá gốc là bắt buộc")
      .regex(/^\d+$/, "Giá gốc phải là số nguyên"),
    priceFlash: z
      .string()
      .trim()
      .refine(
        (v) => v.length === 0 || /^\d+$/.test(v),
        "Giá flash phải là số nguyên",
      )
      .optional(),
    stockInitial: optionalIntegerText("Số chỗ", 0),
    availableSeatLabels: requiredCsvText("Danh sách chỗ"),
    saleStartTime: z.string().optional(),
    saleEndTime: z.string().optional(),
  })
  .refine(
    (v) => !v.saleStartTime || !v.saleEndTime || v.saleStartTime <= v.saleEndTime,
    { message: "Thời gian mở bán phải trước thời gian đóng bán", path: ["saleEndTime"] },
  )
  .refine(
    (v) => {
      if (!v.priceFlash?.trim() || !v.priceOriginal?.trim()) return true;
      const flash = Number(v.priceFlash.trim());
      const orig = Number(v.priceOriginal.trim());
      if (Number.isNaN(flash) || Number.isNaN(orig)) return true;
      return flash <= orig;
    },
    { message: "Giá flash không được lớn hơn giá gốc", path: ["priceFlash"] },
  );

export default function AdminTicketItemsPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name?: string | null } | null>(null);

  const query = useTicket(ticketId);
  const ticket = query.data;
  const addItem = useAddTicketItem();
  const removeItem = useRemoveTicketItem();

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      coachCode: "",
      seatClass: "",
      seatType: "",
      priceOriginal: "",
      priceFlash: "",
      stockInitial: "",
      availableSeatLabels: "",
      saleStartTime: "",
      saleEndTime: "",
    },
  });

  if (query.isLoading) {
    return <AdminLayout title="Quản lý hạng vé"><Skeleton className="h-60 w-full" /></AdminLayout>;
  }

  const items = ticket?.ticketItems ?? [];

  return (
    <AdminLayout title="Quản lý hạng vé" description={ticket?.title ?? undefined}>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Quay lại
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" />
          {showForm ? "Đóng" : "Thêm hạng vé"}
        </Button>
      </div>

      <Card variant="outlined" padding="lg" className="mt-4">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="font-mono">
            <TrainFront className="size-3" />
            {ticket?.trainNumber ?? "—"}
          </Badge>
          <span className="text-sm text-ink-muted">
            {ticket?.departureStationName} → {ticket?.arrivalStationName}
          </span>
        </div>
      </Card>

      {showForm && (
        <Card variant="outlined" padding="lg" className="mt-4">
          <h3 className="font-display text-base font-semibold text-ink">Thêm hạng vé mới</h3>
          <form
            className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={form.handleSubmit((values) =>
              addItem.mutate(
                {
                  ticketId,
                  payload: {
                    name: values.name,
                    coachCode: values.coachCode || undefined,
                    seatClass: values.seatClass || undefined,
                    seatType: values.seatType || undefined,
                    priceOriginal: values.priceOriginal,
                    priceFlash: values.priceFlash || undefined,
                    stockInitial: values.stockInitial ? Number(values.stockInitial) : undefined,
                    availableSeatLabels: splitCsv(values.availableSeatLabels),
                    saleStartTime: values.saleStartTime || undefined,
                    saleEndTime: values.saleEndTime || undefined,
                  },
                },
                {
                  onSuccess: () => {
                    form.reset({
                      name: "",
                      coachCode: "",
                      seatClass: "",
                      seatType: "",
                      priceOriginal: "",
                      priceFlash: "",
                      stockInitial: "",
                      availableSeatLabels: "",
                      saleStartTime: "",
                      saleEndTime: "",
                    });
                    setShowForm(false);
                  },
                },
              ),
            )}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Tên hạng</Label>
              <Input
                id="name"
                placeholder="VD: Giường nằm khoang 4"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              {form.formState.errors.name?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach">Toa</Label>
              <Input id="coach" placeholder="VD: A1" {...form.register("coachCode")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Hạng chỗ</Label>
              <Input id="class" placeholder="sleeper | seat" {...form.register("seatClass")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Loại chỗ</Label>
              <Input id="type" placeholder="VD: Khoang 4 giường" {...form.register("seatType")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Giá gốc (đ)</Label>
              <Input
                id="price"
                placeholder="VD: 350000"
                aria-invalid={Boolean(form.formState.errors.priceOriginal)}
                {...form.register("priceOriginal")}
              />
              {form.formState.errors.priceOriginal?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.priceOriginal.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="flash">Giá flash (đ, tùy chọn)</Label>
              <Input
                id="flash"
                placeholder="VD: 320000"
                aria-invalid={Boolean(form.formState.errors.priceFlash)}
                {...form.register("priceFlash")}
              />
              {form.formState.errors.priceFlash?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.priceFlash.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Số chỗ ban đầu</Label>
              <Input
                id="stock"
                placeholder="VD: 40"
                aria-invalid={Boolean(form.formState.errors.stockInitial)}
                {...form.register("stockInitial")}
              />
              {form.formState.errors.stockInitial?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.stockInitial.message}
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="labels">Danh sách chỗ (phân cách dấu phẩy)</Label>
              <Input
                id="labels"
                placeholder="VD: A1, A2, A3"
                {...form.register("availableSeatLabels")}
              />
              {form.formState.errors.availableSeatLabels && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.availableSeatLabels.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Mở bán lúc</Label>
              <Input id="start" type="datetime-local" {...form.register("saleStartTime")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Đóng bán lúc</Label>
              <Input id="end" type="datetime-local" {...form.register("saleEndTime")} />
              {form.formState.errors.saleEndTime?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.saleEndTime.message}
                </p>
              )}
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="accent" size="sm" disabled={addItem.isPending}>
                <Plus className="size-3.5" />
                {addItem.isPending ? "Đang thêm..." : "Thêm hạng vé"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card variant="outlined" padding="none" className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hạng vé</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Còn chỗ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-ink-muted">
                  Chưa có hạng vé nào. Thêm hạng vé đầu tiên.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-ink">{item.name ?? "—"}</p>
                    <p className="text-xs text-ink-muted">
                      {item.coachCode} · {item.seatType}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-semibold tabular-nums text-primary">
                  {formatCurrency(item.priceFlash ?? item.priceOriginal ?? "0")}
                </TableCell>
                <TableCell>
                  <Badge variant={(item.stockAvailable ?? 0) > 0 ? "success" : "destructive"}>
                    {item.stockAvailable ?? 0} / {item.stockInitial ?? 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.saleOpen ? "success" : "secondary"}>
                    {item.saleOpen ? "Mở bán" : "Đóng"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/tickets/${ticketId}/items/${item.id}`}>
                        Chi tiết
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Xóa hạng vé"
                      onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Xóa hạng vé?"
        description={`Hạng vé "${deleteTarget?.name ?? deleteTarget?.id}" sẽ bị xóa khỏi chuyến.`}
        confirmLabel="Xóa"
        confirmPending={removeItem.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          removeItem.mutate(
            { ticketId, ticketItemId: deleteTarget.id },
            { onSuccess: () => setDeleteTarget(null) },
          );
        }}
      />
    </AdminLayout>
  );
}