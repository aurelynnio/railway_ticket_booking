import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { UserService } from '../user/user.service';

export interface NotificationListResponse {
  data: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class NotificationService {
  constructor(
    @Inject('notification_service') private readonly notificationClient: ClientProxy,
    private readonly userService: UserService,
  ) {}

  async listByUser(userId: string, page = 1, limit = 10): Promise<NotificationListResponse> {
    return lastValueFrom<NotificationListResponse>(
      this.notificationClient.send<NotificationListResponse>(
        { cmd: 'notifications.list_by_user' },
        { userId, page, limit },
      ),
    );
  }

  async listAll(page = 1, limit = 20, type?: string): Promise<NotificationListResponse> {
    return lastValueFrom<NotificationListResponse>(
      this.notificationClient.send<NotificationListResponse>(
        { cmd: 'notifications.list_all' },
        { page, limit, type },
      ),
    );
  }

  async markRead(notificationId: string, userId: string): Promise<unknown> {
    return lastValueFrom(
      this.notificationClient.send(
        { cmd: 'notifications.mark_read' },
        { notificationId, userId },
      ),
    );
  }

  async markAllRead(userId: string): Promise<unknown> {
    return lastValueFrom(
      this.notificationClient.send(
        { cmd: 'notifications.mark_all_read' },
        { userId },
      ),
    );
  }

  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    return lastValueFrom<{ unreadCount: number }>(
      this.notificationClient.send(
        { cmd: 'notifications.unread_count' },
        { userId },
      ),
    );
  }

  async broadcastMarketing(data: {
    subject: string;
    body: string;
    voucherCode?: string;
    recipientEmails?: string[];
  }): Promise<unknown> {
    let recipients: Array<{ email: string; userId?: string }> | undefined;
    if (!data.recipientEmails || data.recipientEmails.length === 0) {
      try {
        const usersRes = await lastValueFrom<any>(this.userService.list({ limit: 1000 }));
        const users = Array.isArray(usersRes) ? usersRes : usersRes?.data || [];
        if (users.length > 0) {
          recipients = users.map((u: any) => ({
            email: u.email,
            userId: u.id,
          }));
        }
      } catch (err) {
        // Continue with empty recipients if list fails
      }
    } else {
      recipients = data.recipientEmails.map((e) => ({ email: e }));
    }

    return lastValueFrom(
      this.notificationClient.send(
        { cmd: 'notifications.broadcast_marketing' },
        {
          ...data,
          recipients,
        },
      ),
    );
  }
}
