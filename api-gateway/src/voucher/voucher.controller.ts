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
import { ApiTags } from '@nestjs/swagger';
import { UuidLikePipe } from '../common/pipes/uuid-like.pipe';
import { VoucherService } from './voucher.service';
import {
  CreateVoucherRequest,
  ListVouchersQuery,
  UpdateVoucherRequest,
  ValidateVoucherRequest,
} from './voucher.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import type { RequestUser } from '../common/interfaces/request-user.interface';

@ApiTags('Vouchers')
@Controller()
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post('vouchers/validate')
  @Public()
  // Public + tells the caller whether a code exists, so it is an enumeration
  // surface. Rate-limit it hard; the client only needs a few attempts.
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  validateVoucher(
    @Body() payload: ValidateVoucherRequest,
    @Req() request: { user?: RequestUser },
  ) {
    // Only ever use the authenticated caller's id. Accepting a client-supplied
    // `userId` on a public endpoint let a caller present someone else's identity
    // to dodge per-customer voucher limits and to probe another user's usage.
    // The authoritative per-user check happens in orders-service from the JWT.
    return this.voucherService.validateVoucher({
      ...payload,
      userId: request.user?.userId,
    });
  }

  @Get('vouchers/available')
  @Public()
  listAvailable() {
    return this.voucherService.listAvailable();
  }

  @Get('admin/vouchers')
  @Roles(UserRole.ADMIN)
  adminList(@Query() query: ListVouchersQuery) {
    return this.voucherService.adminList(query);
  }

  @Post('admin/vouchers')
  @Roles(UserRole.ADMIN)
  adminCreate(@Body() payload: CreateVoucherRequest) {
    return this.voucherService.adminCreate(payload);
  }

  @Patch('admin/vouchers/:id')
  @Roles(UserRole.ADMIN)
  adminUpdate(
    @Param('id', UuidLikePipe) id: string,
    @Body() payload: UpdateVoucherRequest,
  ) {
    return this.voucherService.adminUpdate(id, payload);
  }

  @Delete('admin/vouchers/:id')
  @Roles(UserRole.ADMIN)
  adminDelete(@Param('id', UuidLikePipe) id: string) {
    return this.voucherService.adminDelete(id);
  }
}

