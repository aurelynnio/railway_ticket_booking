import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { VnpayService } from 'nestjs-vnpay';
import { ProductCode, VnpLocale } from 'vnpay';
import { OrderStatus } from '../order/order.dto';
import type { OrderResponse } from '../order/order.dto';
import { PaymentService } from './payment.service';
import { PaymentStatus } from './payment.dto';
import type { PaymentDto } from './payment.dto';

@Injectable()
export class VnpayPaymentService {
  private readonly logger = new Logger(VnpayPaymentService.name);

  constructor(
    private readonly vnpayService: VnpayService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Tạo URL thanh toán VNPay
   * 1. Tái sử dụng pending payment hiện có hoặc tạo mới đúng transactionId
   * 2. Build VNPay payment URL
   * 3. Trả về URL cho client redirect
   */
  async createPaymentUrl(params: {
    order: OrderResponse;
    orderInfo: string;
    ipAddr: string;
    userId?: string;
  }): Promise<{
    paymentUrl: string;
    paymentId: string;
    transactionId: string;
    orderId: string;
  }> {
    const { order, orderInfo, ipAddr, userId } = params;

    this.assertPayableOrder(order);

    const payment = await this.findOrCreateVnpayPayment(order, userId);
    if (payment.status === PaymentStatus.Pending) {
      await firstValueFrom(this.paymentService.markProcessing({ id: payment.id }));
    }

    // 2. Build VNPay payment URL
    const paymentUrl = this.vnpayService.buildPaymentUrl({
      vnp_Amount: Number(payment.amount),
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: payment.transactionId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:8080/payments/vnpay/return',
      vnp_Locale: VnpLocale.VN,
    });

    this.logger.log(
      `Created VNPay payment URL for order ${order.id}, txnRef: ${payment.transactionId}`,
    );

    return {
      paymentUrl,
      paymentId: payment.id,
      transactionId: payment.transactionId,
      orderId: payment.orderId,
    };
  }

  /**
   * Xử lý Return URL — VNPay redirect user về đây sau khi thanh toán
   * Chỉ dùng để hiển thị kết quả cho user, KHÔNG cập nhật DB
   * DB cập nhật qua IPN endpoint
   */
  async verifyReturnUrl(query: any): Promise<{
    isSuccess: boolean;
    isVerified: boolean;
    vnp_TxnRef: string;
    vnp_Amount: number;
    vnp_ResponseCode: string;
    message: string;
    paymentId: string | null;
    orderId: string | null;
  }> {
    try {
      const verify = await this.vnpayService.verifyReturnUrl(query);
      const payment = await this.findPaymentByTransactionId(verify.vnp_TxnRef);

      this.logger.log(
        `Return URL verified: isSuccess=${verify.isSuccess}, txnRef=${verify.vnp_TxnRef}`,
      );

      return {
        isSuccess: verify.isSuccess,
        isVerified: verify.isVerified,
        vnp_TxnRef: verify.vnp_TxnRef,
        vnp_Amount: Number(verify.vnp_Amount),
        vnp_ResponseCode: (verify as any).vnp_ResponseCode ?? '',
        message: verify.message ?? '',
        paymentId: payment?.id ?? null,
        orderId: payment?.orderId ?? null,
      };
    } catch (error: any) {
      // SDK throw exception khi query không hợp lệ (thiếu params, checksum sai)
      this.logger.warn(
        `Return URL verification failed: ${error.message}`,
      );
      return {
        isSuccess: false,
        isVerified: false,
        vnp_TxnRef: query?.vnp_TxnRef ?? '',
        vnp_Amount: Number(query?.vnp_Amount ?? 0),
        vnp_ResponseCode: '',
        message: 'Verification failed',
        paymentId: null,
        orderId: null,
      };
    }
  }

  /**
   * Xử lý IPN — VNPay server gọi server-to-server
   * Đây là nguồn truth để cập nhật DB
   * Phải trả về RSP code cho VNPay
   */
  async handleIpn(query: any): Promise<any> {
    try {
      const verify = await this.vnpayService.verifyIpnCall(query);

      // Checksum không hợp lệ
      if (!verify.isVerified) {
        this.logger.warn(`IPN checksum failed for txnRef=${verify.vnp_TxnRef}`);
        return { RspCode: '97', Message: 'Checksum failed' };
      }

      const payment = await this.findPaymentByTransactionId(verify.vnp_TxnRef);

      if (!payment) {
        this.logger.warn(`IPN order not found: txnRef=${verify.vnp_TxnRef}`);
        return { RspCode: '01', Message: 'Order not found' };
      }

      // Kiểm tra số tiền khớp
      if (Number(payment.amount) !== verify.vnp_Amount) {
        this.logger.warn(
          `IPN amount mismatch: DB=${payment.amount}, VNPay=${verify.vnp_Amount}`,
        );
        return { RspCode: '04', Message: 'Amount invalid' };
      }

      // Kiểm tra đã thanh toán chưa (idempotency)
      if (payment.status === 2) {
        // PaymentStatus.Paid
        this.logger.log(`IPN order already confirmed: txnRef=${verify.vnp_TxnRef}`);
        return { RspCode: '00', Message: 'Order already confirmed' };
      }

      if (!verify.isSuccess) {
        await firstValueFrom(this.paymentService.markFailed({ id: payment.id }));
        this.logger.warn(`IPN payment failed for txnRef=${verify.vnp_TxnRef}`);
        return { RspCode: '00', Message: 'Payment failed but confirmed' };
      }

      // Cập nhật trạng thái thanh toán thành công
      await firstValueFrom(
        this.paymentService.markPaidWorkflow({
          id: payment.id,
        }),
      );

      this.logger.log(`IPN payment success confirmed: txnRef=${verify.vnp_TxnRef}`);
      return { RspCode: '00', Message: 'Confirm success' };
    } catch (error: any) {
      // Exception thường do verify fail (checksum sai, query không hợp lệ)
      this.logger.error(`IPN handling error: ${error.message}`, error.stack);
      return { RspCode: '97', Message: 'Checksum failed' };
    }
  }

  private assertPayableOrder(order: OrderResponse): void {
    if (
      [
        OrderStatus.Cancelled,
        OrderStatus.Expired,
        OrderStatus.Refunded,
      ].includes(order.status)
    ) {
      throw new HttpException(
        'Order is closed and cannot be paid',
        HttpStatus.CONFLICT,
      );
    }

    if (
      [
        OrderStatus.Paid,
        OrderStatus.Confirmed,
        OrderStatus.TicketIssued,
      ].includes(order.status)
    ) {
      throw new HttpException(
        'Order is already paid',
        HttpStatus.CONFLICT,
      );
    }
  }

  private async findOrCreateVnpayPayment(
    order: OrderResponse,
    userId?: string,
  ): Promise<PaymentDto> {
    const payments = await this.listPaymentsByOrderId(order.id);
    const paidPayment = payments.find(
      (payment) =>
        payment.paymentMethod === 'VNPAY' &&
        payment.status === PaymentStatus.Paid,
    );

    if (paidPayment) {
      throw new HttpException('Order is already paid', HttpStatus.CONFLICT);
    }

    const activePayment = payments.find(
      (payment) =>
        payment.paymentMethod === 'VNPAY' &&
        [PaymentStatus.Pending, PaymentStatus.Processing].includes(payment.status),
    );

    if (activePayment) {
      return activePayment;
    }

    return firstValueFrom(
      this.paymentService.createPayment({
        orderId: order.id,
        userId: userId ?? order.userId,
        amount: String(order.totalPrice),
        paymentMethod: 'VNPAY',
      }),
    ) as Promise<PaymentDto>;
  }

  private async listPaymentsByOrderId(orderId: string): Promise<PaymentDto[]> {
    try {
      return (await firstValueFrom(
        this.paymentService.getPaymentsByOrderId({ orderId }),
      )) as PaymentDto[];
    } catch (error: any) {
      const status =
        error?.status ?? error?.response?.statusCode ?? error?.response?.status;
      if (status === HttpStatus.NOT_FOUND) {
        return [];
      }

      throw error;
    }
  }

  private async findPaymentByTransactionId(
    transactionId: string,
  ): Promise<PaymentDto | null> {
    try {
      return (await firstValueFrom(
        this.paymentService.getPaymentByTransactionId({
          transactionId,
        }),
      )) as PaymentDto;
    } catch (error: any) {
      const status =
        error?.status ?? error?.response?.statusCode ?? error?.response?.status;
      if (status === HttpStatus.NOT_FOUND) {
        return null;
      }

      throw error;
    }
  }
}
