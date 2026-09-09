export function formatCurrency(value: number | string | null | undefined) {
  // Backend serializes decimal amounts as strings (Prisma Decimal), so accept
  // both and coerce centrally. Invalid values render as "N/A", never "NaN ₫".
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(parsed)) {
    return "N/A";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(parsed);
}
