import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UuidLikePipe } from '../common/pipes/uuid-like.pipe';
import { NotificationService } from './notification.service';
import { BroadcastMarketingRequest } from './notification.dto';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@ApiTags('Notifications')
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

  @Get('unread-count')
  async unreadCount(@Req() request: { user?: RequestUser }) {
    const userId = request.user?.userId ?? '';
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  async markRead(
    @Req() request: { user?: RequestUser },
    @Param('id', UuidLikePipe) id: string,
  ) {
    const userId = request.user?.userId ?? '';
    return this.notificationService.markRead(id, userId);
  }

  @Post('read-all')
  async markAllRead(@Req() request: { user?: RequestUser }) {
    const userId = request.user?.userId ?? '';
    return this.notificationService.markAllRead(userId);
  }

  @Post('admin/broadcast')
  @Roles(UserRole.ADMIN)
  async broadcastMarketing(@Body() body: BroadcastMarketingRequest) {
    return this.notificationService.broadcastMarketing(body);
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
