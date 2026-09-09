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

const schema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề"),
  trainNumber: z.string().min(1, "Vui lòng nhập số tàu"),
  departureStationCode: z.string().min(1),
  departureStationName: z.string().min(1),
  arrivalStationCode: z.string().min(1),
  arrivalStationName: z.string().min(1),
  dateStart: z.string().min(1),
  dateEnd: z.string().min(1),
  journeyNote: z.string().optional(),
});

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
              <Input id="title" {...form.register("title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trainNumber">Số tàu</Label>
              <Input id="trainNumber" {...form.register("trainNumber")} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="depCode">Mã ga đi</Label>
              <Input id="depCode" {...form.register("departureStationCode")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depName">Tên ga đi</Label>
              <Input id="depName" {...form.register("departureStationName")} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="arrCode">Mã ga đến</Label>
              <Input id="arrCode" {...form.register("arrivalStationCode")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrName">Tên ga đến</Label>
              <Input id="arrName" {...form.register("arrivalStationName")} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateStart">Thời gian khởi hành</Label>
              <Input id="dateStart" type="datetime-local" {...form.register("dateStart")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateEnd">Thời gian đến</Label>
              <Input id="dateEnd" type="datetime-local" {...form.register("dateEnd")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea id="note" {...form.register("journeyNote")} />
          </div>
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
