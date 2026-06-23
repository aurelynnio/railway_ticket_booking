import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { VnpayPaymentService } from './vnpay.service';
import { Public } from '../common/decorator/public.decorator';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { OrderService } from '../order/order.service';

class CreateVnpayPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  orderInfo: string;
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
    @Req() request: any,
    @Body() dto: CreateVnpayPaymentDto,
  ) {
    // Ownership check: user chỉ được tạo payment cho order của mình
    const userId = request.user?.userId ?? '';
    const role = request.user?.role;

    // Admin bypass ownership check
    if (role !== 1) {
      let order: any = null;
      try {
        order = (await firstValueFrom(
          this.orderService.findOne({ orderId: dto.orderId }),
        )) as any;
      } catch {
        // Order không tồn tại hoặc lỗi kết nối → chặn truy cập
        throw new ForbiddenException('Order not found');
      }

      if (!order) {
        throw new ForbiddenException('Order not found');
      }

      if (order.userId !== userId) {
        throw new ForbiddenException(
          'You do not have permission to pay for this order',
        );
      }
    }

    const ipAddr =
      request.headers['x-forwarded-for'] ||
      request.socket?.remoteAddress ||
      '127.0.0.1';

    const result = await this.vnpayPaymentService.createPaymentUrl({
      orderId: dto.orderId,
      amount: dto.amount,
      orderInfo: dto.orderInfo,
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
        `${clientUrl}/payments/vnpay/success?txnRef=${result.vnp_TxnRef}&amount=${result.vnp_Amount}`,
      );
    } else {
      // Redirect về client failure page
      res.redirect(
        `${clientUrl}/payments/vnpay/failed?txnRef=${result.vnp_TxnRef}&message=${encodeURIComponent(result.message)}`,
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
