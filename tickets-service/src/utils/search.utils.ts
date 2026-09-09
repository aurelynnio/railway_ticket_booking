import { TicketItem } from '@prisma/client';
import { isSaleOpen, toIsoString, toPriceString } from './ticket.utils';

export function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

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

export function uniqueValues(values: Array<string | null>) {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}

export function getDisplayPrice(item: TicketItem) {
  const flashPrice = toPriceString(item.priceFlash);
  const originalPrice = toPriceString(item.priceOriginal);

  if (flashPrice !== null && isSaleOpen(item)) {
    return flashPrice;
  }

  return originalPrice;
}

export function getMinPrice(items: TicketItem[]) {
  const prices = items
    .map((item) => getDisplayPrice(item))
    .filter((value): value is string => value !== null);

  return prices.length > 0 ? Math.min(...prices.map(Number)).toString() : null;
}

export function getAvailableSeats(item: TicketItem) {
  if (item.stockAvailable !== null && item.stockAvailable !== undefined) {
    return item.stockAvailable;
  }

  return item.availableSeatLabels.length;
}

export type TimeOfDayFilter = 'morning' | 'afternoon' | 'evening';
export type SeatClassFilter = 'seat' | 'sleeper';

/**
 * Time-of-day filter on the departure instant, mirroring the client's
 * previous local filter (morning 00–12, afternoon 12–18, evening 18–24).
 */
export function matchesTimeOfDay(
  dateStart: string | null | undefined,
  filter: TimeOfDayFilter | undefined,
) {
  if (!filter || !dateStart) return true;
  const hour = new Date(dateStart).getHours();
  if (filter === 'morning') return hour >= 0 && hour < 12;
  if (filter === 'afternoon') return hour >= 12 && hour < 18;
  return hour >= 18 && hour <= 23;
}

/**
 * Seat-class filter on the joined seatClasses text, mirroring the client's
 * previous local filter (seat: ngồi/seat/mềm; sleeper: nằm/bed/khoang).
 */
export function matchesSeatClass(
  seatClasses: string[],
  filter: SeatClassFilter | undefined,
) {
  if (!filter || seatClasses.length === 0) return true;
  const joined = seatClasses.join(' ').toLowerCase();
  if (filter === 'seat') {
    return joined.includes('ngồi') || joined.includes('seat') || joined.includes('mềm');
  }
  return joined.includes('nằm') || joined.includes('bed') || joined.includes('khoang');
}

export function startOfUtcDay(value: string) {
  const date = new Date(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export { toIsoString };
