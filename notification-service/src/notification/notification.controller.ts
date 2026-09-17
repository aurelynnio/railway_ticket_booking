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

  @EventPattern('notification.email_verification')
  async handleEmailVerification(
    @Payload()
    data: {
      userId?: string;
      email: string;
      fullName: string;
      token: string;
    },
  ) {
    await this.notificationService.handleEmailVerification(data);
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

  @EventPattern('notification.order_refunded')
  async handleOrderRefunded(
    @Payload()
    data: {
      userId?: string;
      email: string;
      orderId: string;
      amount: number;
      trainNumber: string;
    },
  ) {
    await this.notificationService.handleOrderRefunded(data);
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

  @MessagePattern({ cmd: 'notifications.mark_read' })
  async markRead(
    @Payload() data: { notificationId: string; userId: string },
  ) {
    return this.notificationService.markAsRead(data);
  }

  @MessagePattern({ cmd: 'notifications.mark_all_read' })
  async markAllRead(@Payload() data: { userId: string }) {
    return this.notificationService.markAllAsRead(data);
  }

  @MessagePattern({ cmd: 'notifications.unread_count' })
  async unreadCount(@Payload() data: { userId: string }) {
    return this.notificationService.getUnreadCount(data);
  }

  @MessagePattern({ cmd: 'notifications.broadcast_marketing' })
  async broadcastMarketing(
    @Payload()
    data: {
      subject: string;
      body: string;
      voucherCode?: string;
      recipientEmails?: string[];
    },
  ) {
    return this.notificationService.broadcastMarketing(data);
  }
}
