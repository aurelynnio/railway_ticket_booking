import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserRequest,
  FindByEmailRequest,
  ListUsersQuery,
  UpdateProfilePayload,
  UpdateUserPayload,
} from '../common/dto/user.dto';
import { Public } from '../common/decorator/public.decorator';
import { Roles, UserRole } from '../common/decorator/roles.decorator';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('health')
  @Public()
  health() {
    return this.userService.health();
  }

  @Get()
  @Roles(UserRole.ADMIN)
  list(@Query() query: ListUsersQuery) {
    return this.userService.list(query);
  }

  @Get('me')
  profile(@Req() request: { user?: RequestUser }) {
    return this.userService.profile({ userId: request.user?.userId ?? '' });
  }

  @Patch('me')
  updateMe(
    @Req() request: { user?: RequestUser },
    @Body() payload: UpdateProfilePayload,
  ) {
    return this.userService.update({
      userId: request.user?.userId ?? '',
      payload,
    });
  }

  @Get('by-email')
  @Roles(UserRole.ADMIN)
  findByEmail(@Query() email: FindByEmailRequest) {
    return this.userService.findByEmail(email);
  }

  @Get(':userId')
  @Roles(UserRole.ADMIN)
  getUserById(@Param('userId') userId: string) {
    return this.userService.getUserById({ userId });
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() payload: CreateUserRequest) {
    return this.userService.create(payload);
  }

  @Patch(':userId')
  @Roles(UserRole.ADMIN)
  update(
    @Param('userId') userId: string,
    @Body() payload: UpdateUserPayload,
  ) {
    return this.userService.update({ userId, payload });
  }

  @Delete(':userId')
  @Roles(UserRole.ADMIN)
  remove(@Param('userId') userId: string) {
    return this.userService.remove({ userId });
  }
}
