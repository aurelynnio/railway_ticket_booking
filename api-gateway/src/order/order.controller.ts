import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { OrderService } from './order.service';
import {
  CancelOrderRequest,
  CreateOrderRequest,
  CheckoutOrderRequest,
  ListOrdersQuery,
  OrderResponse,
  UpdateOrderPassengersRequest,
  UpdateOrderSeatLabelsRequest,
} from './order.dto';
import { Public } from '../common/decorator/public.decorator';
import { Roles, UserRole } from '../common/decorator/roles.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('health')
  @Public()
  health() {
    return this.orderService.health();
  }

  @Post('checkout')
  checkout(
    @Req() request: { user?: RequestUser },
    @Body() payload: CheckoutOrderRequest,
  ) {
    // Override userId từ JWT — chống impersonation
    payload.userId = request.user?.userId ?? '';
    return this.orderService.checkout(payload);
  }

  @Post()
  create(
    @Req() request: { user?: RequestUser },
    @Body() payload: CreateOrderRequest,
  ) {
    // Override userId từ JWT — chống impersonation
    payload.userId = request.user?.userId ?? '';
    return this.orderService.create(payload);
  }

  @Get()
  list(
    @Req() request: { user?: RequestUser },
    @Query() query: ListOrdersQuery,
  ) {
    // Non-admin chỉ xem được order của chính mình
    if (request.user?.role !== UserRole.ADMIN) {
      query.userId = request.user?.userId;
    }
    return this.orderService.list(query);
  }

  @Get(':orderId')
  async findOne(
    @Req() request: { user?: RequestUser },
    @Param('orderId') orderId: string,
  ) {
    await this.assertOrderOwnership(request.user, orderId);
    return this.orderService.findOne({ orderId });
  }

  @Get(':orderId/summary')
  async summary(
    @Req() request: { user?: RequestUser },
    @Param('orderId') orderId: string,
  ) {
    await this.assertOrderOwnership(request.user, orderId);
    return this.orderService.summary({ orderId });
  }

  @Patch(':orderId/passengers')
  async updatePassengers(
    @Req() request: { user?: RequestUser },
    @Param('orderId') orderId: string,
    @Body() payload: UpdateOrderPassengersRequest,
  ) {
    await this.assertOrderOwnership(request.user, orderId);
    return this.orderService.updatePassengers({ orderId, payload });
  }

  @Patch(':orderId/seat-labels')
  async updateSeatLabels(
    @Req() request: { user?: RequestUser },
    @Param('orderId') orderId: string,
    @Body() payload: UpdateOrderSeatLabelsRequest,
  ) {
    await this.assertOrderOwnership(request.user, orderId);
    return this.orderService.updateSeatLabels({ orderId, payload });
  }

  @Post(':orderId/mark-pending-payment')
  async markPendingPayment(
    @Req() request: { user?: RequestUser },
    @Param('orderId') orderId: string,
  ) {
    await this.assertOrderOwnership(request.user, orderId);
    return this.orderService.markPendingPayment({ orderId });
  }

  @Post(':orderId/mark-paid')
  async markPaid(
    @Req() request: { user?: RequestUser },
    @Param('orderId') orderId: string,
  ) {
    await this.assertOrderOwnership(request.user, orderId);
    return this.orderService.markPaid({ orderId });
  }

  @Post(':orderId/confirm')
  @Roles(UserRole.ADMIN)
  confirm(@Param('orderId') orderId: string) {
    return this.orderService.confirm({ orderId });
  }

  @Post(':orderId/issue-ticket')
  @Roles(UserRole.ADMIN)
  issueTicket(@Param('orderId') orderId: string) {
    return this.orderService.issueTicket({ orderId });
  }

  @Post(':orderId/cancel')
  async cancel(
    @Req() request: { user?: RequestUser },
    @Param('orderId') orderId: string,
    @Body() payload?: CancelOrderRequest,
  ) {
    await this.assertOrderOwnership(request.user, orderId);
    return this.orderService.cancelWorkflow({ orderId, payload });
  }

  @Post(':orderId/expire')
  @Roles(UserRole.ADMIN)
  expire(@Param('orderId') orderId: string) {
    return this.orderService.expire({ orderId });
  }

  @Post(':orderId/refund')
  @Roles(UserRole.ADMIN)
  refund(@Param('orderId') orderId: string) {
    return this.orderService.refund({ orderId });
  }

  @Delete(':orderId')
  @Roles(UserRole.ADMIN)
  remove(@Param('orderId') orderId: string) {
    return this.orderService.remove({ orderId });
  }

  /**
   * Kiểm tra user có quyền thao tác trên order này không.
   * - Admin: luôn cho phép
   * - User thường: chỉ cho phép nếu order.userId === user.userId
   */
  private async assertOrderOwnership(
    user: RequestUser | undefined,
    orderId: string,
  ): Promise<void> {
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin bypass ownership check
    if (user.role === UserRole.ADMIN) {
      return;
    }

    const order = (await firstValueFrom(
      this.orderService.findOne({ orderId }),
    )) as OrderResponse | null;

    if (!order) {
      throw new ForbiddenException('Order not found');
    }

    if (order.userId !== user.userId) {
      throw new ForbiddenException(
        'You do not have permission to access this order',
      );
    }
  }
}
