"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AppShell, Panel } from "@/components/app-shell";
import { FormField } from "@/components/form-field";
import { NoticeBox } from "@/components/railway-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTicket } from "@/hooks/ticket.hook";
import {
  integerText,
  optionalDateTimeText,
  optionalText,
  requiredCsvText,
  requiredText,
  splitCsv,
  toOptionalIsoDateTime,
  toOptionalString,
} from "@/lib/validation";

const createTicketSchema = z
  .object({
    title: requiredText("Tên vé"),
    trainNumber: optionalText(),
    departureCode: requiredText("Mã ga đi"),
    departureName: requiredText("Tên ga đi"),
    arrivalCode: requiredText("Mã ga đến"),
    arrivalName: requiredText("Tên ga đến"),
    journeyNote: optionalText(),
    dateStart: optionalDateTimeText("Giờ khởi hành"),
    dateEnd: optionalDateTimeText("Giờ đến"),
    coachCode: requiredText("Mã toa"),
    seatClass: requiredText("Hạng ghế"),
    seatType: optionalText(),
    seatLabels: requiredCsvText("Danh sách ghế"),
    priceOriginal: integerText("Giá gốc", 0),
    priceFlash: optionalText().refine(
      (value) => value.length === 0 || /^\d+$/.test(value),
      "Giá flash phải là số nguyên không âm",
    ),
  })
  .refine(
    (values) =>
      !values.dateStart ||
      !values.dateEnd ||
      new Date(values.dateEnd).getTime() >=
        new Date(values.dateStart).getTime(),
    {
      message: "Giờ đến phải sau giờ khởi hành",
      path: ["dateEnd"],
    },
  );

export default function AdminTicketNewPage() {
  const router = useRouter();
  const createTicket = useCreateTicket();
  const form = useForm<z.infer<typeof createTicketSchema>>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      trainNumber: "",
      departureCode: "",
      departureName: "",
      arrivalCode: "",
      arrivalName: "",
      journeyNote: "",
      dateStart: "",
      dateEnd: "",
      coachCode: "",
      seatClass: "",
      seatType: "",
      seatLabels: "",
      priceOriginal: "",
      priceFlash: "",
    },
  });

  return (
    <AppShell
      title="Tạo vé mới"
      description="Thiết lập hành trình, lịch chạy và hạng ghế đầu tiên để mở bán."
    >
      <Panel
        eyebrow="Tạo vé"
        title="Thông tin hành trình"
        description="Nhập tuyến, thời gian và danh sách ghế cho hạng vé mặc định."
      >
        <NoticeBox
          title="Quy trình tạo vé"
          description="Tạo hành trình trước, sau đó vào trang chi tiết để mở bán, chuẩn bị tồn chỗ và bổ sung thêm hạng ghế."
          tone="secondary"
        />
        <form
          className="mt-6 grid gap-4 xl:grid-cols-2"
          onSubmit={form.handleSubmit(async (values) => {
            const parsedSeatLabels = splitCsv(values.seatLabels);
            const result = await createTicket.mutateAsync({
              title: values.title,
              trainNumber: toOptionalString(values.trainNumber),
              departureStationCode: values.departureCode,
              departureStationName: values.departureName,
              arrivalStationCode: values.arrivalCode,
              arrivalStationName: values.arrivalName,
              journeyNote: toOptionalString(values.journeyNote),
              dateStart: toOptionalIsoDateTime(values.dateStart),
              dateEnd: toOptionalIsoDateTime(values.dateEnd),
              ticketItems: [
                {
                  coachCode: values.coachCode,
                  seatClass: values.seatClass,
                  seatType: toOptionalString(values.seatType),
                  seatLabels: parsedSeatLabels,
                  availableSeatLabels: parsedSeatLabels,
                  stockInitial: parsedSeatLabels.length,
                  stockAvailable: parsedSeatLabels.length,
                  priceOriginal: values.priceOriginal,
                  priceFlash: toOptionalString(values.priceFlash),
                },
              ],
            });

            router.push(`/admin/tickets/${result.id}`);
          })}
        >
          <FormField
            label="Tên vé"
            error={form.formState.errors.title?.message}
          >
            <Input
              aria-invalid={Boolean(form.formState.errors.title)}
              {...form.register("title")}
            />
          </FormField>
          <FormField
            label="Số tàu"
            error={form.formState.errors.trainNumber?.message}
          >
            <Input
              aria-invalid={Boolean(form.formState.errors.trainNumber)}
              {...form.register("trainNumber")}
            />
          </FormField>
          <FormField
            label="Mã ga đi"
            error={form.formState.errors.departureCode?.message}
          >
            <Input
              aria-invalid={Boolean(form.formState.errors.departureCode)}
              {...form.register("departureCode")}
            />
          </FormField>
          <FormField
            label="Tên ga đi"
            error={form.formState.errors.departureName?.message}
          >
            <Input
              aria-invalid={Boolean(form.formState.errors.departureName)}
              {...form.register("departureName")}
            />
          </FormField>
          <FormField
            label="Mã ga đến"
            error={form.formState.errors.arrivalCode?.message}
          >
            <Input
              aria-invalid={Boolean(form.formState.errors.arrivalCode)}
              {...form.register("arrivalCode")}
            />
          </FormField>
          <FormField
            label="Tên ga đến"
            error={form.formState.errors.arrivalName?.message}
          >
            <Input
              aria-invalid={Boolean(form.formState.errors.arrivalName)}
              {...form.register("arrivalName")}
            />
          </FormField>
          <FormField
            label="Khởi hành"
            error={form.formState.errors.dateStart?.message}
          >
            <Input
              type="datetime-local"
              aria-invalid={Boolean(form.formState.errors.dateStart)}
              {...form.register("dateStart")}
            />
          </FormField>
          <FormField
            label="Đến nơi"
            error={form.formState.errors.dateEnd?.message}
          >
            <Input
              type="datetime-local"
              aria-invalid={Boolean(form.formState.errors.dateEnd)}
              {...form.register("dateEnd")}
            />
          </FormField>
          <FormField
            label="Mã toa"
            error={form.formState.errors.coachCode?.message}
          >
            <Input
              aria-invalid={Boolean(form.formState.errors.coachCode)}
              {...form.register("coachCode")}
            />
          </FormField>
          <FormField
            label="Hạng ghế"
            error={form.formState.errors.seatClass?.message}
          >
            <Input
              aria-invalid={Boolean(form.formState.errors.seatClass)}
              {...form.register("seatClass")}
            />
          </FormField>
          <FormField
            label="Loại ghế"
            error={form.formState.errors.seatType?.message}
          >
            <Input
              aria-invalid={Boolean(form.formState.errors.seatType)}
              {...form.register("seatType")}
            />
          </FormField>
          <FormField
            label="Giá gốc"
            error={form.formState.errors.priceOriginal?.message}
          >
            <Input
              aria-invalid={Boolean(form.formState.errors.priceOriginal)}
              {...form.register("priceOriginal")}
            />
          </FormField>
          <FormField
            label="Giá ưu đãi"
            error={form.formState.errors.priceFlash?.message}
          >
            <Input
              aria-invalid={Boolean(form.formState.errors.priceFlash)}
              {...form.register("priceFlash")}
            />
          </FormField>
          <FormField
            className="xl:col-span-2"
            label="Ghi chú hành trình"
            error={form.formState.errors.journeyNote?.message}
          >
            <Textarea
              aria-invalid={Boolean(form.formState.errors.journeyNote)}
              {...form.register("journeyNote")}
            />
          </FormField>
          <FormField
            className="xl:col-span-2"
            label="Danh sách ghế CSV"
            hint="Ví dụ A1,A2,A3"
            error={form.formState.errors.seatLabels?.message}
          >
            <Textarea
              aria-invalid={Boolean(form.formState.errors.seatLabels)}
              {...form.register("seatLabels")}
            />
          </FormField>

          <div className="xl:col-span-2 flex flex-wrap gap-2 pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={createTicket.isPending}
            >
              {createTicket.isPending ? "Đang tạo..." : "Tạo vé"}
            </Button>
          </div>
        </form>
      </Panel>
    </AppShell>
  );
}
