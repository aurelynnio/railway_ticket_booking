"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AdminLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTicket } from "@/hooks/ticket.hook";
import {
  requiredStationCode,
  requiredStationName,
  requiredText,
} from "@/lib/validation";

const schema = z
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

export default function AdminNewTicketPage() {
  const router = useRouter();
  const create = useCreateTicket();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
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

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: (data) => router.push(`/admin/tickets/${data.id}`),
    });
  });

  return (
    <AdminLayout title="Tạo vé tàu mới" description="Thêm chuyến tàu vào hệ thống.">
      <Card variant="outlined" padding="lg">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                aria-invalid={Boolean(form.formState.errors.title)}
                {...form.register("title")}
              />
              {form.formState.errors.title?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainNumber">Số tàu</Label>
              <Input
                id="trainNumber"
                aria-invalid={Boolean(form.formState.errors.trainNumber)}
                {...form.register("trainNumber")}
              />
              {form.formState.errors.trainNumber?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.trainNumber.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="depCode">Mã ga đi</Label>
              <Input
                id="depCode"
                placeholder="VD: HN"
                aria-invalid={Boolean(form.formState.errors.departureStationCode)}
                {...form.register("departureStationCode")}
              />
              {form.formState.errors.departureStationCode?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.departureStationCode.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="depName">Tên ga đi</Label>
              <Input
                id="depName"
                placeholder="VD: Hà Nội"
                aria-invalid={Boolean(form.formState.errors.departureStationName)}
                {...form.register("departureStationName")}
              />
              {form.formState.errors.departureStationName?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.departureStationName.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="arrCode">Mã ga đến</Label>
              <Input
                id="arrCode"
                placeholder="VD: SG"
                aria-invalid={Boolean(form.formState.errors.arrivalStationCode)}
                {...form.register("arrivalStationCode")}
              />
              {form.formState.errors.arrivalStationCode?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.arrivalStationCode.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrName">Tên ga đến</Label>
              <Input
                id="arrName"
                placeholder="VD: Sài Gòn"
                aria-invalid={Boolean(form.formState.errors.arrivalStationName)}
                {...form.register("arrivalStationName")}
              />
              {form.formState.errors.arrivalStationName?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.arrivalStationName.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateStart">Thời gian khởi hành</Label>
              <Input
                id="dateStart"
                type="datetime-local"
                aria-invalid={Boolean(form.formState.errors.dateStart)}
                {...form.register("dateStart")}
              />
              {form.formState.errors.dateStart?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.dateStart.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateEnd">Thời gian đến</Label>
              <Input
                id="dateEnd"
                type="datetime-local"
                aria-invalid={Boolean(form.formState.errors.dateEnd)}
                {...form.register("dateEnd")}
              />
              {form.formState.errors.dateEnd?.message && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.dateEnd.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea id="note" {...form.register("journeyNote")} />
          </div>
          {create.isError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive">
              Tạo vé thất bại. Vui lòng kiểm tra lại thông tin và thử lại.
            </div>
          )}
          <div className="flex gap-3">
            <Button type="submit" variant="accent" disabled={create.isPending}>
              <Save className="size-4" />
              {create.isPending ? "Đang tạo..." : "Tạo vé"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="size-4" />
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </AdminLayout>
  );
}
