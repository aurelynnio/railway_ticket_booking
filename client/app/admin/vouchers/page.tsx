"use client";

import { useState } from "react";
import {
  Tag,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  XCircle,
  Trash2,
  Power,
  Copy,
  Calendar,
  Layers,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  useAdminVouchers,
  useCreateVoucher,
  useUpdateVoucher,
  useDeleteVoucher,
  VoucherItem,
} from "@/hooks/voucher.hook";
import { useBroadcastMarketing } from "@/hooks/notification.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createVoucherSchema,
  broadcastMarketingSchema,
} from "@/lib/validation";

export default function AdminVouchersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  // Create Voucher Form
  const createForm = useForm<z.infer<typeof createVoucherSchema>>({
    resolver: zodResolver(createVoucherSchema),
    defaultValues: {
      code: "",
      title: "",
      description: "",
      discountType: "PERCENT",
      discountValue: "10",
      maxDiscount: "100000",
      minOrderAmount: "200000",
      usageLimit: "100",
      validFrom: new Date().toISOString().slice(0, 16),
      validTo: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
    },
    mode: "onTouched",
  });

  // Broadcast Form
  const broadcastForm = useForm<z.infer<typeof broadcastMarketingSchema>>({
    resolver: zodResolver(broadcastMarketingSchema),
    defaultValues: {
      subject: "🎉 Ưu đãi đặc biệt từ Vietrail!",
      body: "Chào bạn, nhân dịp tuần lễ tri ân khách hàng, Vietrail gửi tặng bạn mã giảm giá khi đặt vé tàu hỏa trực tuyến.",
      voucherCode: "",
    },
    mode: "onTouched",
  });

  const vouchersQuery = useAdminVouchers({
    page,
    limit: 20,
    search: search || undefined,
    isActive: statusFilter === "" ? undefined : statusFilter === "true",
  });

  const createVoucher = useCreateVoucher();
  const updateVoucher = useUpdateVoucher();
  const deleteVoucher = useDeleteVoucher();
  const broadcastMarketing = useBroadcastMarketing();

  const vouchers = vouchersQuery.data?.data ?? [];

  const onCreateVoucherSubmit = async (values: z.infer<typeof createVoucherSchema>) => {
    try {
      await createVoucher.mutateAsync({
        code: values.code.trim().toUpperCase(),
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        maxDiscount: values.maxDiscount ? Number(values.maxDiscount) : undefined,
        minOrderAmount: values.minOrderAmount ? Number(values.minOrderAmount) : undefined,
        usageLimit: values.usageLimit ? Number(values.usageLimit) : undefined,
        validFrom: new Date(values.validFrom).toISOString(),
        validTo: new Date(values.validTo).toISOString(),
        isActive: true,
      });

      toast.success(`Đã tạo mã khuyến mãi ${values.code.toUpperCase()} thành công!`);
      setIsCreateOpen(false);
      createForm.reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể tạo voucher.");
    }
  };

  const handleToggleActive = async (voucher: VoucherItem) => {
    try {
      await updateVoucher.mutateAsync({
        id: voucher.id,
        payload: { isActive: !voucher.isActive },
      });
      toast.success(
        `Đã ${!voucher.isActive ? "kích hoạt" : "tạm khóa"} mã ${voucher.code}.`
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi cập nhật voucher.");
    }
  };

  const handleDelete = async (voucher: VoucherItem) => {
    if (!confirm(`Bạn có chắc muốn xóa mã voucher ${voucher.code}?`)) return;
    try {
      await deleteVoucher.mutateAsync(voucher.id);
      toast.success(`Đã xóa mã ${voucher.code}.`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi xóa voucher.");
    }
  };

  const onBroadcastSubmit = async (values: z.infer<typeof broadcastMarketingSchema>) => {
    try {
      const res: any = await broadcastMarketing.mutateAsync({
        subject: values.subject.trim(),
        body: values.body.trim(),
        voucherCode: values.voucherCode?.trim() || undefined,
      });

      toast.success(
        `Đã phát sóng thông báo khuyến mãi tới ${res?.sentCount ?? "tất cả"} khách hàng!`
      );
      setIsBroadcastOpen(false);
      broadcastForm.reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Không thể phát sóng thông báo.");
    }
  };

  return (
    <AdminLayout
      title="Khuyến mãi & Mã Voucher"
      description="Quản trị các chiến dịch ưu đãi, tạo voucher và phát sóng thông báo tiếp thị tới khách hàng."
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBroadcastOpen(true)}
          >
            <Send className="mr-1.5 size-4 text-primary" />
            Phát sóng Tiếp thị
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-1.5 size-4" />
            Tạo Voucher Mới
          </Button>
        </div>
      }
    >
      {/* Search & Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Tìm theo mã hoặc tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang kích hoạt</option>
            <option value="false">Tạm khóa</option>
          </Select>
        </div>
      </div>

      {/* Vouchers Table */}
      <Card variant="outlined" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs font-semibold text-ink-muted uppercase">
              <tr>
                <th className="p-4">Mã Voucher</th>
                <th className="p-4">Chương trình</th>
                <th className="p-4">Mức giảm</th>
                <th className="p-4">Đơn tối thiểu</th>
                <th className="p-4">Lượt dùng</th>
                <th className="p-4">Thời hạn</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vouchersQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-ink-muted">
                    Đang tải danh sách voucher...
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-ink-muted">
                    Chưa có mã khuyến mãi nào. Hãy bấm "Tạo Voucher Mới" để bắt đầu!
                  </td>
                </tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-primary bg-primary-soft/30 px-2 py-0.5 rounded text-xs">
                          {v.code}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-ink-muted hover:text-ink"
                          onClick={() => {
                            navigator.clipboard.writeText(v.code);
                            toast.success(`Đã sao chép mã ${v.code}!`);
                          }}
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-ink">{v.title}</div>
                      {v.description && (
                        <div className="text-xs text-ink-muted truncate max-w-[200px]">
                          {v.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-emerald-600">
                        {v.discountType === "PERCENT"
                          ? `Giảm ${v.discountValue}%`
                          : `Giảm ${formatCurrency(v.discountValue)}`}
                      </span>
                      {v.maxDiscount && v.discountType === "PERCENT" && (
                        <div className="text-[11px] text-ink-muted">
                          Tối đa {formatCurrency(v.maxDiscount)}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-xs font-mono">
                      {v.minOrderAmount ? formatCurrency(v.minOrderAmount) : "Không yêu cầu"}
                    </td>
                    <td className="p-4 text-xs">
                      <span className="font-mono font-semibold text-ink">
                        {v.usedCount}
                      </span>
                      <span className="text-ink-muted">
                        {" / "}
                        {v.usageLimit ? v.usageLimit : "∞"}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-ink-muted">
                      {new Date(v.validTo).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-4">
                      {v.isActive ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                          Hoạt động
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">
                          Tạm khóa
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title={v.isActive ? "Tạm khóa mã này" : "Kích hoạt mã này"}
                          onClick={() => handleToggleActive(v)}
                        >
                          <Power
                            className={`size-4 ${v.isActive ? "text-amber-600" : "text-emerald-600"}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-rose-600 hover:bg-rose-50"
                          title="Xóa mã này"
                          onClick={() => handleDelete(v)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card shadow-2xl">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Tag className="size-5 text-primary" />
                Tạo Mã Khuyến Mãi (Voucher) Mới
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={createForm.handleSubmit(onCreateVoucherSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code" className="text-xs font-semibold">
                      Mã Code (In hoa, viết liền) *
                    </Label>
                    <Input
                      id="code"
                      placeholder="VD: VIETRAIL50"
                      {...createForm.register("code")}
                      className="mt-1 font-mono uppercase font-bold"
                      aria-invalid={Boolean(createForm.formState.errors.code)}
                    />
                    {createForm.formState.errors.code?.message && (
                      <p className="mt-1 text-xs font-medium text-destructive">
                        {createForm.formState.errors.code.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-xs font-semibold">
                      Loại giảm giá *
                    </Label>
                    <Select
                      id="type"
                      {...createForm.register("discountType")}
                      className="mt-1"
                    >
                      <option value="PERCENT">Giảm theo %</option>
                      <option value="FIXED_AMOUNT">Giảm số tiền cố định (VND)</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="title" className="text-xs font-semibold">
                    Tên chương trình ưu đãi *
                  </Label>
                  <Input
                    id="title"
                    placeholder="VD: Chào hè rực rỡ - Giảm 10% toàn tuyến"
                    {...createForm.register("title")}
                    className="mt-1"
                    aria-invalid={Boolean(createForm.formState.errors.title)}
                  />
                  {createForm.formState.errors.title?.message && (
                    <p className="mt-1 text-xs font-medium text-destructive">
                      {createForm.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="desc" className="text-xs font-semibold">
                    Mô tả chi tiết (Tùy chọn)
                  </Label>
                  <Input
                    id="desc"
                    placeholder="Áp dụng cho mọi khách hàng đặt vé trực tuyến..."
                    {...createForm.register("description")}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="val" className="text-xs font-semibold">
                      Mức giảm *
                    </Label>
                    <Input
                      id="val"
                      type="number"
                      min={1}
                      {...createForm.register("discountValue")}
                      className="mt-1"
                      aria-invalid={Boolean(createForm.formState.errors.discountValue)}
                    />
                    {createForm.formState.errors.discountValue?.message && (
                      <p className="mt-1 text-xs font-medium text-destructive">
                        {createForm.formState.errors.discountValue.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="max" className="text-xs font-semibold">
                      Giảm tối đa (VND - khi giảm %)
                    </Label>
                    <Input
                      id="max"
                      type="number"
                      min={0}
                      placeholder="100000"
                      {...createForm.register("maxDiscount")}
                      className="mt-1"
                    />
                    {createForm.formState.errors.maxDiscount?.message && (
                      <p className="mt-1 text-xs font-medium text-destructive">
                        {createForm.formState.errors.maxDiscount.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minOrder" className="text-xs font-semibold">
                      Đơn hàng tối thiểu (VND)
                    </Label>
                    <Input
                      id="minOrder"
                      type="number"
                      min={0}
                      placeholder="200000"
                      {...createForm.register("minOrderAmount")}
                      className="mt-1"
                    />
                    {createForm.formState.errors.minOrderAmount?.message && (
                      <p className="mt-1 text-xs font-medium text-destructive">
                        {createForm.formState.errors.minOrderAmount.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="limit" className="text-xs font-semibold">
                      Giới hạn lượt dùng tổng
                    </Label>
                    <Input
                      id="limit"
                      type="number"
                      min={1}
                      placeholder="100"
                      {...createForm.register("usageLimit")}
                      className="mt-1"
                    />
                    {createForm.formState.errors.usageLimit?.message && (
                      <p className="mt-1 text-xs font-medium text-destructive">
                        {createForm.formState.errors.usageLimit.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vFrom" className="text-xs font-semibold">
                      Ngày bắt đầu
                    </Label>
                    <Input
                      id="vFrom"
                      type="datetime-local"
                      {...createForm.register("validFrom")}
                      className="mt-1 text-xs"
                      aria-invalid={Boolean(createForm.formState.errors.validFrom)}
                    />
                    {createForm.formState.errors.validFrom?.message && (
                      <p className="mt-1 text-xs font-medium text-destructive">
                        {createForm.formState.errors.validFrom.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="vTo" className="text-xs font-semibold">
                      Ngày hết hạn *
                    </Label>
                    <Input
                      id="vTo"
                      type="datetime-local"
                      {...createForm.register("validTo")}
                      className="mt-1 text-xs"
                      aria-invalid={Boolean(createForm.formState.errors.validTo)}
                    />
                    {createForm.formState.errors.validTo?.message && (
                      <p className="mt-1 text-xs font-medium text-destructive">
                        {createForm.formState.errors.validTo.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsCreateOpen(false);
                      createForm.reset();
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    disabled={createVoucher.isPending}
                  >
                    {createVoucher.isPending ? "Đang lưu..." : "Xác nhận Tạo"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BROADCAST MARKETING MODAL */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-card shadow-2xl">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="size-5 text-amber-500" />
                Phát Sóng Thông Báo Tiếp Thị (Marketing Broadcast)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={broadcastForm.handleSubmit(onBroadcastSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="bsubject" className="text-xs font-semibold">
                    Tiêu đề thông báo *
                  </Label>
                  <Input
                    id="bsubject"
                    {...broadcastForm.register("subject")}
                    className="mt-1"
                    aria-invalid={Boolean(broadcastForm.formState.errors.subject)}
                  />
                  {broadcastForm.formState.errors.subject?.message && (
                    <p className="mt-1 text-xs font-medium text-destructive">
                      {broadcastForm.formState.errors.subject.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bbody" className="text-xs font-semibold">
                    Nội dung thông điệp *
                  </Label>
                  <textarea
                    id="bbody"
                    rows={4}
                    {...broadcastForm.register("body")}
                    className="mt-1 w-full rounded-md border border-input bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-invalid={Boolean(broadcastForm.formState.errors.body)}
                  />
                  {broadcastForm.formState.errors.body?.message && (
                    <p className="mt-1 text-xs font-medium text-destructive">
                      {broadcastForm.formState.errors.body.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bcode" className="text-xs font-semibold">
                    Đính kèm mã Voucher khuyến mãi (Tùy chọn)
                  </Label>
                  <Select
                    id="bcode"
                    {...broadcastForm.register("voucherCode")}
                    className="mt-1"
                  >
                    <option value="">-- Không đính kèm mã --</option>
                    {vouchers.map((v) => (
                      <option key={v.id} value={v.code}>
                        {v.code} - {v.title}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-1 text-xs text-ink-muted">
                    Hệ thống sẽ gửi thông báo này vào Hộp thư thông báo của tất cả khách hàng.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsBroadcastOpen(false);
                      broadcastForm.reset();
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    disabled={broadcastMarketing.isPending}
                  >
                    {broadcastMarketing.isPending
                      ? "Đang phát sóng..."
                      : "Gửi Thông Báo Tới Khách Hàng"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}

