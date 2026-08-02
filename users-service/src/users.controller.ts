import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

type CreateUserPayload = {
  username: string;
  email: string;
  password: string;
  name?: string;
  role?: number;
};

type UpdateUserPayload = {
  username?: string;
  email?: string;
  name?: string;
  role?: number;
};

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'users.health' })
  health() {
    return this.usersService.health();
  }

  @MessagePattern({ cmd: 'users.list' })
  list(@Payload() query: { page?: number; limit?: number }) {
    return this.usersService.list(query);
  }

  @MessagePattern({ cmd: 'users.profile' })
  profile(@Payload() data: { userId: string }) {
    const { userId } = data;
    return this.usersService.profile(userId);
  }

  @MessagePattern({ cmd: 'users.update' })
  update(@Payload() data: { userId: string; payload: UpdateUserPayload }) {
    const { userId, payload } = data;
    return this.usersService.update(userId, payload);
  }

  @MessagePattern({ cmd: 'users.find_by_email' })
  findByEmail(@Payload() data: { email: string }) {
    const { email } = data;
    return this.usersService.findByEmail(email);
  }

  @MessagePattern({ cmd: 'users.get_by_id' })
  getUserById(@Payload() data: { userId: string }) {
    const { userId } = data;
    return this.usersService.getUserById(userId);
  }

  @MessagePattern({ cmd: 'users.create' })
  create(@Payload() data: { payload: CreateUserPayload }) {
    const { payload } = data;
    return this.usersService.create(payload);
  }

  @MessagePattern({ cmd: 'users.delete' })
  remove(@Payload() data: { userId: string }) {
    const { userId } = data;
    return this.usersService.delete(userId);
  }
}
