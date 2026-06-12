import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserRequest,
  FindByEmailRequest,
  ListUsersQuery,
} from '../common/dto/user.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  list(@Query() query: ListUsersQuery) {
    return this.userService.list(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  profile(@Req() request: { user?: { id?: string; userId?: string } }) {
    const resolvedUserId = request.user?.id ?? request.user?.userId;

    return this.userService.profile({ userId: resolvedUserId ?? '' });
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
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
  findByEmail(@Query() email: FindByEmailRequest) {
    return this.userService.findByEmail(email);
  }

  @Get(':userId')
  getUserById(@Param('userId') userId: string) {
    return this.userService.getUserById({ userId });
  }

  @Post()
  create(@Body() payload: CreateUserRequest) {
    return this.userService.create(payload);
  }

  @Patch(':userId')
  update(
    @Param('userId') userId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.userService.update({ userId, payload });
  }
}
