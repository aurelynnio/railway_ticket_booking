import { cn } from "@/lib/utils";

import { ErrorStateIllustration } from "./error-state";
import { OrderEmptyIllustration } from "./order-empty";
import { PaymentEmptyIllustration } from "./payment-empty";
import { SearchEmptyIllustration } from "./search-empty";
import { SuccessStateIllustration } from "./success-state";
import { TrainEmptyIllustration } from "./train-empty";

/**
 * Illustration — render 1 trong 6 illustration preset của design system.
 * Style: line-art với currentColor + 1 accent brand (#06A1A0) tích hợp sẵn.
 *
 * Tone mặc định dùng `text-ink-muted` để giữ phong cách tối giản. Có thể
 * override tone bằng prop `tone` (brand / muted / positive / warning / danger).
 */
export type IllustrationName =
  | "train-empty"
  | "search-empty"
  | "order-empty"
  | "payment-empty"
  | "error-state"
  | "success-state";

export type IllustrationTone = "brand" | "muted" | "positive" | "warning" | "danger";

const TONE_CLASS: Record<IllustrationTone, string> = {
  brand: "text-primary",
  muted: "text-muted-foreground",
  positive: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
};

const SIZE_MAP = {
  sm: { box: 64, inner: 64 },
  md: { box: 96, inner: 96 },
  lg: { box: 128, inner: 128 },
  xl: { box: 160, inner: 160 },
} as const;

type IllustrationProps = {
  name: IllustrationName;
  size?: keyof typeof SIZE_MAP;
  tone?: IllustrationTone;
  className?: string;
  /** Label cho screen reader, mặc định: tên illustration. */
  label?: string;
};

export function Illustration({
  name,
  size = "md",
  tone = "muted",
  className,
  label,
}: IllustrationProps) {
  const dims = SIZE_MAP[size];
  const accessibleLabel = label ?? defaultLabel(name);

  return (
    <div
      role="img"
      aria-label={accessibleLabel}
      className={cn("inline-flex shrink-0", TONE_CLASS[tone], className)}
      style={{ width: dims.box, height: dims.box }}
    >
      <span className="sr-only">{accessibleLabel}</span>
      {renderByName(name, dims.inner)}
    </div>
  );
}

function renderByName(name: IllustrationName, size: number) {
  switch (name) {
    case "train-empty":
      return <TrainEmptyIllustration size={size} />;
    case "search-empty":
      return <SearchEmptyIllustration size={size} />;
    case "order-empty":
      return <OrderEmptyIllustration size={size} />;
    case "payment-empty":
      return <PaymentEmptyIllustration size={size} />;
    case "error-state":
      return <ErrorStateIllustration size={size} />;
    case "success-state":
      return <SuccessStateIllustration size={size} />;
  }
}

function defaultLabel(name: IllustrationName) {
  switch (name) {
    case "train-empty":
      return "Toa tàu minh hoạ cho trạng thái trống";
    case "search-empty":
      return "Kính lúp minh hoạ cho trạng thái không tìm thấy";
    case "order-empty":
      return "Vé tàu minh hoạ cho trạng thái chưa có đơn";
    case "payment-empty":
      return "Thẻ thanh toán minh hoạ cho trạng thái chưa có giao dịch";
    case "error-state":
      return "Cờ cảnh báo minh hoạ cho trạng thái lỗi";
    case "success-state":
      return "Dấu check minh hoạ cho trạng thái thành công";
  }
}
