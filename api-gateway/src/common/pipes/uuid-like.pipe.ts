import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';
import {
  UUID_LIKE_PATTERN,
  normalizeUuid,
} from '../validators/uuid-like.validator';

/**
 * Pipe cho path param là UUID (id, orderId, ticketId, ticketItemId, userId, transactionId).
 * Chấp nhận UUID chuẩn và cả dạng 32 ký tự không gạch nối của vnp_TxnRef, rồi chuẩn hoá
 * về UUID có gạch nối trước khi forward xuống service.
 *
 * Nếu không chặn ở gateway, service sẽ nhận chuỗi sai định dạng, Prisma bind lỗi và trả
 * HTTP 500 thay vì 400.
 *
 * @example
 * @Param('ticketId', UuidLikePipe) ticketId: string
 */
@Injectable()
export class UuidLikePipe implements PipeTransform<unknown, string> {
  transform(value: unknown, metadata: ArgumentMetadata): string {
    const normalized = normalizeUuid({ value });

    if (typeof normalized !== 'string' || !UUID_LIKE_PATTERN.test(normalized)) {
      const field = metadata.data ?? 'param';
      throw new BadRequestException(
        `Validation failed (${field} must be a valid UUID)`,
      );
    }

    return normalized;
  }
}