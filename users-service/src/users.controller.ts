import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('users.health')
  health() {
    return this.usersService.health();
  }

  @MessagePattern('users.list')
  list() {
    return this.usersService.list();
  }

  @MessagePattern('users.profile')
  profile(@Param('userId') userId: string) {
    return this.usersService.profile(userId);
  }

  @MessagePattern('users.update')
  update(@Param('userId') userId: string, @Body() payload: any) {
    return this.usersService.update(userId, payload);
  }

  @MessagePattern('users.find_by_email')
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @MessagePattern('users.get_by_id')
  getUserById(@Param('userId') userId: string) {
    return this.usersService.getUserById(userId);
  }

  @MessagePattern('users.create')
  create(@Body() payload: any) {
    return this.usersService.create(payload);
  }
}
