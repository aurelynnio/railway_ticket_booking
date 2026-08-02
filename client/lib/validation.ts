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

export function toOptionalString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function toOptionalIsoDateTime(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? new Date(normalized).toISOString() : undefined;
}
