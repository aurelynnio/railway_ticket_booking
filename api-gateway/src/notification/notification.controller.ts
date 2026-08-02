import { Controller, Get, Query, Req } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Roles, UserRole } from '../common/decorator/roles.decorator';
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
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
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
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      type,
    );
  }
}
