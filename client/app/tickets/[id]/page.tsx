"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrainFront,
  CalendarDays,
  Clock,
  MapPin,
  Info,
  CheckCircle2,
  AlertCircle,
  User,
  ShieldCheck,
  CreditCard,
  Trash2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useTicket, useSeatMap } from "@/hooks/ticket.hook";
import { useAuthSession } from "@/hooks/auth.hook";
import { useMe } from "@/hooks/user.hook";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  applyVoucherSchema,
  checkoutFormSchema,
} from "@/lib/validation";
import { useCreateOrder } from "@/hooks/order.hook";
import { useCreateVnpayPayment } from "@/hooks/payment.hook";
import { useValidateVoucher } from "@/hooks/voucher.hook";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

type PassengerType = "ADULT" | "CHILD" | "STUDENT" | "SENIOR";

interface PassengerInput {
  fullName: string;
  passengerType: PassengerType;
  identityNumber: string;
  phoneNumber: string;
}

const PASSENGER_RATES: Record<PassengerType, { label: string; rate: number; desc: string }> = {
  ADULT: { label: "Người lớn", rate: 1.0, desc: "Vé tiêu chuẩn (100%)" },
  CHILD: { label: "Trẻ em", rate: 0.75, desc: "Dưới 10 tuổi (Giảm 25%)" },
  STUDENT: { label: "Sinh viên", rate: 0.9, desc: "Thẻ SV còn hạn (Giảm 10%)" },
  SENIOR: { label: "Người cao tuổi", rate: 0.85, desc: "Từ 60 tuổi trở lên (Giảm 15%)" },
};

function calculateDiscountedPrice(basePrice: number, type: PassengerType): number {
  const rate = PASSENGER_RATES[type]?.rate ?? 1.0;
  return Math.round((basePrice * rate) / 1000) * 1000;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const ticketQuery = useTicket(ticketId);
  const seatMapQuery = useSeatMap(ticketId);
  const session = useAuthSession();
  const me = useMe(Boolean(session.data));

  const ticket = ticketQuery.data;
  const seatMap = seatMapQuery.data;

  const createOrder = useCreateOrder();
  const createVnpayPayment = useCreateVnpayPayment();

  // Active coach / ticket item
  const [activeItemId, setActiveItemId] = useState<string>("");
  // Selected seats in the active coach: array of seat labels (e.g. ["A1", "A2"])
  const [selectedSeatLabels, setSelectedSeatLabels] = useState<string[]>([]);
  // Passengers details mapped by seat label
  const [passengersBySeat, setPassengersBySeat] = useState<Record<string, PassengerInput>>({});
  // Contact info
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Voucher promotion state
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmount: number;
    message: string;
  } | null>(null);
  const validateVoucher = useValidateVoucher();

  // Default to first available coach once data arrives
  useEffect(() => {
    if (seatMap?.items?.length && !activeItemId) {
      setActiveItemId(seatMap.items[0].ticketItemId);
    }
  }, [seatMap, activeItemId]);

  // Pre-fill contact info from current session
  useEffect(() => {
    if (me.data?.email && !contactEmail) {
      setContactEmail(me.data.email);
    }
  }, [me.data, contactEmail]);

  // Current active ticket item
  const activeItem = useMemo(() => {
    return ticket?.ticketItems?.find((item) => item.id === activeItemId);
  }, [ticket, activeItemId]);

  const activeSeatMapItem = useMemo(() => {
    return seatMap?.items?.find((item) => item.ticketItemId === activeItemId);
  }, [seatMap, activeItemId]);

  const basePrice = useMemo(() => {
    if (!activeItem) return 0;
    const price = activeItem.priceFlash ?? activeItem.priceOriginal ?? "0";
    return Number(price);
  }, [activeItem]);

  // Handle switching coach: clear selection or warn
  const handleSelectCoach = (itemId: string) => {
    if (itemId === activeItemId) return;
    if (selectedSeatLabels.length > 0) {
      const confirmSwitch = window.confirm(
        "Đổi sang toa khác sẽ bỏ chọn các ghế ở toa hiện tại. Bạn có muốn tiếp tục?"
      );
      if (!confirmSwitch) return;
    }
    setActiveItemId(itemId);
    setSelectedSeatLabels([]);
    setPassengersBySeat({});
  };

  // Toggle seat selection
  const handleToggleSeat = (seat: string, isAvailable: boolean) => {
    if (!isAvailable) return;

    if (selectedSeatLabels.includes(seat)) {
      setSelectedSeatLabels((prev) => prev.filter((s) => s !== seat));
      setPassengersBySeat((prev) => {
        const next = { ...prev };
        delete next[seat];
        return next;
      });
    } else {
      if (selectedSeatLabels.length >= 6) {
        toast.warning("Mỗi đơn hàng được chọn tối đa 6 chỗ ngồi.");
        return;
      }
      setSelectedSeatLabels((prev) => [...prev, seat]);
      setPassengersBySeat((prev) => ({
        ...prev,
        [seat]: {
          fullName: "",
          passengerType: "ADULT",
          identityNumber: "",
          phoneNumber: "",
        },
      }));
    }
  };

  // Update passenger detail
  const handleUpdatePassenger = (
    seat: string,
    field: keyof PassengerInput,
    value: string
  ) => {
    setPassengersBySeat((prev) => ({
      ...prev,
      [seat]: {
        ...prev[seat],
        [field]: value,
      },
    }));

    const current = checkoutForm.getValues("passengers") || [];
    const updated = current.map((p) =>
      p.seat === seat ? { ...p, [field]: value } : p
    );
    checkoutForm.setValue("passengers", updated, { shouldValidate: true });
  };

  // Calculate pricing breakdown
  const pricingSummary = useMemo(() => {
    const qty = selectedSeatLabels.length;
    const rawTotal = basePrice * qty;

    let total = 0;
    for (const seat of selectedSeatLabels) {
      const p = passengersBySeat[seat];
      const type = p?.passengerType ?? "ADULT";
      total += calculateDiscountedPrice(basePrice, type);
    }

    const discount = Math.max(0, rawTotal - total);

    return {
      quantity: qty,
      basePrice,
      rawTotal,
      discount,
      total,
    };
  }, [selectedSeatLabels, passengersBySeat, basePrice]);

  const finalPayableTotal = useMemo(() => {
    return Math.max(
      0,
      pricingSummary.total - (appliedVoucher?.discountAmount ?? 0),
    );
  }, [pricingSummary.total, appliedVoucher]);

  // Form for voucher application
  const voucherForm = useForm<z.infer<typeof applyVoucherSchema>>({
    resolver: zodResolver(applyVoucherSchema),
    defaultValues: { code: "" },
  });

  const onApplyVoucher = async (data: z.infer<typeof applyVoucherSchema>) => {
    if (selectedSeatLabels.length === 0) {
      toast.error("Vui lòng chọn ít nhất một chỗ ngồi trước khi áp dụng mã.");
      return;
    }
    try {
      const res = await validateVoucher.mutateAsync({
        code: data.code.trim().toUpperCase(),
        orderAmount: pricingSummary.total,
        userId: session.data?.userId,
      });
      if (res.isValid) {
        setAppliedVoucher({
          code: res.code,
          discountAmount: res.discountAmount,
          message:
            res.message ||
            `Giảm ${formatCurrency(res.discountAmount)}`,
        });
        toast.success(res.message || "Áp dụng mã giảm giá thành công!");
        voucherForm.reset({ code: "" });
      } else {
        toast.error(res.message || "Mã khuyến mãi không hợp lệ.");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Không thể kiểm tra mã khuyến mãi.",
      );
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    voucherForm.reset({ code: "" });
    toast.info("Đã hủy áp dụng mã giảm giá.");
  };

  // Form for checkout & passengers validation
  const checkoutForm = useForm<z.infer<typeof checkoutFormSchema>>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      contactEmail: "",
      contactPhone: "",
      passengers: [],
    },
    mode: "onTouched",
  });

  // Sync profile contacts into checkoutForm
  useEffect(() => {
    const email = me.data?.email;
    const phone = (me.data as any)?.phone;
    if (typeof email === "string" && email && !checkoutForm.getValues("contactEmail")) {
      checkoutForm.setValue("contactEmail", email, { shouldValidate: true });
    }
    if (typeof phone === "string" && phone && !checkoutForm.getValues("contactPhone")) {
      checkoutForm.setValue("contactPhone", phone, { shouldValidate: true });
    }
  }, [me.data, checkoutForm]);

  // Sync selected seats into checkoutForm passengers array
  useEffect(() => {
    const currentPassengers = checkoutForm.getValues("passengers") || [];
    const currentMap = new Map(currentPassengers.map((p) => [p.seat, p]));
    const nextPassengers = selectedSeatLabels.map((seat) => {
      const existing = currentMap.get(seat);
      const stateItem = passengersBySeat[seat];
      return {
        seat,
        fullName: existing?.fullName || stateItem?.fullName || "",
        passengerType: (existing?.passengerType || stateItem?.passengerType || "ADULT") as PassengerType,
        identityNumber: existing?.identityNumber || stateItem?.identityNumber || "",
        phoneNumber: existing?.phoneNumber || stateItem?.phoneNumber || "",
      };
    });
    checkoutForm.setValue("passengers", nextPassengers, { shouldValidate: false });
  }, [selectedSeatLabels]);

  // Handle Checkout Submit
  const onCheckoutSubmit = async (formData: z.infer<typeof checkoutFormSchema>) => {
    if (!session.data) {
      toast.info("Vui lòng đăng nhập để tiến hành đặt vé.");
      router.push(`/login?next=/tickets/${ticketId}`);
      return;
    }

    if (!activeItem || selectedSeatLabels.length === 0) {
      toast.error("Vui lòng chọn ít nhất một chỗ ngồi trên sơ đồ.");
      return;
    }

    const passengersPayload = formData.passengers.map((p) => ({
      fullName: p.fullName.trim(),
      passengerType: p.passengerType,
      identityNumber: p.identityNumber?.trim() || null,
      phoneNumber: p.phoneNumber?.trim() || formData.contactPhone.trim(),
    }));

    const idempotencyKey = crypto.randomUUID();

    try {
      const result = await createOrder.mutateAsync({
        userId: session.data.userId,
        ticketId: ticket!.id,
        ticketItemId: activeItem.id,
        ticketTitle: ticket!.title ?? `Tàu ${ticket!.trainNumber}`,
        trainNumber: ticket!.trainNumber,
        departureStationCode: ticket!.departureStationCode,
        departureStationName: ticket!.departureStationName,
        arrivalStationCode: ticket!.arrivalStationCode,
        arrivalStationName: ticket!.arrivalStationName,
        departureTime: ticket!.dateStart,
        arrivalTime: ticket!.dateEnd,
        coachCode: activeItem.coachCode,
        seatClass: activeItem.seatClass,
        seatType: activeItem.seatType,
        quantity: selectedSeatLabels.length,
        unitPrice: basePrice,
        seatLabels: selectedSeatLabels,
        passengers: passengersPayload,
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim(),
        idempotencyKey,
        voucherCode: appliedVoucher?.code || undefined,
      });

      toast.success("Giữ chỗ thành công! Đang chuyển đến cổng thanh toán...");

      // Attempt to initiate VNPay payment immediately
      try {
        const vnpayRes = await createVnpayPayment.mutateAsync({
          orderId: result.order.id,
        });
        if (vnpayRes.paymentUrl) {
          window.location.href = vnpayRes.paymentUrl;
          return;
        }
      } catch {
        // Fallback to order details if VNPay gateway creation encounters issue
      }

      router.push(`/orders/${result.order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đặt vé không thành công. Vui lòng thử lại.";
      toast.error(msg);
    }
  };

  if (ticketQuery.isLoading) {
    return (
      <AppLayout>
        <div className="p-10">
          <Skeleton className="h-60 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!ticket) {
    return (
      <AppLayout>
        <div className="p-20 text-center">
          <p className="font-display text-2xl font-semibold text-ink">
            Không tìm thấy chuyến tàu
          </p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Button>
        </div>
      </AppLayout>
    );
  }

  const totalAvailable = seatMap?.items?.reduce(
    (sum, item) => sum + (item.availableSeatLabels?.length ?? 0),
    0
  ) ?? 0;

  return (
    <AppLayout>
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 text-primary-foreground/80 hover:text-primary-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Quay lại tìm kiếm
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="accent" className="font-mono text-xs px-3 py-1">
              <TrainFront className="size-3.5 mr-1" />
              Tàu {ticket.trainNumber ?? "—"}
            </Badge>
            <Badge variant={totalAvailable > 0 ? "success" : "destructive"}>
              {totalAvailable} chỗ còn trống
            </Badge>
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold text-primary-foreground sm:text-4xl">
            {ticket.departureStationName ?? ticket.departureStationCode} →{" "}
            {ticket.arrivalStationName ?? ticket.arrivalStationCode}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-primary-foreground/90 text-sm">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-accent" />
              <span className="font-mono tabular-nums">
                Khởi hành: {formatDateTime(ticket.dateStart)}
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="size-4 text-accent" />
              <span className="font-mono tabular-nums">
                Dự kiến đến: {formatDateTime(ticket.dateEnd)}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <Tabs defaultValue="seats">
            <TabsList className="bg-muted/60 p-1">
              <TabsTrigger value="seats" className="gap-2">
                <MapPin className="size-3.5" />
                Chọn ghế & Đặt chỗ
              </TabsTrigger>
              <TabsTrigger value="info" className="gap-2">
                <Info className="size-3.5" />
                Thông tin hành trình
              </TabsTrigger>
            </TabsList>

            {/* TAB: SEAT SELECTION & BOOKING */}
            <TabsContent value="seats" className="mt-6 space-y-8">
              {/* Coach Selection */}
              <Card variant="outlined" padding="lg">
                <h3 className="font-display text-lg font-semibold text-ink">
                  1. Chọn toa tàu & hạng vé
                </h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Vui lòng chọn toa tàu phù hợp với nhu cầu của bạn.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {ticket.ticketItems?.map((item) => {
                    const isSelected = item.id === activeItemId;
                    const available = item.stockAvailable ?? item.availableSeatLabels?.length ?? 0;
                    const price = item.priceFlash ?? item.priceOriginal ?? "0";

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectCoach(item.id)}
                        className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="font-mono text-xs font-semibold uppercase text-accent">
                            Toa {item.coachCode ?? "—"}
                          </span>
                          <Badge variant={available > 0 ? "outline" : "destructive"}>
                            {available > 0 ? `${available} chỗ` : "Hết chỗ"}
                          </Badge>
                        </div>
                        <p className="mt-2 font-display text-base font-semibold text-ink">
                          {item.seatClass ?? "Ghế tiêu chuẩn"}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {item.seatType ?? "Ghế ngồi"}
                        </p>
                        <p className="mt-3 font-mono text-sm font-bold text-primary">
                          {formatCurrency(price)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Seat Map */}
              {activeItem && activeSeatMapItem && (
                <Card variant="outlined" padding="lg">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-ink">
                        2. Sơ đồ chỗ ngồi · Toa {activeItem.coachCode} ({activeItem.seatClass})
                      </h3>
                      <p className="text-xs text-ink-muted">
                        Bấm vào ghế để chọn hoặc bỏ chọn (tối đa 6 ghế).
                      </p>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <span className="size-4 rounded border border-border bg-primary-soft" />
                        Còn trống
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-4 rounded bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                        Đang chọn
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-4 rounded bg-muted text-ink-subtle" />
                        Đã bán
                      </span>
                    </div>
                  </div>

                  {/* Seat Grid */}
                  <div className="mt-6 rounded-2xl bg-muted/20 p-6 border border-border/70">
                    <div className="mb-4 flex items-center justify-center text-xs font-semibold text-ink-muted uppercase tracking-widest">
                      ─── Đầu tàu ───
                    </div>

                    <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
                      {activeSeatMapItem.seatLabels?.map((seat) => {
                        const isAvailable = activeSeatMapItem.availableSeatLabels?.includes(seat);
                        const isSelected = selectedSeatLabels.includes(seat);

                        return (
                          <button
                            key={seat}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => handleToggleSeat(seat, isAvailable)}
                            className={`flex size-11 items-center justify-center rounded-xl text-xs font-mono font-semibold transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-md scale-105 ring-2 ring-primary ring-offset-2"
                                : isAvailable
                                  ? "bg-primary-soft text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20"
                                  : "bg-muted text-ink-subtle border border-border/40 cursor-not-allowed opacity-60"
                            }`}
                            title={
                              isSelected
                                ? `Ghế ${seat} (Đang chọn)`
                                : isAvailable
                                  ? `Ghế ${seat} (Còn trống - ${formatCurrency(basePrice)})`
                                  : `Ghế ${seat} (Đã có người đặt)`
                            }
                          >
                            {isSelected ? "✓" : seat}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              )}

              {/* PASSENGERS & CONTACT FORM (Visible when seats are selected) */}
              {selectedSeatLabels.length > 0 && (
                <form
                  id="checkout-form"
                  onSubmit={checkoutForm.handleSubmit(onCheckoutSubmit)}
                  className="space-y-6"
                >
                  <Card variant="outlined" padding="lg" className="space-y-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-ink">
                        3. Thông tin hành khách ({selectedSeatLabels.length} vé)
                      </h3>
                      <p className="mt-1 text-xs text-ink-muted">
                        Vui lòng nhập thông tin chính xác theo CCCD/Hộ chiếu để kiểm soát vé tại ga.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {selectedSeatLabels.map((seat, index) => {
                        const passenger = passengersBySeat[seat] || {
                          fullName: "",
                          passengerType: "ADULT",
                          identityNumber: "",
                          phoneNumber: "",
                        };
                        const seatPrice = calculateDiscountedPrice(
                          basePrice,
                          passenger.passengerType
                        );
                        const seatErrors = checkoutForm.formState.errors.passengers?.[index];

                        return (
                          <div
                            key={seat}
                            className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4"
                          >
                            <div className="flex items-center justify-between border-b border-border pb-3">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="font-mono">
                                  Ghế {seat}
                                </Badge>
                                <span className="text-xs font-medium text-ink-muted">
                                  Hành khách {index + 1}
                                </span>
                              </div>
                              <span className="font-mono text-sm font-bold text-primary">
                                {formatCurrency(seatPrice)}
                              </span>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <div className="space-y-1.5">
                                <Label className="text-xs">
                                  Họ và tên <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  placeholder="NGUYEN VAN A"
                                  value={passenger.fullName}
                                  onChange={(e) =>
                                    handleUpdatePassenger(seat, "fullName", e.target.value.toUpperCase())
                                  }
                                  aria-invalid={Boolean(seatErrors?.fullName)}
                                />
                                {seatErrors?.fullName?.message && (
                                  <p className="text-[11px] font-medium text-destructive">
                                    {seatErrors.fullName.message}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-xs">Đối tượng / Hạng vé</Label>
                                <Select
                                  value={passenger.passengerType}
                                  onChange={(e) =>
                                    handleUpdatePassenger(
                                      seat,
                                      "passengerType",
                                      e.target.value as PassengerType
                                    )
                                  }
                                >
                                  <option value="ADULT">Người lớn (100%)</option>
                                  <option value="CHILD">Trẻ em &lt;10T (Giảm 25%)</option>
                                  <option value="STUDENT">Sinh viên (Giảm 10%)</option>
                                  <option value="SENIOR">Người cao tuổi &gt;=60T (Giảm 15%)</option>
                                </Select>
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-xs">Số CCCD / Hộ chiếu</Label>
                                <Input
                                  placeholder="001200000000"
                                  value={passenger.identityNumber}
                                  onChange={(e) =>
                                    handleUpdatePassenger(seat, "identityNumber", e.target.value)
                                  }
                                  aria-invalid={Boolean(seatErrors?.identityNumber)}
                                />
                                {seatErrors?.identityNumber?.message && (
                                  <p className="text-[11px] font-medium text-destructive">
                                    {seatErrors.identityNumber.message}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <Label className="text-xs">Số điện thoại</Label>
                                <Input
                                  placeholder="0901234567"
                                  value={passenger.phoneNumber}
                                  onChange={(e) =>
                                    handleUpdatePassenger(seat, "phoneNumber", e.target.value)
                                  }
                                  aria-invalid={Boolean(seatErrors?.phoneNumber)}
                                />
                                {seatErrors?.phoneNumber?.message && (
                                  <p className="text-[11px] font-medium text-destructive">
                                    {seatErrors.phoneNumber.message}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Contact Information Form (Visible when seats are selected) */}
                  <Card variant="outlined" padding="lg" className="space-y-4">
                    <h3 className="font-display text-lg font-semibold text-ink">
                      4. Thông tin người nhận vé điện tử
                    </h3>
                    <p className="text-xs text-ink-muted">
                      Mã vé và thông tin hành trình sẽ được gửi tự động qua email này sau khi thanh toán.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="contactEmail">
                          Email nhận vé <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="contactEmail"
                          type="email"
                          placeholder="you@example.com"
                          {...checkoutForm.register("contactEmail")}
                          aria-invalid={Boolean(checkoutForm.formState.errors.contactEmail)}
                        />
                        {checkoutForm.formState.errors.contactEmail?.message && (
                          <p className="text-[11px] font-medium text-destructive">
                            {checkoutForm.formState.errors.contactEmail.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="contactPhone">
                          Số điện thoại liên hệ <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="contactPhone"
                          placeholder="0912345678"
                          {...checkoutForm.register("contactPhone")}
                          aria-invalid={Boolean(checkoutForm.formState.errors.contactPhone)}
                        />
                        {checkoutForm.formState.errors.contactPhone?.message && (
                          <p className="text-[11px] font-medium text-destructive">
                            {checkoutForm.formState.errors.contactPhone.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </form>
              )}
            </TabsContent>

            {/* TAB: TRIP INFO */}
            <TabsContent value="info" className="mt-6">
              <Card variant="outlined" padding="lg">
                <h3 className="font-display text-lg font-semibold text-ink">
                  Thông tin hành trình chi tiết
                </h3>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <InfoRow
                    label="Ga xuất phát"
                    value={`${ticket.departureStationName} (Mã: ${ticket.departureStationCode})`}
                  />
                  <InfoRow
                    label="Ga đến"
                    value={`${ticket.arrivalStationName} (Mã: ${ticket.arrivalStationCode})`}
                  />
                  <InfoRow label="Thời gian khởi hành" value={formatDateTime(ticket.dateStart)} />
                  <InfoRow label="Thời gian đến dự kiến" value={formatDateTime(ticket.dateEnd)} />
                  <InfoRow label="Số hiệu tàu" value={`Đoàn tàu ${ticket.trainNumber ?? "—"}`} />
                  <InfoRow
                    label="Trạng thái"
                    value={ticket.status === 1 ? "Đang mở bán công khai" : "Tạm dừng"}
                  />
                </div>
                {ticket.journeyNote && (
                  <div className="mt-6 border-t border-border pt-5">
                    <p className="text-sm font-semibold text-ink">Lưu ý khi đi tàu</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      {ticket.journeyNote}
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          {/* Sidebar Booking Summary */}
          <div className="space-y-4">
            <Card variant="elevated" padding="lg" className="sticky top-6 space-y-5">
              <h3 className="font-display text-lg font-semibold text-ink">
                Tóm tắt vé đặt
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-ink-muted">Tàu</span>
                  <span className="font-mono font-bold text-ink">
                    {ticket.trainNumber ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-ink-muted">Hành trình</span>
                  <span className="font-medium text-ink text-right">
                    {ticket.departureStationName} → {ticket.arrivalStationName}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-ink-muted">Ngày đi</span>
                  <span className="font-mono text-ink">
                    {formatDateTime(ticket.dateStart)}
                  </span>
                </div>
                {activeItem && (
                  <div className="flex justify-between border-b border-border/60 pb-2">
                    <span className="text-ink-muted">Toa / Hạng</span>
                    <span className="font-medium text-ink">
                      Toa {activeItem.coachCode} · {activeItem.seatClass}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-ink-muted">Chỗ ngồi đã chọn</span>
                  <span className="font-mono font-semibold text-primary">
                    {selectedSeatLabels.length > 0
                      ? selectedSeatLabels.join(", ")
                      : "Chưa chọn ghế"}
                  </span>
                </div>
              </div>

              {/* Voucher Promotion Form */}
              <div className="rounded-xl border border-dashed border-primary/40 bg-primary-soft/10 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Tag className="size-3.5" />
                  <span>Mã khuyến mãi / Voucher</span>
                </div>

                {appliedVoucher ? (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800 uppercase">
                        {appliedVoucher.code}
                      </span>
                      <span className="text-emerald-700">
                        (-{formatCurrency(appliedVoucher.discountAmount)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={handleRemoveVoucher}
                    >
                      Bỏ chọn
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={voucherForm.handleSubmit(onApplyVoucher)}
                    className="space-y-1.5"
                  >
                    <div className="flex gap-2">
                      <Input
                        placeholder="VD: VIETRAIL50..."
                        {...voucherForm.register("code")}
                        className="h-8 text-xs font-mono uppercase bg-card"
                        aria-invalid={Boolean(voucherForm.formState.errors.code)}
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 text-xs px-3"
                        disabled={validateVoucher.isPending || selectedSeatLabels.length === 0}
                      >
                        {validateVoucher.isPending ? "Kiểm tra..." : "Áp dụng"}
                      </Button>
                    </div>
                    {voucherForm.formState.errors.code?.message && (
                      <p className="text-[11px] font-medium text-destructive">
                        {voucherForm.formState.errors.code.message}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="rounded-xl bg-muted/40 p-4 space-y-2 border border-border">
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Giá vé gốc ({pricingSummary.quantity} vé)</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(pricingSummary.rawTotal)}
                  </span>
                </div>
                {pricingSummary.discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Ưu đãi đối tượng</span>
                    <span className="font-mono tabular-nums">
                      -{formatCurrency(pricingSummary.discount)}
                    </span>
                  </div>
                )}
                {appliedVoucher && appliedVoucher.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Khuyến mãi Voucher ({appliedVoucher.code})</span>
                    <span className="font-mono tabular-nums">
                      -{formatCurrency(appliedVoucher.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-ink">Tổng thanh toán</span>
                  <span className="font-display text-2xl font-bold tabular-nums text-primary">
                    {formatCurrency(finalPayableTotal)}
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">Đã bao gồm thuế GTGT và bảo hiểm hành khách.</p>
              </div>

              {/* CTA */}
              <Button
                type="submit"
                form="checkout-form"
                variant="accent"
                size="lg"
                className="w-full text-base font-semibold"
                disabled={selectedSeatLabels.length === 0 || createOrder.isPending}
              >
                <CreditCard className="size-4 mr-2" />
                {createOrder.isPending
                  ? "Đang xử lý đơn hàng..."
                  : selectedSeatLabels.length === 0
                    ? "Vui lòng chọn ghế ngồi"
                    : `Thanh toán ngay · ${formatCurrency(finalPayableTotal)}`}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-ink-muted">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Thanh toán an toàn qua VNPay</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
