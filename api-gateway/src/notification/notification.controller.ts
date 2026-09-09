import { Controller, Get, Query, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('my')
  async myNotifications(
    @Req() request: { user?: RequestUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = request.user?.userId ?? '';
    return this.notificationService.listByUser(
      userId,
      this.sanitizePage(page),
      this.sanitizeLimit(limit, 10),
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async listAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.notificationService.listAll(
      this.sanitizePage(page),
      this.sanitizeLimit(limit, 20),
      type,
    );
  }

  private sanitizePage(value?: string) {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }

  private sanitizeLimit(value?: string, fallback = 10, max = 50) {
    const parsed = Number.parseInt(value ?? '', 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      return fallback;
    }
    return Math.min(parsed, max);
  }
}
