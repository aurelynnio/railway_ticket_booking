"use client";

import { useState } from "react";
import { Pause, Play, Plus, Save, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { NoticeBox } from "@/components/railway-ui";
import {
  useAddTicketItem,
  useCloseSale,
  useOpenSale,
  usePrepareStock,
  usePublishTicket,
  useRemoveTicket,
  useUnpublishTicket,
  useUpdateTicket,
} from "@/hooks/ticket.hook";

import type { TicketResponse, TicketItemResponse } from "@/lib/api-types/ticket";

type Ticket = TicketResponse;
type TicketItem = TicketItemResponse;

type Props = {
  ticketId: string;
  ticket?: Ticket;
  selectedItem: TicketItem | null;
};

export function OperationsTab({ ticketId, ticket, selectedItem }: Props) {
  const publishTicket = usePublishTicket();
  const unpublishTicket = useUnpublishTicket();
  const prepareStock = usePrepareStock();
  const openSale = useOpenSale();
  const closeSale = useCloseSale();
  const removeTicket = useRemoveTicket();

  return (
    <Card variant="outlined" padding="md">
      <CardHeader>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Vận hành
          </p>
          <CardTitle>Điều phối trạng thái vé</CardTitle>
          <CardDescription>
            Thay đổi trạng thái công bố, chuẩn bị tồn và mở/đóng bán cho hành trình.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <Button
            type="button"
            variant="outline"
            disabled={!ticket}
            onClick={() => publishTicket.mutate({ ticketId })}
          >
            <Play className="size-3.5" aria-hidden />
            Công bố
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!ticket}
            onClick={() => unpublishTicket.mutate({ ticketId })}
          >
            <Pause className="size-3.5" aria-hidden />
            Hủy công bố
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!ticket || !selectedItem}
            onClick={() =>
              selectedItem
                ? prepareStock.mutate({
                    ticketId,
                    payload: { ticketItemId: selectedItem.id },
                  })
                : undefined
            }
          >
            Chuẩn bị chỗ
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!ticket || !selectedItem}
            onClick={() =>
              selectedItem
                ? openSale.mutate({
                    ticketId,
                    payload: { ticketItemId: selectedItem.id },
                  })
                : undefined
            }
          >
            Mở bán
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!ticket}
            onClick={() => closeSale.mutate({ ticketId })}
          >
            Đóng bán
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!ticket}
            onClick={() => removeTicket.mutate({ ticketId })}
          >
            <Trash2 className="size-3.5" aria-hidden />
            Xoá vé
          </Button>
        </div>
        {!selectedItem ? (
          <NoticeBox
            title="Chưa chọn hạng ghế"
            description="Một số thao tác (chuẩn bị chỗ, mở bán) yêu cầu chọn hạng ghế trước."
            tone="warning"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

type EditTabProps = {
  ticketId: string;
  ticket?: Ticket;
};

export function EditTab({ ticketId, ticket }: EditTabProps) {
  const updateTicket = useUpdateTicket(ticketId);
  const [title, setTitle] = useState(ticket?.title ?? "");
  const [trainNumber, setTrainNumber] = useState(ticket?.trainNumber ?? "");
  const [journeyNote, setJourneyNote] = useState(ticket?.journeyNote ?? "");

  return (
    <Card variant="outlined" padding="md">
      <CardHeader>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Chỉnh sửa
          </p>
          <CardTitle>Cập nhật thông tin vé</CardTitle>
          <CardDescription>
            Chỉnh sửa tiêu đề, số tàu và ghi chú hành trình.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Tiêu đề vé">
            <Input
              placeholder="Tiêu đề vé"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </FormField>
          <FormField label="Số tàu">
            <Input
              placeholder="SE1"
              value={trainNumber}
              onChange={(event) => setTrainNumber(event.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Ghi chú hành trình">
          <Input
            placeholder="Ghi chú cho hành trình"
            value={journeyNote}
            onChange={(event) => setJourneyNote(event.target.value)}
          />
        </FormField>
        <Button
          type="button"
          disabled={updateTicket.isPending}
          onClick={() =>
            updateTicket.mutate({
              title: title || undefined,
              trainNumber: trainNumber || undefined,
              journeyNote: journeyNote || undefined,
            })
          }
        >
          <Save className="size-3.5" aria-hidden />
          {updateTicket.isPending ? "Đang cập nhật..." : "Lưu thay đổi"}
        </Button>
        {updateTicket.isSuccess ? (
          <NoticeBox
            title="Cập nhật thành công"
            description="Thông tin vé đã được ghi nhận."
            tone="positive"
          />
        ) : null}
        {updateTicket.isError ? (
          <NoticeBox
            title="Cập nhật thất bại"
            description="Không thể cập nhật lúc này. Vui lòng thử lại."
            tone="danger"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

type AddItemTabProps = {
  ticketId: string;
};

export function AddItemTab({ ticketId }: AddItemTabProps) {
  const addTicketItem = useAddTicketItem();
  const [coachCode, setCoachCode] = useState("");
  const [seatClass, setSeatClass] = useState("");
  const [seats, setSeats] = useState("");
  const [price, setPrice] = useState("");

  function handleSubmit() {
    const parsedSeats = seats
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    addTicketItem.mutate({
      ticketId,
      payload: {
        coachCode: coachCode || undefined,
        seatClass: seatClass || undefined,
        seatLabels: parsedSeats,
        availableSeatLabels: parsedSeats,
        stockInitial: parsedSeats.length || undefined,
        stockAvailable: parsedSeats.length || undefined,
        priceOriginal: price || undefined,
      },
    });
  }

  return (
    <Card variant="outlined" padding="md">
      <CardHeader>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Hạng ghế
          </p>
          <CardTitle>Thêm hạng ghế mới</CardTitle>
          <CardDescription>
            Bổ sung toa hoặc hạng ghế cho hành trình hiện tại.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Mã toa">
            <Input
              placeholder="VD: T1"
              value={coachCode}
              onChange={(event) => setCoachCode(event.target.value)}
            />
          </FormField>
          <FormField label="Hạng ghế">
            <Input
              placeholder="VD: Ngồi mềm"
              value={seatClass}
              onChange={(event) => setSeatClass(event.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Danh sách mã ghế" hint="Nhập CSV, ví dụ A1,A2,B1,B2">
          <Input
            placeholder="A1, A2, A3"
            value={seats}
            onChange={(event) => setSeats(event.target.value)}
          />
        </FormField>
        <FormField label="Giá gốc (VND)">
          <Input
            type="number"
            placeholder="450000"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </FormField>
        <Button
          type="button"
          disabled={addTicketItem.isPending}
          onClick={handleSubmit}
        >
          <Plus className="size-3.5" aria-hidden />
          {addTicketItem.isPending ? "Đang thêm..." : "Thêm hạng ghế"}
        </Button>
      </CardContent>
    </Card>
  );
}
