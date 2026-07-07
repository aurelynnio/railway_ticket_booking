import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  ConflictException,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { VnpayPaymentService } from './vnpay.service';
import { Public } from '../common/decorator/public.decorator';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderService } from '../order/order.service';
import type { OrderResponse } from '../order/order.dto';
import { OrderStatus } from '../order/order.dto';
import type { RequestUser } from '../common/interfaces/request-user.interface';

class CreateVnpayPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  orderInfo?: string;
}

@Controller('payments/vnpay')
export class VnpayController {
  constructor(
    private readonly vnpayPaymentService: VnpayPaymentService,
    private readonly orderService: OrderService,
  ) {}

  /**
   * Tạo URL thanh toán VNPay
   * Client gọi endpoint này, nhận về paymentUrl, rồi redirect sang VNPay
   */
  @Post('create')
  async createPayment(
    @Req() request: {
      user?: RequestUser;
      headers: Record<string, string | string[] | undefined>;
      socket?: { remoteAddress?: string };
    },
    @Body() dto: CreateVnpayPaymentDto,
  ) {
    // Ownership check: user chỉ được tạo payment cho order của mình
    const userId = request.user?.userId ?? '';
    const role = request.user?.role;

    let order: OrderResponse | null = null;
    try {
      order = (await firstValueFrom(
        this.orderService.findOne({ orderId: dto.orderId }),
      )) as OrderResponse;
    } catch {
      throw new ForbiddenException('Order not found');
    }

    if (!order) {
      throw new ForbiddenException('Order not found');
    }

    if (role !== 1 && order.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to pay for this order',
      );
    }

    if (
      [
        OrderStatus.Paid,
        OrderStatus.Confirmed,
        OrderStatus.TicketIssued,
      ].includes(order.status)
    ) {
      throw new ConflictException('Order is already paid');
    }

    const ipAddr =
      request.headers['x-forwarded-for'] ||
      request.socket?.remoteAddress ||
      '127.0.0.1';

    const result = await this.vnpayPaymentService.createPaymentUrl({
      order,
      orderInfo:
        dto.orderInfo?.trim() ||
        `Thanh toan don hang ${order.id.slice(0, 8)}`,
      ipAddr: Array.isArray(ipAddr) ? ipAddr[0] : ipAddr,
      userId,
    });

    return result;
  }

  /**
   * Return URL — VNPay redirect user về đây sau khi thanh toán
   * Public: VNPay redirect không mang JWT
   * Chỉ verify và redirect về client, KHÔNG cập nhật DB (DB qua IPN)
   */
  @Get('return')
  @Public()
  async returnUrl(
    @Query() query: any,
    @Res() res: Response,
  ) {
    const result = await this.vnpayPaymentService.verifyReturnUrl(query);

    const clientUrl = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

    if (result.isSuccess && result.isVerified) {
      // Redirect về client success page
      res.redirect(
        `${clientUrl}/payments/vnpay/success?txnRef=${result.vnp_TxnRef}&amount=${result.vnp_Amount}&orderId=${result.orderId ?? ''}&paymentId=${result.paymentId ?? ''}`,
      );
    } else {
      // Redirect về client failure page
      res.redirect(
        `${clientUrl}/payments/vnpay/failed?txnRef=${result.vnp_TxnRef}&message=${encodeURIComponent(result.message)}&orderId=${result.orderId ?? ''}&paymentId=${result.paymentId ?? ''}`,
      );
    }
  }

  /**
   * IPN — VNPay server gọi server-to-server
   * Public: VNPay server không mang JWT
   * Đây là nguồn truth để cập nhật DB
   */
  @Get('ipn')
  @Public()
  async ipn(@Query() query: any) {
    return this.vnpayPaymentService.handleIpn(query);
  }
}
