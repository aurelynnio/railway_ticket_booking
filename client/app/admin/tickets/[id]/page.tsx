"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  Trash2,
  TrainFront,
  Package,
  Megaphone,
  PauseCircle,
  PlayCircle,
  Boxes,
  LayoutGrid,
  SlidersHorizontal,
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
  useCloseSale,
  useOpenSale,
  usePrepareStock,
  usePublishTicket,
  useRemoveTicket,
  useTicket,
  useUnpublishTicket,
  useUpdateTicket,
} from "@/hooks/ticket.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import {
  requiredStationCode,
  requiredStationName,
  requiredText,
  splitCsv,
} from "@/lib/validation";

const editSchema = z
  .object({
    title: requiredText("Tiêu đề"),
    trainNumber: requiredText("Số tàu"),
    departureStationCode: requiredStationCode("Mã ga đi"),
    departureStationName: requiredStationName("Tên ga đi"),
    arrivalStationCode: requiredStationCode("Mã ga đến"),
    arrivalStationName: requiredStationName("Tên ga đến"),
    dateStart: z.string().min(1, "Vui lòng chọn thời gian khởi hành"),
    dateEnd: z.string().min(1, "Vui lòng chọn thời gian đến"),
    journeyNote: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.departureStationCode || !data.arrivalStationCode) return true;
      return (
        data.departureStationCode.trim().toUpperCase() !==
        data.arrivalStationCode.trim().toUpperCase()
      );
    },
    {
      message: "Ga đến không được trùng với ga đi",
      path: ["arrivalStationCode"],
    },
  )
  .refine(
    (data) => {
      if (!data.dateStart || !data.dateEnd) return true;
      return new Date(data.dateEnd) >= new Date(data.dateStart);
    },
    {
      message: "Thời gian đến phải sau thời gian khởi hành",
      path: ["dateEnd"],
    },
  );

const stockSchema = z.object({
  stockInitial: z
    .string()
    .trim()
    .min(1, "Số chỗ ban đầu là bắt buộc")
    .regex(/^\d+$/, "Số chỗ phải là số nguyên")
    .refine((v) => Number(v) >= 0, "Số chỗ phải lớn hơn hoặc bằng 0"),
  availableSeatLabels: z.string().optional(),
});

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const query = useTicket(ticketId);
  const ticket = query.data;

  const [showEdit, setShowEdit] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = useUpdateTicket(ticketId);
  const publish = usePublishTicket();
  const unpublish = useUnpublishTicket();
  const openSale = useOpenSale();
  const closeSale = useCloseSale();
  const prepareStock = usePrepareStock();
  const remove = useRemoveTicket();

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: "",
      trainNumber: "",
      departureStationCode: "",
      departureStationName: "",
      arrivalStationCode: "",
      arrivalStationName: "",
      dateStart: "",
      dateEnd: "",
      journeyNote: "",
    },
  });

  const stockForm = useForm<z.infer<typeof stockSchema>>({
    resolver: zodResolver(stockSchema),
    defaultValues: { stockInitial: "", availableSeatLabels: "" },
  });

  useEffect(() => {
    if (ticket) {
      editForm.reset({
        title: ticket.title ?? "",
        trainNumber: ticket.trainNumber ?? "",
        departureStationCode: ticket.departureStationCode ?? "",
        departureStationName: ticket.departureStationName ?? "",
        arrivalStationCode: ticket.arrivalStationCode ?? "",
        arrivalStationName: ticket.arrivalStationName ?? "",
        dateStart: ticket.dateStart ?? "",
        dateEnd: ticket.dateEnd ?? "",
        journeyNote: ticket.journeyNote ?? "",
      });
    }
  }, [ticket, editForm]);

  if (query.isLoading) {
    return <AdminLayout title="Chi tiết vé"><Skeleton className="h-60 w-full" /></AdminLayout>;
  }

  const published = ticket?.status === 1;

  return (
    <AdminLayout title="Chi tiết vé tàu" description={ticket?.title ?? undefined}>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.back()}>
          <ArrowLeft className="size-4" /> Quay lại
        </Button>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/tickets/${ticketId}/items`}>
              <LayoutGrid className="size-3.5" />
              Quản lý hạng vé
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEdit((v) => !v)}>
            <SlidersHorizontal className="size-3.5" />
            {showEdit ? "Đóng sửa" : "Sửa thông tin"}
          </Button>
        </div>
      </div>

      {showEdit && (
        <Card variant="outlined" padding="lg" className="mt-4">
          <h3 className="font-display text-base font-semibold text-ink">Chỉnh sửa chuyến</h3>
          <form
            className="mt-5 grid gap-5 sm:grid-cols-2"
            onSubmit={editForm.handleSubmit((values) =>
              update.mutate(values, { onSuccess: () => setShowEdit(false) }),
            )}
          >
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                aria-invalid={Boolean(editForm.formState.errors.title)}
                {...editForm.register("title")}
              />
              {editForm.formState.errors.title?.message && (
                <p className="text-xs font-medium text-destructive">
                  {editForm.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainNumber">Số tàu</Label>
              <Input
                id="trainNumber"
                aria-invalid={Boolean(editForm.formState.errors.trainNumber)}
                {...editForm.register("trainNumber")}
              />
              {editForm.formState.errors.trainNumber?.message && (
                <p className="text-xs font-medium text-destructive">
                  {editForm.formState.errors.trainNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="depCode">Mã ga đi</Label>
              <Input
                id="depCode"
                placeholder="VD: HN"
                aria-invalid={Boolean(editForm.formState.errors.departureStationCode)}
                {...editForm.register("departureStationCode")}
              />
              {editForm.formState.errors.departureStationCode?.message && (
                <p className="text-xs font-medium text-destructive">
                  {editForm.formState.errors.departureStationCode.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="depName">Tên ga đi</Label>
              <Input
                id="depName"
                placeholder="VD: Hà Nội"
                aria-invalid={Boolean(editForm.formState.errors.departureStationName)}
                {...editForm.register("departureStationName")}
              />
              {editForm.formState.errors.departureStationName?.message && (
                <p className="text-xs font-medium text-destructive">
                  {editForm.formState.errors.departureStationName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrCode">Mã ga đến</Label>
              <Input
                id="arrCode"
                placeholder="VD: SG"
                aria-invalid={Boolean(editForm.formState.errors.arrivalStationCode)}
                {...editForm.register("arrivalStationCode")}
              />
              {editForm.formState.errors.arrivalStationCode?.message && (
                <p className="text-xs font-medium text-destructive">
                  {editForm.formState.errors.arrivalStationCode.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrName">Tên ga đến</Label>
              <Input
                id="arrName"
                placeholder="VD: Sài Gòn"
                aria-invalid={Boolean(editForm.formState.errors.arrivalStationName)}
                {...editForm.register("arrivalStationName")}
              />
              {editForm.formState.errors.arrivalStationName?.message && (
                <p className="text-xs font-medium text-destructive">
                  {editForm.formState.errors.arrivalStationName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateStart">Khởi hành</Label>
              <Input
                id="dateStart"
                type="datetime-local"
                aria-invalid={Boolean(editForm.formState.errors.dateStart)}
                {...editForm.register("dateStart")}
              />
              {editForm.formState.errors.dateStart?.message && (
                <p className="text-xs font-medium text-destructive">
                  {editForm.formState.errors.dateStart.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateEnd">Đến nơi</Label>
              <Input
                id="dateEnd"
                type="datetime-local"
                aria-invalid={Boolean(editForm.formState.errors.dateEnd)}
                {...editForm.register("dateEnd")}
              />
              {editForm.formState.errors.dateEnd?.message && (
                <p className="text-xs font-medium text-destructive">
                  {editForm.formState.errors.dateEnd.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="accent" size="sm" disabled={update.isPending}>
                <Save className="size-4" />
                {update.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card variant="outlined" padding="lg" className="mt-4">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="font-mono">
            <TrainFront className="size-3" />
            {ticket?.trainNumber ?? "—"}
          </Badge>
          <Badge variant={published ? "success" : "secondary"}>
            {published ? "Đang mở bán" : "Nháp"}
          </Badge>
        </div>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink">
          {ticket?.departureStationName} → {ticket?.arrivalStationName}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Info label="Ga đi" value={`${ticket?.departureStationName} (${ticket?.departureStationCode})`} />
          <Info label="Ga đến" value={`${ticket?.arrivalStationName} (${ticket?.arrivalStationCode})`} />
          <Info label="Khởi hành" value={formatDateTime(ticket?.dateStart)} />
          <Info label="Đến" value={formatDateTime(ticket?.dateEnd)} />
          <Info label="Giá thấp nhất" value={formatCurrency(ticket?.ticketItems?.[0]?.priceOriginal ?? "0")} />
          <Info label="Số hạng vé" value={`${ticket?.ticketItems?.length ?? 0} hạng`} />
        </div>
        {ticket?.journeyNote && (
          <div className="mt-6 rounded-lg bg-muted/30 p-4">
            <p className="text-sm font-semibold text-ink">Ghi chú</p>
            <p className="mt-2 text-sm text-ink-muted">{ticket.journeyNote}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-ink">Thao tác điều hành</h3>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {published ? (
              <Button variant="outline" size="sm" onClick={() => unpublish.mutate({ ticketId })}>
                <PauseCircle className="size-3.5" />
                Tạm dừng bán
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={() => publish.mutate({ ticketId })}>
                <Megaphone className="size-3.5" />
                Công bố vé
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => openSale.mutate({ ticketId, payload: {} })}>
              <PlayCircle className="size-3.5" />
              Mở bán
            </Button>
            <Button variant="outline" size="sm" onClick={() => closeSale.mutate({ ticketId })}>
              <PauseCircle className="size-3.5" />
              Đóng bán
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowStock((v) => !v)}>
              <Package className="size-3.5" />
              Chuẩn bị kho
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-3.5" />
              Xóa vé
            </Button>
          </div>

          {showStock && (
            <form
              className="mt-4 grid gap-4 rounded-lg bg-muted/30 p-4 sm:grid-cols-3"
              onSubmit={stockForm.handleSubmit((values) =>
                prepareStock.mutate(
                  {
                    ticketId,
                    payload: {
                      stockInitial: Number(values.stockInitial),
                      availableSeatLabels: splitCsv(values.availableSeatLabels ?? ""),
                    },
                  },
                  { onSuccess: () => setShowStock(false) },
                ),
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="stock">Số chỗ ban đầu</Label>
                <Input
                  id="stock"
                  placeholder="VD: 40"
                  aria-invalid={Boolean(stockForm.formState.errors.stockInitial)}
                  {...stockForm.register("stockInitial")}
                />
                {stockForm.formState.errors.stockInitial?.message && (
                  <p className="text-xs font-medium text-destructive">
                    {stockForm.formState.errors.stockInitial.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats">Danh sách chỗ (phân cách dấu phẩy)</Label>
                <Input
                  id="seats"
                  placeholder="VD: A1, A2, A3"
                  aria-invalid={Boolean(stockForm.formState.errors.availableSeatLabels)}
                  {...stockForm.register("availableSeatLabels")}
                />
                {stockForm.formState.errors.availableSeatLabels?.message && (
                  <p className="text-xs font-medium text-destructive">
                    {stockForm.formState.errors.availableSeatLabels.message}
                  </p>
                )}
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="accent" size="sm" disabled={prepareStock.isPending}>
                  <Boxes className="size-3.5" />
                  {prepareStock.isPending ? "Đang xử lý..." : "Chuẩn bị"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Xóa vé tàu?"
        description={`Chuyến "${ticket?.trainNumber}" và toàn bộ hạng vé liên quan sẽ bị xóa.`}
        confirmLabel="Xóa"
        confirmPending={remove.isPending}
        onConfirm={() =>
          remove.mutate({ ticketId }, { onSuccess: () => router.push("/admin/tickets") })
        }
      />
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}