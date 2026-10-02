import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVoucherRequest,
  ListVouchersQuery,
  UpdateVoucherRequest,
  ValidateVoucherRequest,
  ValidateVoucherResponse,
  VoucherResponse,
} from './dto/voucher.dto';

@Injectable()
export class VoucherService {
  private readonly logger = new Logger(VoucherService.name);

  constructor(private readonly prisma: PrismaService) {}

  async validateVoucher(
    payload: ValidateVoucherRequest,
  ): Promise<ValidateVoucherResponse> {
    const code = (payload.code || '').trim().toUpperCase();
    if (!code) {
      return {
        isValid: false,
        code: '',
        discountAmount: 0,
        finalAmount: payload.orderAmount,
        message: 'Vui lòng cung cấp mã khuyến mãi.',
      };
    }

    const voucher = await this.prisma.voucher.findFirst({
      where: {
        code,
        deletedAt: null,
      },
    });

    if (!voucher) {
      return {
        isValid: false,
        code,
        discountAmount: 0,
        finalAmount: payload.orderAmount,
        message: 'Mã khuyến mãi không tồn tại.',
      };
    }

    if (!voucher.isActive) {
      return {
        isValid: false,
        code,
        discountAmount: 0,
        finalAmount: payload.orderAmount,
        message: 'Mã khuyến mãi hiện đang tạm khóa.',
      };
    }

    const now = new Date();
    if (voucher.validFrom > now) {
      return {
        isValid: false,
        code,
        discountAmount: 0,
        finalAmount: payload.orderAmount,
        message: 'Mã khuyến mãi chưa đến ngày bắt đầu áp dụng.',
      };
    }

    if (voucher.validTo < now) {
      return {
        isValid: false,
        code,
        discountAmount: 0,
        finalAmount: payload.orderAmount,
        message: 'Mã khuyến mãi đã hết hạn sử dụng.',
      };
    }

    if (
      voucher.usageLimit !== null &&
      voucher.usedCount >= voucher.usageLimit
    ) {
      return {
        isValid: false,
        code,
        discountAmount: 0,
        finalAmount: payload.orderAmount,
        message: 'Mã khuyến mãi đã hết lượt sử dụng.',
      };
    }

    // Per-customer cap, when the voucher configures one and we know who is
    // asking. The authoritative check happens atomically in reserveUsage();
    // this early check only produces a friendly message.
    if (voucher.perUserLimit !== null && payload.userId) {
      const userUsages = await this.prisma.voucherUsage.count({
        where: { voucherId: voucher.id, userId: payload.userId },
      });
      if (userUsages >= voucher.perUserLimit) {
        return {
          isValid: false,
          code,
          discountAmount: 0,
          finalAmount: payload.orderAmount,
          message: 'Bạn đã sử dụng mã khuyến mãi này rồi.',
        };
      }
    }

    const minAmount = voucher.minOrderAmount
      ? Number(voucher.minOrderAmount)
      : 0;
    if (payload.orderAmount < minAmount) {
      return {
        isValid: false,
        code,
        discountAmount: 0,
        finalAmount: payload.orderAmount,
        message: `Đơn hàng tối thiểu ${minAmount.toLocaleString('vi-VN')} VND để sử dụng mã này.`,
      };
    }

    // Tính toán số tiền chiết khấu
    let discountAmount = 0;
    const discountVal = Number(voucher.discountValue);
    if (voucher.discountType === 'PERCENT') {
      discountAmount = Math.round((payload.orderAmount * discountVal) / 100);
      if (voucher.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(voucher.maxDiscount));
      }
    } else {
      // FIXED_AMOUNT
      discountAmount = Math.min(discountVal, payload.orderAmount);
    }

    const finalAmount = Math.max(0, payload.orderAmount - discountAmount);

    return {
      isValid: true,
      voucherId: voucher.id,
      code: voucher.code,
      title: voucher.title,
      discountType: voucher.discountType,
      discountValue: discountVal,
      discountAmount,
      finalAmount,
      message: `Áp dụng thành công! Bạn được giảm ${discountAmount.toLocaleString('vi-VN')} VND.`,
    };
  }

  /**
   * Atomically claims one redemption of a voucher for an order.
   *
   * The global limit is enforced by a CONDITIONAL update
   * (`usedCount < usageLimit`) inside the same transaction that inserts the
   * usage row. The previous implementation read `usedCount`, compared it, and
   * incremented later in a separate write, so N concurrent checkouts all passed
   * the check and all got the discount (overshoot = N-1).
   *
   * The per-customer cap is checked after the claim: the claim takes a row lock
   * on the voucher, and the count is re-read under READ COMMITTED, so a
   * concurrent transaction observes the committed usage row and rolls back.
   *
   * @returns true when the redemption was recorded.
   */
  async reserveUsage(params: {
    voucherId: string;
    userId: string;
    orderId: string;
    discountAmount: bigint;
  }): Promise<boolean> {
    const { voucherId, userId, orderId, discountAmount } = params;

    return this.prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findUnique({ where: { id: voucherId } });
      if (!voucher || voucher.deletedAt || !voucher.isActive) {
        return false;
      }

      const claimed = await tx.voucher.updateMany({
        where: {
          id: voucherId,
          deletedAt: null,
          isActive: true,
          ...(voucher.usageLimit !== null
            ? { usedCount: { lt: voucher.usageLimit } }
            : {}),
        },
        data: { usedCount: { increment: 1 } },
      });

      if (claimed.count === 0) {
        return false;
      }

      if (voucher.perUserLimit !== null) {
        const userUsages = await tx.voucherUsage.count({
          where: { voucherId, userId },
        });
        if (userUsages >= voucher.perUserLimit) {
          // Roll back the counter increment claimed above.
          throw new ConflictException(
            'Bạn đã sử dụng mã khuyến mãi này rồi.',
          );
        }
      }

      await tx.voucherUsage.create({
        data: { voucherId, userId, orderId, discountAmount },
      });

      return true;
    });
  }

  /**
   * Gives a claimed redemption back (order cancelled / checkout rolled back), so
   * a failed attempt does not permanently consume a limited voucher.
   * Best-effort: failures are logged and never block the caller.
   */
  async releaseUsage(params: {
    voucherId: string;
    orderId: string;
  }): Promise<void> {
    const { voucherId, orderId } = params;

    try {
      await this.prisma.$transaction(async (tx) => {
        const deleted = await tx.voucherUsage.deleteMany({
          where: { voucherId, orderId },
        });

        if (deleted.count === 0) {
          return;
        }

        await tx.voucher.updateMany({
          where: { id: voucherId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      });
    } catch (error) {
      this.logger.warn(
        `Failed to release voucher usage for order ${orderId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async listAvailable(): Promise<VoucherResponse[]> {
    const now = new Date();
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        validFrom: { lte: now },
        validTo: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return vouchers.map((v) => this.mapToResponse(v));
  }

  async adminList(query: ListVouchersQuery) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (typeof query.isActive === 'boolean') {
      where.isActive = query.isActive;
    }
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, vouchers] = await Promise.all([
      this.prisma.voucher.count({ where }),
      this.prisma.voucher.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: vouchers.map((v) => this.mapToResponse(v)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async adminCreate(payload: CreateVoucherRequest): Promise<VoucherResponse> {
    const code = payload.code.trim().toUpperCase();
    const existing = await this.prisma.voucher.findFirst({
      where: { code, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(`Mã voucher '${code}' đã tồn tại.`);
    }

    const voucher = await this.prisma.voucher.create({
      data: {
        code,
        title: payload.title.trim(),
        description: payload.description?.trim() ?? null,
        discountType: payload.discountType,
        discountValue: BigInt(payload.discountValue),
        maxDiscount: payload.maxDiscount
          ? BigInt(payload.maxDiscount)
          : null,
        minOrderAmount: payload.minOrderAmount
          ? BigInt(payload.minOrderAmount)
          : null,
        usageLimit: payload.usageLimit ?? null,
        perUserLimit: payload.perUserLimit ?? null,
        validFrom: payload.validFrom
          ? new Date(payload.validFrom)
          : new Date(),
        validTo: new Date(payload.validTo),
        isActive: payload.isActive ?? true,
      },
    });

    return this.mapToResponse(voucher);
  }

  async adminUpdate(
    id: string,
    payload: UpdateVoucherRequest,
  ): Promise<VoucherResponse> {
    const existing = await this.prisma.voucher.findUnique({
      where: { id },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Voucher không tồn tại.');
    }

    const updateData: any = {};
    if (payload.title !== undefined) updateData.title = payload.title.trim();
    if (payload.description !== undefined)
      updateData.description = payload.description?.trim() ?? null;
    if (payload.discountType !== undefined)
      updateData.discountType = payload.discountType;
    if (payload.discountValue !== undefined)
      updateData.discountValue = BigInt(payload.discountValue);
    if (payload.maxDiscount !== undefined)
      updateData.maxDiscount = payload.maxDiscount
        ? BigInt(payload.maxDiscount)
        : null;
    if (payload.minOrderAmount !== undefined)
      updateData.minOrderAmount = payload.minOrderAmount
        ? BigInt(payload.minOrderAmount)
        : null;
    if (payload.usageLimit !== undefined)
      updateData.usageLimit = payload.usageLimit ?? null;
    if (payload.perUserLimit !== undefined)
      updateData.perUserLimit = payload.perUserLimit ?? null;
    if (payload.validFrom !== undefined)
      updateData.validFrom = new Date(payload.validFrom);
    if (payload.validTo !== undefined)
      updateData.validTo = new Date(payload.validTo);
    if (payload.isActive !== undefined) updateData.isActive = payload.isActive;

    const updated = await this.prisma.voucher.update({
      where: { id },
      data: updateData,
    });

    return this.mapToResponse(updated);
  }

  async adminDelete(id: string) {
    const existing = await this.prisma.voucher.findUnique({
      where: { id },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Voucher không tồn tại.');
    }

    await this.prisma.voucher.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { success: true, message: 'Voucher đã được xóa.' };
  }

  mapToResponse(voucher: any): VoucherResponse {
    return {
      id: voucher.id,
      code: voucher.code,
      title: voucher.title,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: Number(voucher.discountValue),
      maxDiscount: voucher.maxDiscount ? Number(voucher.maxDiscount) : null,
      minOrderAmount: voucher.minOrderAmount
        ? Number(voucher.minOrderAmount)
        : null,
      usageLimit: voucher.usageLimit,
      perUserLimit: voucher.perUserLimit,
      usedCount: voucher.usedCount,
      validFrom: voucher.validFrom.toISOString(),
      validTo: voucher.validTo.toISOString(),
      isActive: voucher.isActive,
      createdAt: voucher.createdAt.toISOString(),
      updatedAt: voucher.updatedAt.toISOString(),
    };
  }
}

