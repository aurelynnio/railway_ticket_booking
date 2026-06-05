import { randomUUID } from 'crypto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma, Ticket, TicketItem } from '@prisma/client';
import type {
  CreateTicketItemRequest,
  TicketItemResponse,
  TicketResponse,
} from '../ticket.dto';

export function getActiveItems(ticket: Ticket): TicketItem[] {
  return ticket.ticketItems.filter((item: TicketItem) => !item.deletedAt);
}

export function getActiveItemOrThrow(
  ticket: Ticket,
  ticketItemId: string,
): TicketItem {
  const item = ticket.ticketItems.find(
    (entry: TicketItem) => entry.id === ticketItemId && !entry.deletedAt,
  );

  if (!item) {
    throw new HttpException(
      `Ticket item ${ticketItemId} was not found`,
      HttpStatus.NOT_FOUND,
    );
  }

  return item;
}

export function buildTicketItemCreateInput(
  ticketId: string,
  payload: CreateTicketItemRequest,
  now: Date,
): Prisma.TicketItemCreateInput {
  ensureSaleDates(payload.saleStartTime, payload.saleEndTime);

  const seatLabels = uniqueLabels(payload.seatLabels ?? []);
  const availableSeatLabels = uniqueLabels(
    payload.availableSeatLabels ?? seatLabels,
  );
  const stockInitial =
    payload.stockInitial ?? (seatLabels.length > 0 ? seatLabels.length : null);
  const stockAvailable =
    payload.stockAvailable ??
    (availableSeatLabels.length > 0
      ? availableSeatLabels.length
      : stockInitial);

  return normalizeTicketItemStock({
    id: randomUUID(),
    ticketId,
    name: toNullableString(payload.name),
    description: toNullableString(payload.description),
    coachCode: toNullableString(payload.coachCode),
    seatClass: toNullableString(payload.seatClass),
    seatType: toNullableString(payload.seatType),
    seatLabels,
    availableSeatLabels,
    stockInitial,
    stockAvailable,
    stockPrepared: payload.stockPrepared ?? availableSeatLabels.length > 0,
    priceOriginal: toOptionalBigInt(payload.priceOriginal),
    priceFlash: toOptionalBigInt(payload.priceFlash),
    saleStartTime: parseOptionalDate(payload.saleStartTime, 'saleStartTime'),
    saleEndTime: parseOptionalDate(payload.saleEndTime, 'saleEndTime'),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
}

export function toTicketItemSetInput(
  item: TicketItem,
): Prisma.TicketItemCreateInput {
  return {
    id: item.id,
    ticketId: item.ticketId,
    name: item.name,
    description: item.description,
    coachCode: item.coachCode,
    seatClass: item.seatClass,
    seatType: item.seatType,
    seatLabels: item.seatLabels,
    availableSeatLabels: item.availableSeatLabels,
    stockInitial: item.stockInitial,
    stockAvailable: item.stockAvailable,
    stockPrepared: item.stockPrepared,
    priceOriginal: item.priceOriginal,
    priceFlash: item.priceFlash,
    saleStartTime: item.saleStartTime,
    saleEndTime: item.saleEndTime,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    deletedAt: item.deletedAt,
  };
}

export function mergeTicketItem(
  item: TicketItem,
  patch: Partial<TicketItem>,
): TicketItem {
  return {
    ...item,
    ...patch,
  };
}

export function normalizeTicketItemStock(
  item: Prisma.TicketItemCreateInput,
): Prisma.TicketItemCreateInput;
export function normalizeTicketItemStock(item: TicketItem): TicketItem;
export function normalizeTicketItemStock(
  item: Prisma.TicketItemCreateInput | TicketItem,
) {
  const seatLabels = uniqueLabels(item.seatLabels ?? []);
  const availableSeatLabels = sortSeatLabels(
    uniqueLabels(item.availableSeatLabels ?? []),
    seatLabels,
  );
  const stockInitial =
    item.stockInitial ?? (seatLabels.length > 0 ? seatLabels.length : null);
  const stockAvailable =
    item.stockAvailable ??
    (availableSeatLabels.length > 0
      ? availableSeatLabels.length
      : stockInitial);

  return {
    ...item,
    seatLabels,
    availableSeatLabels,
    stockInitial,
    stockAvailable,
  };
}

export function toTicketResponse(ticket: Ticket): TicketResponse {
  return {
    id: ticket.id,
    title: ticket.title,
    trainNumber: ticket.trainNumber,
    departureStationCode: ticket.departureStationCode,
    departureStationName: ticket.departureStationName,
    arrivalStationCode: ticket.arrivalStationCode,
    arrivalStationName: ticket.arrivalStationName,
    journeyNote: ticket.journeyNote,
    dateStart: toIsoString(ticket.dateStart),
    dateEnd: toIsoString(ticket.dateEnd),
    status: ticket.status,
    createdAt: toIsoString(ticket.createdAt),
    updatedAt: toIsoString(ticket.updatedAt),
    deletedAt: toIsoString(ticket.deletedAt),
    ticketItems: getActiveItems(ticket).map((item: TicketItem) =>
      toTicketItemResponse(item),
    ),
  };
}

export function toTicketItemResponse(item: TicketItem): TicketItemResponse {
  return {
    id: item.id,
    ticketId: item.ticketId,
    name: item.name,
    description: item.description,
    coachCode: item.coachCode,
    seatClass: item.seatClass,
    seatType: item.seatType,
    seatLabels: item.seatLabels,
    availableSeatLabels: item.availableSeatLabels,
    occupiedSeatLabels: item.seatLabels.filter(
      (label: string) => !item.availableSeatLabels.includes(label),
    ),
    stockInitial: item.stockInitial,
    stockAvailable: item.stockAvailable,
    stockPrepared: item.stockPrepared,
    priceOriginal: toNumber(item.priceOriginal),
    priceFlash: toNumber(item.priceFlash),
    saleStartTime: toIsoString(item.saleStartTime),
    saleEndTime: toIsoString(item.saleEndTime),
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
    deletedAt: toIsoString(item.deletedAt),
    saleOpen: isSaleOpen(item),
  };
}

export function ensureJourneyDates(dateStart?: string, dateEnd?: string) {
  const parsedStart = parseOptionalDate(dateStart, 'dateStart');
  const parsedEnd = parseOptionalDate(dateEnd, 'dateEnd');
  if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
    throw new HttpException(
      'dateStart must be before or equal to dateEnd',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function ensureSaleDates(saleStartTime?: string, saleEndTime?: string) {
  const parsedStart = parseOptionalDate(saleStartTime, 'saleStartTime');
  const parsedEnd = parseOptionalDate(saleEndTime, 'saleEndTime');
  if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
    throw new HttpException(
      'saleStartTime must be before or equal to saleEndTime',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function ensureItemCanBeSold(item: TicketItem) {
  if (!item.stockPrepared) {
    throw new HttpException('Stock has not been prepared', HttpStatus.CONFLICT);
  }
  if (!isSaleOpen(item)) {
    throw new HttpException('Sale window is closed', HttpStatus.CONFLICT);
  }
}

export function ensureTicketItemId(ticketItemId?: string) {
  if (!ticketItemId?.trim()) {
    throw new HttpException('ticketItemId is required', HttpStatus.BAD_REQUEST);
  }
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

export function normalizeQuantity(quantity?: number) {
  const normalized = quantity ?? 1;
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new HttpException(
      'quantity must be a positive integer',
      HttpStatus.BAD_REQUEST,
    );
  }

  return normalized;
}

export function uniqueLabels(labels: string[]) {
  return [...new Set(labels.map((label) => label.trim()).filter(Boolean))];
}

export function sortSeatLabels(labels: string[], seatOrder: string[]) {
  if (seatOrder.length === 0) {
    return uniqueLabels(labels);
  }

  return uniqueLabels(labels).sort(
    (left, right) => seatOrder.indexOf(left) - seatOrder.indexOf(right),
  );
}

export function parseOptionalDate(
  value: string | null | undefined,
  fieldName: string,
) {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpException(
      `${fieldName} must be a valid ISO date`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return parsed;
}

export function toNullableString(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function pickNullableString(
  value: string | undefined,
  fallback: string | null,
) {
  if (value === undefined) {
    return fallback;
  }

  return toNullableString(value);
}

export function toOptionalBigInt(value: number | string | undefined) {
  if (value === undefined || value === '') {
    return undefined;
  }

  return toBigInt(value);
}

export function pickBigInt(
  value: number | string | undefined,
  fallback: bigint | null,
) {
  if (value === undefined || value === '') {
    return fallback;
  }

  return toBigInt(value);
}

export function toBigInt(value: number | string) {
  try {
    return BigInt(value);
  } catch {
    throw new HttpException(
      'Price values must be valid integers',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function toIsoString(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export function toNumber(value: bigint | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}
