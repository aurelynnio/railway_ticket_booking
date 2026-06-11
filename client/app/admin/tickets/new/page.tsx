"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell, Panel } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTicket } from "@/hooks/ticket.hook";

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminTicketNewPage() {
  const router = useRouter();
  const createTicket = useCreateTicket();

  const [title, setTitle] = useState("");
  const [trainNumber, setTrainNumber] = useState("");
  const [departureCode, setDepartureCode] = useState("");
  const [departureName, setDepartureName] = useState("");
  const [arrivalCode, setArrivalCode] = useState("");
  const [arrivalName, setArrivalName] = useState("");
  const [journeyNote, setJourneyNote] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [coachCode, setCoachCode] = useState("");
  const [seatClass, setSeatClass] = useState("");
  const [seatType, setSeatType] = useState("");
  const [seatLabels, setSeatLabels] = useState("");
  const [priceOriginal, setPriceOriginal] = useState("");
  const [priceFlash, setPriceFlash] = useState("");

  return (
    <AppShell
      title="Create ticket"
      description="Form intake toi gian de bo phan ops tao hanh trinh moi cung mot ticket item mac dinh, sat voi DTO thuc te cua gateway."
    >
      <Panel
        title="Ticket intake"
        description="Payload map truc tiep vao `POST /tickets`. Chuoi seat labels dung format CSV de tranh overbuild form."
      >
        <div className="grid gap-3 xl:grid-cols-2">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            placeholder="Train number"
            value={trainNumber}
            onChange={(e) => setTrainNumber(e.target.value)}
          />
          <Input
            placeholder="Departure code"
            value={departureCode}
            onChange={(e) => setDepartureCode(e.target.value)}
          />
          <Input
            placeholder="Departure name"
            value={departureName}
            onChange={(e) => setDepartureName(e.target.value)}
          />
          <Input
            placeholder="Arrival code"
            value={arrivalCode}
            onChange={(e) => setArrivalCode(e.target.value)}
          />
          <Input
            placeholder="Arrival name"
            value={arrivalName}
            onChange={(e) => setArrivalName(e.target.value)}
          />
          <Input
            type="datetime-local"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
          />
          <Input type="datetime-local" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
          <Input placeholder="Coach code" value={coachCode} onChange={(e) => setCoachCode(e.target.value)} />
          <Input placeholder="Seat class" value={seatClass} onChange={(e) => setSeatClass(e.target.value)} />
          <Input placeholder="Seat type" value={seatType} onChange={(e) => setSeatType(e.target.value)} />
          <Input
            placeholder="Original price"
            value={priceOriginal}
            onChange={(e) => setPriceOriginal(e.target.value)}
          />
          <Input
            placeholder="Flash price"
            value={priceFlash}
            onChange={(e) => setPriceFlash(e.target.value)}
          />
          <Textarea
            className="xl:col-span-2"
            placeholder="Journey note"
            value={journeyNote}
            onChange={(e) => setJourneyNote(e.target.value)}
          />
          <Textarea
            className="xl:col-span-2"
            placeholder="Seat labels CSV, vd A1,A2,A3"
            value={seatLabels}
            onChange={(e) => setSeatLabels(e.target.value)}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={createTicket.isPending}
            onClick={async () => {
              const parsedSeatLabels = splitCsv(seatLabels);
              const result = await createTicket.mutateAsync({
                title: title || undefined,
                trainNumber: trainNumber || undefined,
                departureStationCode: departureCode || undefined,
                departureStationName: departureName || undefined,
                arrivalStationCode: arrivalCode || undefined,
                arrivalStationName: arrivalName || undefined,
                journeyNote: journeyNote || undefined,
                dateStart: dateStart ? new Date(dateStart).toISOString() : undefined,
                dateEnd: dateEnd ? new Date(dateEnd).toISOString() : undefined,
                ticketItems: [
                  {
                    coachCode: coachCode || undefined,
                    seatClass: seatClass || undefined,
                    seatType: seatType || undefined,
                    seatLabels: parsedSeatLabels,
                    availableSeatLabels: parsedSeatLabels,
                    stockInitial: parsedSeatLabels.length || undefined,
                    stockAvailable: parsedSeatLabels.length || undefined,
                    priceOriginal: priceOriginal || undefined,
                    priceFlash: priceFlash || undefined,
                  },
                ],
              });
              router.push(`/admin/tickets/${result.id}`);
            }}
          >
            {createTicket.isPending ? "Dang tao..." : "Tao ticket"}
          </Button>
        </div>
      </Panel>
    </AppShell>
  );
}
