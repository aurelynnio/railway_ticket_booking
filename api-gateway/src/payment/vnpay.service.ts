import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { VnpayService } from 'nestjs-vnpay';
import { ProductCode, VnpLocale } from 'vnpay';
import { OrderStatus } from '../order/order.dto';
import type { OrderResponse } from '../order/order.dto';
import { PaymentService } from './payment.service';
import { PaymentStatus } from './payment.dto';
import type { PaymentDto } from './payment.dto';

export type VnpayQuery = Record<string, string | undefined>;

export interface VnpayIpnResponse {
  RspCode: '00' | '01' | '04' | '97';
  Message: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown VNPay error';
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const candidate = error as { status?: unknown; response?: { status?: unknown; statusCode?: unknown } };
  return typeof candidate.status === 'number'
    ? candidate.status
    : typeof candidate.response?.statusCode === 'number'
      ? candidate.response.statusCode
      : typeof candidate.response?.status === 'number'
        ? candidate.response.status
        : undefined;
}

/**
 * Convert a hyphen-stripped UUID back to standard UUID format.
 * VNPAY limits vnp_TxnRef to 34 chars, so we strip hyphens (36 → 32) when
 * sending and restore them when receiving the IPN/return callback.
 */
function toUuidFormat(hex: string): string {
  if (hex.length === 32 && !hex.includes('-')) {
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return hex;
}

@Injectable()
export class VnpayPaymentService {
  private readonly logger = new Logger(VnpayPaymentService.name);
  private static readonly defaultLocalReturnUrl = 'http://localhost:8080/payments/vnpay/return';

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
      vnp_TxnRef: payment.transactionId.replace(/-/g, ''),
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: this.resolveReturnUrl(),
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
  async verifyReturnUrl(query: VnpayQuery): Promise<{
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
      const verify = (await this.vnpayService.verifyReturnUrl(query as never)) as Awaited<ReturnType<VnpayService['verifyReturnUrl']>> & { vnp_ResponseCode?: string };
      const payment = await this.findPaymentByTransactionId(toUuidFormat(verify.vnp_TxnRef));

      this.logger.log(
        `Return URL verified: isSuccess=${verify.isSuccess}, txnRef=${verify.vnp_TxnRef}`,
      );

      return {
        isSuccess: verify.isSuccess,
        isVerified: verify.isVerified,
        vnp_TxnRef: verify.vnp_TxnRef,
        vnp_Amount: Number(verify.vnp_Amount),
        vnp_ResponseCode: verify.vnp_ResponseCode ?? '',
        message: verify.message ?? '',
        paymentId: payment?.id ?? null,
        orderId: payment?.orderId ?? null,
      };
    } catch (error: unknown) {
      // SDK throw exception khi query không hợp lệ (thiếu params, checksum sai)
      this.logger.warn(
        `Return URL verification failed: ${getErrorMessage(error)}`,
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
  async handleIpn(query: VnpayQuery): Promise<VnpayIpnResponse> {
    try {
      const verify = await this.vnpayService.verifyIpnCall(query as never);

      // Checksum không hợp lệ
      if (!verify.isVerified) {
        this.logger.warn(`IPN checksum failed for txnRef=${verify.vnp_TxnRef}`);
        return { RspCode: '97', Message: 'Checksum failed' };
      }

      const payment = await this.findPaymentByTransactionId(toUuidFormat(verify.vnp_TxnRef));

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
      if (payment.status === PaymentStatus.Paid) {
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
    } catch (error: unknown) {
      // Exception thường do verify fail (checksum sai, query không hợp lệ)
      this.logger.error(`IPN handling error: ${getErrorMessage(error)}`, getErrorStack(error));
      return { RspCode: '97', Message: 'Checksum failed' };
    }
  }

  private assertPayableOrder(order: OrderResponse): void {
    if (
      [
        OrderStatus.Cancelled,
        OrderStatus.Expired,
        OrderStatus.Refunded,
      ].map(Number).includes(order.status)
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
      ].map(Number).includes(order.status)
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

    // VNPay requires vnp_TxnRef to be unique within the day. Reusing the same
    // transactionId on retry triggers VNPay error code 72 (duplicate TxnRef),
    // so we close out any prior pending/processing VNPay payment and issue a
    // fresh one with a new transactionId on every createPaymentUrl call.
    const activePayments = payments.filter(
      (payment) =>
        payment.paymentMethod === 'VNPAY' &&
        [PaymentStatus.Pending, PaymentStatus.Processing].includes(payment.status),
    );

    for (const active of activePayments) {
      try {
        await firstValueFrom(
          this.paymentService.markFailed({ id: active.id }),
        );
        this.logger.log(
          `Closed stale VNPay payment ${active.id} (txnRef=${active.transactionId}) before reissuing`,
        );
      } catch (error: unknown) {
        this.logger.warn(
          `Failed to close stale VNPay payment ${active.id}: ${getErrorMessage(error)}`,
        );
      }
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
    } catch (error: unknown) {
      const status = getErrorStatus(error);
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
    } catch (error: unknown) {
      const status = getErrorStatus(error);
      if (status === HttpStatus.NOT_FOUND) {
        return null;
      }

      throw error;
    }
  }

  private resolveReturnUrl(): string {
    const publicBaseUrl = this.normalizeUrl(
      process.env.VNPAY_PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL,
    );

    if (publicBaseUrl) {
      return `${publicBaseUrl}/payments/vnpay/return`;
    }

    return (
      this.normalizeUrl(process.env.VNPAY_RETURN_URL) ||
      VnpayPaymentService.defaultLocalReturnUrl
    );
  }

  private normalizeUrl(value?: string): string {
    return value?.trim().replace(/[\\/]+$/, '') ?? '';
  }
}
