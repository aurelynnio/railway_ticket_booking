import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

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
}
