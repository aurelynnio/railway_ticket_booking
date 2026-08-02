import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PaymentService } from './payment.service';
import {
  CancelPaymentRequest,
  CreatePaymentRequest,
  ExpirePaymentRequest,
  ListPaymentsQuery,
  MarkFailedRequest,
  MarkPaidRequest,
  MarkProcessingRequest,
  PaginationQuery,
  PaymentDto,
} from './payment.dto';
import { Public } from '../common/decorator/public.decorator';
import { Roles, UserRole } from '../common/decorator/roles.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('health')
  @Public()
  health() {
    return this.paymentService.health();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  createPayment(@Body() payload: CreatePaymentRequest) {
    return this.paymentService.createPayment(payload);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  listPayments(
    @Query() query: ListPaymentsQuery,
    @Query() pagination: PaginationQuery,
  ) {
    return this.paymentService.listPayments({ query, pagination });
  }

  @Get('transaction/:transactionId')
  @Roles(UserRole.ADMIN)
  getPaymentByTransactionId(@Param('transactionId') transactionId: string) {
    return this.paymentService.getPaymentByTransactionId({ transactionId });
  }

  @Get('order/:orderId')
  async listPaymentsByOrderId(
    @Req() request: { user?: RequestUser },
    @Param('orderId') orderId: string,
  ) {
    // Non-admin chỉ xem payment của order thuộc về mình
    if (request.user?.role !== UserRole.ADMIN) {
      const payments = (await firstValueFrom(
        this.paymentService.getPaymentsByOrderId({ orderId }),
      )) as PaymentDto[] | null;

      const list = payments ?? [];
      if (list.length > 0) {
        const ownerUserId = list[0].userId;
        if (ownerUserId && ownerUserId !== request.user?.userId) {
          throw new ForbiddenException(
            'You do not have permission to access payments for this order',
          );
        }
      }
      return list;
    }
    return this.paymentService.getPaymentsByOrderId({ orderId });
  }

  @Get('user/:userId')
  listPaymentsByUserId(
    @Req() request: { user?: RequestUser },
    @Param('userId') userId: string,
    @Query() pagination: PaginationQuery,
  ) {
    // Non-admin chỉ xem payment của chính mình
    if (
      request.user?.role !== UserRole.ADMIN &&
      userId !== request.user?.userId
    ) {
      throw new ForbiddenException('You can only view your own payments');
    }
    return this.paymentService.getPaymentsByUserId({ userId, pagination });
  }

  @Get(':id')
  async getPaymentById(
    @Req() request: { user?: RequestUser },
    @Param('id') id: string,
  ) {
    await this.assertPaymentOwnership(request.user, id);
    return this.paymentService.getPaymentById({ id });
  }

  @Post('mark-processing')
  @Roles(UserRole.ADMIN)
  markProcessing(@Body() payload: MarkProcessingRequest) {
    return this.paymentService.markProcessing(payload);
  }

  @Post('mark-paid')
  @Roles(UserRole.ADMIN)
  markPaid(@Body() payload: MarkPaidRequest) {
    return this.paymentService.markPaidWorkflow(payload);
  }

  @Post('mark-failed')
  @Roles(UserRole.ADMIN)
  markFailed(@Body() payload: MarkFailedRequest) {
    return this.paymentService.markFailed(payload);
  }

  @Post('cancel')
  @Roles(UserRole.ADMIN)
  cancelPayment(@Body() payload: CancelPaymentRequest) {
    return this.paymentService.cancelPayment(payload);
  }

  @Post('expire')
  @Roles(UserRole.ADMIN)
  expirePayment(@Body() payload: ExpirePaymentRequest) {
    return this.paymentService.expirePayment(payload);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  softDeletePayment(@Param('id') id: string) {
    return this.paymentService.softDeletePayment({ id });
  }

  /**
   * Kiểm tra user có quyền truy cập payment này không.
   * - Admin: luôn cho phép
   * - User thường: chỉ cho phép nếu payment.userId === user.userId
   */
  private async assertPaymentOwnership(
    user: RequestUser | undefined,
    paymentId: string,
  ): Promise<void> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin bypass ownership check
    if (user.role === UserRole.ADMIN) {
      return;
    }

    const payment = (await firstValueFrom(
      this.paymentService.getPaymentById({ id: paymentId }),
    )) as PaymentDto | null;

    if (!payment) {
      throw new ForbiddenException('Payment not found');
    }

    // Payment có thể có userId = null (tạo bởi system)
    // Chỉ chặn nếu payment có userId và không khớp
    if (payment.userId && payment.userId !== user.userId) {
      throw new ForbiddenException(
        'You do not have permission to access this payment',
      );
    }
  }
}
