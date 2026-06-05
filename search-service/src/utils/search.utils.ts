import { TicketItem } from '@prisma/client';

export function matchesStationQuery(
  query: string | undefined,
  code: string | null,
  name: string | null,
) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return true;
  }

  const candidates = [code, name]
    .map((value) => normalizeText(value))
    .filter((value): value is string => Boolean(value));

  return candidates.some((value) => value.includes(normalizedQuery));
}

export function getMinPrice(items: TicketItem[]) {
  const prices = items
    .map((item) => getDisplayPrice(item))
    .filter((value): value is number => value !== null);

  return prices.length > 0 ? Math.min(...prices) : null;
}

export function getDisplayPrice(item: TicketItem) {
  const flashPrice = bigintToNumber(item.priceFlash);
  const originalPrice = bigintToNumber(item.priceOriginal);

  if (flashPrice !== null && isSaleOpen(item)) {
    return flashPrice;
  }

  return originalPrice;
}

export function getAvailableSeats(item: TicketItem) {
  if (item.stockAvailable !== null && item.stockAvailable !== undefined) {
    return item.stockAvailable;
  }

  return item.availableSeatLabels.length;
}

export function isSaleOpen(item: TicketItem) {
  const now = new Date();

  if (item.saleStartTime && now < item.saleStartTime) {
    return false;
  }
  if (item.saleEndTime && now > item.saleEndTime) {
    return false;
  }

  return true;
}

export function startOfUtcDay(value: string) {
  const date = new Date(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function uniqueValues(values: Array<string | null>) {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}

export function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

export function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export function bigintToNumber(value: bigint | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}
