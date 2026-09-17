import { z } from "zod";

const integerPattern = /^\d+$/;

function isValidDateTime(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function requiredText(label: string) {
  return z.string().trim().min(1, `${label} là bắt buộc`);
}

export function optionalText() {
  return z.string().trim();
}

export const emailField = z
  .string()
  .trim()
  .min(1, "Email là bắt buộc")
  .email("Email không hợp lệ");

export const phoneField = z
  .string()
  .trim()
  .min(1, "Số điện thoại là bắt buộc")
  .regex(/^[0-9+() -]{8,15}$/, "Số điện thoại không hợp lệ");

export const passwordField = z
  .string()
  .min(6, "Mật khẩu phải có ít nhất 6 ký tự");

export function integerText(label: string, minimum = 0) {
  return z
    .string()
    .trim()
    .min(1, `${label} là bắt buộc`)
    .regex(integerPattern, `${label} phải là số nguyên`)
    .refine(
      (value) => Number(value) >= minimum,
      `${label} phải lớn hơn hoặc bằng ${minimum}`,
    );
}

export function optionalIntegerText(label: string, minimum = 0) {
  return z
    .string()
    .trim()
    .refine(
      (value) =>
        value.length === 0 ||
        (integerPattern.test(value) && Number(value) >= minimum),
      `${label} phải là số nguyên hợp lệ`,
    );
}

export function requiredCsvText(label: string) {
  return requiredText(label).refine(
    (value) => splitCsv(value).length > 0,
    `${label} phải có ít nhất 1 giá trị`,
  );
}

export function requiredDateTimeText(label: string) {
  return requiredText(label).refine(
    isValidDateTime,
    `${label} không đúng định dạng thời gian`,
  );
}

export function optionalDateTimeText(label: string) {
  return z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || isValidDateTime(value),
      `${label} không đúng định dạng thời gian`,
    );
}

export function requiredStationCode(label = "Mã ga") {
  return z
    .string()
    .trim()
    .min(1, `${label} là bắt buộc`)
    .max(10, `${label} không được quá 10 ký tự`);
}

export function requiredStationName(label = "Tên ga") {
  return z.string().trim().min(1, `${label} là bắt buộc`);
}

export function dateRangeRefine<T extends { dateStart: string; dateEnd: string }>(
  schema: z.ZodType<T>,
) {
  return schema.refine(
    (data) => {
      if (!data.dateStart || !data.dateEnd) return true;
      return new Date(data.dateEnd) >= new Date(data.dateStart);
    },
    {
      message: "Thời gian đến phải sau thời gian khởi hành",
      path: ["dateEnd"],
    },
  );
}

export function stationPairRefine<
  T extends { departureStationCode: string; arrivalStationCode: string },
>(schema: z.ZodType<T>) {
  return schema.refine(
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
  );
}

export function toOptionalString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function toOptionalIsoDateTime(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? new Date(normalized).toISOString() : undefined;
}

export const applyVoucherSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập mã khuyến mãi")
    .min(3, "Mã khuyến mãi phải có ít nhất 3 ký tự")
    .max(30, "Mã khuyến mãi không được quá 30 ký tự")
    .regex(/^[A-Za-z0-9_-]+$/, "Mã khuyến mãi chỉ gồm chữ cái, số và dấu gạch"),
});

export const passengerItemSchema = z.object({
  seat: z.string().min(1, "Ghế không hợp lệ"),
  fullName: z
    .string()
    .trim()
    .min(1, "Họ và tên hành khách là bắt buộc")
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(100, "Họ và tên không được quá 100 ký tự"),
  passengerType: z.enum(["ADULT", "CHILD", "STUDENT", "SENIOR"]),
  identityNumber: z
    .string()
    .trim()
    .refine(
      (v) => v.length === 0 || /^[0-9A-Za-z]{8,15}$/.test(v),
      "Số CCCD / Hộ chiếu phải từ 8 đến 15 ký tự",
    )
    .optional(),
  phoneNumber: z
    .string()
    .trim()
    .refine(
      (v) => v.length === 0 || /^[0-9+() -]{8,15}$/.test(v),
      "Số điện thoại không hợp lệ",
    )
    .optional(),
});

export const checkoutFormSchema = z.object({
  contactEmail: emailField,
  contactPhone: phoneField,
  passengers: z
    .array(passengerItemSchema)
    .min(1, "Vui lòng chọn ít nhất một chỗ ngồi trên sơ đồ"),
});

export const createVoucherSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Mã voucher là bắt buộc")
      .min(3, "Mã voucher phải có ít nhất 3 ký tự")
      .max(30, "Mã voucher không quá 30 ký tự")
      .regex(/^[A-Za-z0-9_-]+$/, "Mã chỉ chứa chữ cái, số và dấu gạch"),
    title: z
      .string()
      .trim()
      .min(1, "Tiêu đề là bắt buộc")
      .min(3, "Tiêu đề phải từ 3 ký tự trở lên"),
    description: z.string().trim().optional(),
    discountType: z.enum(["PERCENT", "FIXED_AMOUNT"]),
    discountValue: z
      .string()
      .trim()
      .min(1, "Mức giảm giá là bắt buộc")
      .regex(/^\d+$/, "Mức giảm phải là số nguyên dương")
      .refine((v) => Number(v) > 0, "Mức giảm phải lớn hơn 0"),
    maxDiscount: optionalIntegerText("Mức giảm tối đa", 0),
    minOrderAmount: optionalIntegerText("Đơn tối thiểu", 0),
    usageLimit: optionalIntegerText("Số lượt dùng tối đa", 1),
    validFrom: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
    validTo: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
  })
  .refine(
    (data) => {
      if (data.discountType === "PERCENT") {
        return Number(data.discountValue) <= 100;
      }
      return true;
    },
    {
      message: "Chiết khấu theo phần trăm không được vượt quá 100%",
      path: ["discountValue"],
    },
  )
  .refine(
    (data) => {
      if (!data.validFrom || !data.validTo) return true;
      return new Date(data.validTo) >= new Date(data.validFrom);
    },
    {
      message: "Thời gian kết thúc phải sau thời gian bắt đầu",
      path: ["validTo"],
    },
  );

export const broadcastMarketingSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "Tiêu đề thông báo là bắt buộc")
    .min(3, "Tiêu đề phải có ít nhất 3 ký tự"),
  body: z
    .string()
    .trim()
    .min(1, "Nội dung thông báo là bắt buộc")
    .min(5, "Nội dung phải có ít nhất 5 ký tự"),
  voucherCode: z.string().trim().optional(),
});

