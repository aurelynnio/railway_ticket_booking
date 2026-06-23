import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { VnpayService } from 'nestjs-vnpay';
import { ProductCode, VnpLocale } from 'vnpay';
import { PaymentService } from './payment.service';

@Injectable()
export class VnpayPaymentService {
  private readonly logger = new Logger(VnpayPaymentService.name);

  constructor(
    private readonly vnpayService: VnpayService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Tạo URL thanh toán VNPay
   * 1. Tạo payment record trong DB qua payments-service
   * 2. Build VNPay payment URL
   * 3. Trả về URL cho client redirect
   */
  async createPaymentUrl(params: {
    orderId: string;
    amount: number;
    orderInfo: string;
    ipAddr: string;
    userId?: string;
  }): Promise<{ paymentUrl: string; paymentId: string; transactionId: string }> {
    const { orderId, amount, orderInfo, ipAddr, userId } = params;

    // Sinh transactionId duy nhất
    const transactionId = `VNP${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 1. Tạo payment record trong DB
    const payment = (await firstValueFrom(
      this.paymentService.createPayment({
        orderId,
        userId: userId ?? null,
        amount: String(amount),
        paymentMethod: 'VNPAY',
      }),
    )) as any;

    // 2. Build VNPay payment URL
    const paymentUrl = this.vnpayService.buildPaymentUrl({
      vnp_Amount: amount,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: transactionId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:8080/payments/vnpay/return',
      vnp_Locale: VnpLocale.VN,
    });

    this.logger.log(`Created VNPay payment URL for order ${orderId}, txnRef: ${transactionId}`);

    return {
      paymentUrl,
      paymentId: payment?.id ?? '',
      transactionId,
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
  }> {
    try {
      const verify = await this.vnpayService.verifyReturnUrl(query);

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

      // Thanh toán thất bại
      if (!verify.isSuccess) {
        this.logger.warn(`IPN payment failed for txnRef=${verify.vnp_TxnRef}`);
        return { RspCode: '00', Message: 'Payment failed but confirmed' };
      }

      // Tìm payment theo transactionId (vnp_TxnRef)
      const payment = (await firstValueFrom(
        this.paymentService.getPaymentByTransactionId({
          transactionId: verify.vnp_TxnRef,
        }),
      )) as any;

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

      // Cập nhật trạng thái thanh toán thành công
      await firstValueFrom(
        this.paymentService.markPaidWorkflow({
          id: payment.id,
          transactionId: verify.vnp_TxnRef,
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
}
