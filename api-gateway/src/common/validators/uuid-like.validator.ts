import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';

/**
 * Các cột id/orderId/userId/ticketId/ticketItemId/transactionId trong PostgreSQL
 * đều là kiểu UUID. Nếu không chặn ở tầng DTO, giá trị sai định dạng sẽ đi
 * xuống service/Prisma và gây lỗi bind, bị bọc thành HTTP 500 thay vì 400.
 *
 * Riêng transactionId còn phải nhận dạng 32 ký tự không gạch nối vì VNPay giới
 * hạn vnp_TxnRef tối đa 32 ký tự.
 */
export const UUID_LIKE_PATTERN =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** Chuẩn hoá dạng 32 ký tự hex về UUID có gạch nối trước khi forward xuống service. */
export const normalizeUuid = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.length === 32 && !value.includes('-')
    ? `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
    : value;

/**
 * Kiểm tra một trường là UUID hợp lệ (kèm chuẩn hoá dạng 32 ký tự của VNPay).
 *
 * @example
 * @IsUuidLike('orderId')
 * orderId: string;
 */
export const IsUuidLike = (field: string) =>
  applyDecorators(
    Transform(normalizeUuid),
    Matches(UUID_LIKE_PATTERN, { message: `${field} must be a valid UUID` }),
  );