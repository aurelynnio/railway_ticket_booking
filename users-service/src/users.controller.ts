import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('health')
  health() {
    return this.usersService.health();
  }

  @Get()
  list() {
    return this.usersService.list();
  }

  @Get(':userId')
  profile(@Param('userId') userId: string) {
    return this.usersService.profile(userId);
  }
}
