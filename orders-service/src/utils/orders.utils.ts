import { HttpException, HttpStatus } from '@nestjs/common';
import type {
  OrderPassenger,
  OrderPassengerPayload,
  OrderResponse,
} from '../orders.dto';
import { OrderStatus } from '../orders.dto';

type TicketPayload = Pick<
  OrderResponse,
  'id' | 'ticketCode' | 'ticketId' | 'ticketItemId' | 'userId' | 'quantity'
>;

export function assertRequired(
  value: string | null | undefined,
  fieldName: string,
) {
  if (!value?.trim()) {
    throw new HttpException(`${fieldName} is required`, HttpStatus.BAD_REQUEST);
  }
}

export function normalizePositiveInteger(
  value: number | string,
  fieldName: string,
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new HttpException(
      `${fieldName} must be a positive integer`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return parsed;
}

export function normalizeNonNegativeInteger(
  value: number | string,
  fieldName: string,
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new HttpException(
      `${fieldName} must be a non-negative integer`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return parsed;
}

export function toNullableString(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function toNullableDate(
  value: string | null | undefined,
  fieldName: string,
) {
  const normalized = toNullableString(value);
  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new HttpException(
      `${fieldName} must be a valid date string`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return date.toISOString();
}

export function normalizeSeatLabels(seatLabels: string[] = []) {
  return [...new Set(seatLabels.map((label) => label.trim()).filter(Boolean))];
}

export function normalizePassengers(
  passengers: OrderPassengerPayload[] = [],
): OrderPassenger[] {
  return passengers.map((passenger) => {
    assertRequired(passenger.fullName, 'passengers.fullName');
    assertRequired(passenger.passengerType, 'passengers.passengerType');

    return {
      fullName: passenger.fullName.trim(),
      passengerType: passenger.passengerType.trim(),
      identityNumber: toNullableString(passenger.identityNumber),
      phoneNumber: toNullableString(passenger.phoneNumber),
    };
  });
}

export function normalizeOptionalStatus(value: number | string | undefined) {
  if (value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    !Object.values(OrderStatus).includes(parsed)
  ) {
    throw new HttpException(
      'status must be a valid number',
      HttpStatus.BAD_REQUEST,
    );
  }

  return parsed as OrderStatus;
}

export function normalizePageValue(
  value: number | string | undefined,
  fallback: number,
) {
  if (value === undefined || value === '') {
    return fallback;
  }

  return normalizePositiveInteger(value, 'pagination value');
}

export function buildTicketCode(order: Pick<OrderResponse, 'id'>) {
  return `TCK-${order.id.slice(0, 8).toUpperCase()}`;
}

export function buildQrPayload(order: TicketPayload) {
  return JSON.stringify({
    orderId: order.id,
    ticketCode: order.ticketCode ?? buildTicketCode(order),
    ticketId: order.ticketId,
    ticketItemId: order.ticketItemId,
    userId: order.userId,
    quantity: order.quantity,
  });
}
