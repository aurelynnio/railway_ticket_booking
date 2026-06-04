import { Controller, Get, Inject, Post } from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserRequest,
  FindByEmailRequest,
  GetUserByIdRequest,
  UpdateUserRequest,
} from '../common/dto/user.dto';
import { UserProfile } from '../common/dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/list')
  list() {
    return this.userService.list();
  }

  @Get('/profile')
  profile(userId: UserProfile) {
    return this.userService.profile(userId);
  }

  @Post()
  create(payload: CreateUserRequest) {
    return this.userService.create(payload);
  }

  @Post('/update/:userId')
  update(data: UpdateUserRequest) {
    return this.userService.update(data);
  }

  @Get('/:userId')
  getUserById(userId: GetUserByIdRequest) {
    return this.userService.getUserById(userId);
  }

  @Get('/email')
  findByEmail(email: FindByEmailRequest) {
    return this.userService.findByEmail(email);
  }
}
