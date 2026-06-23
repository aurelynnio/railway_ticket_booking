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
import { UserService } from './user.service';
import {
  CreateUserRequest,
  FindByEmailRequest,
  ListUsersQuery,
} from '../common/dto/user.dto';
import { Roles, UserRole } from '../common/decorator/roles.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  list(@Query() query: ListUsersQuery) {
    return this.userService.list(query);
  }

  @Get('me')
  profile(@Req() request: { user?: { id?: string; userId?: string } }) {
    const resolvedUserId = request.user?.id ?? request.user?.userId;

    return this.userService.profile({ userId: resolvedUserId ?? '' });
  }

  @Patch('me')
  updateMe(
    @Req() request: { user?: { id?: string; userId?: string } },
    @Body() payload: Record<string, unknown>,
  ) {
    const resolvedUserId = request.user?.id ?? request.user?.userId;

    return this.userService.update({
      userId: resolvedUserId ?? '',
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
    @Body() payload: Record<string, unknown>,
  ) {
    return this.userService.update({ userId, payload });
  }
}
