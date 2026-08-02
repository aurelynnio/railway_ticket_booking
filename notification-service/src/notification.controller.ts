import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('notification.user_registered')
  async handleUserRegistered(
    @Payload() data: { userId?: string; email: string; fullName: string },
  ) {
    await this.notificationService.handleUserRegistered(data);
  }

  @EventPattern('notification.password_reset')
  async handlePasswordReset(
    @Payload() data: { userId?: string; email: string; token: string },
  ) {
    await this.notificationService.handlePasswordReset(data);
  }

  @EventPattern('notification.order_created')
  async handleOrderCreated(
    @Payload()
    data: {
      userId?: string;
      email: string;
      orderId: string;
      totalPrice: number;
      trainNumber: string;
      seatLabels: string[];
    },
  ) {
    await this.notificationService.handleOrderCreated(data);
  }

  @EventPattern('notification.payment_paid')
  async handlePaymentPaid(
    @Payload()
    data: {
      userId?: string;
      email: string;
      orderId: string;
      amount: number;
      ticketCode: string;
    },
  ) {
    await this.notificationService.handlePaymentPaid(data);
  }

  @MessagePattern({ cmd: 'notifications.list_by_user' })
  async listByUser(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    return this.notificationService.listByUser(data);
  }

  @MessagePattern({ cmd: 'notifications.list_all' })
  async listAll(
    @Payload() data: { page?: number; limit?: number; type?: string },
  ) {
    return this.notificationService.listAll(data);
  }
}
