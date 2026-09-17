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
import type { RequestUser } from '../common/interfaces/request-user.interface';

@ApiTags('Vouchers')
@Controller()
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post('vouchers/validate')
  @Public()
  validateVoucher(
    @Body() payload: ValidateVoucherRequest,
    @Req() request: { user?: RequestUser },
  ) {
    if (!payload.userId && request.user?.userId) {
      payload.userId = request.user.userId;
    }
    return this.voucherService.validateVoucher(payload);
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

