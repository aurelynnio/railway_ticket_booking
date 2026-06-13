import { HttpException, HttpStatus } from '@nestjs/common';
import type {
  Order,
  OrderPassenger as PrismaOrderPassenger,
  OrderSeatLabel,
} from '@prisma/client';
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

export type OrderWithRelations = Order & {
  seatLabels: OrderSeatLabel[];
  passengers: PrismaOrderPassenger[];
};

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

  return parsed;
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

export function toOrderResponse(order: OrderWithRelations): OrderResponse {
  return {
    id: order.id,
    userId: order.userId,
    ticketItemId: order.ticketItemId,
    ticketId: order.ticketId,
    ticketTitle: order.ticketTitle,
    trainNumber: order.trainNumber,
    departureStationCode: order.departureStationCode,
    departureStationName: order.departureStationName,
    arrivalStationCode: order.arrivalStationCode,
    arrivalStationName: order.arrivalStationName,
    departureTime: order.departureTime?.toISOString() ?? null,
    arrivalTime: order.arrivalTime?.toISOString() ?? null,
    coachCode: order.coachCode,
    seatClass: order.seatClass,
    seatType: order.seatType,
    quantity: order.quantity,
    unitPrice: Number(order.unitPrice),
    totalPrice: Number(order.totalPrice),
    ticketCode: order.ticketCode,
    qrPayload: order.qrPayload,
    status: order.status,
    seatLabels: order.seatLabels.map((entry: OrderSeatLabel) => entry.seatLabel),
    passengers: order.passengers.map((passenger: PrismaOrderPassenger) => ({
      fullName: passenger.fullName,
      passengerType: passenger.passengerType,
      identityNumber: passenger.identityNumber,
      phoneNumber: passenger.phoneNumber,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    deletedAt: order.deletedAt?.toISOString() ?? null,
  };
}
