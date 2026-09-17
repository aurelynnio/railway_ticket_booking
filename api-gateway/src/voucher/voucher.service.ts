import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  CreateVoucherRequest,
  ListVouchersQuery,
  UpdateVoucherRequest,
  ValidateVoucherRequest,
} from './voucher.dto';

@Injectable()
export class VoucherService {
  constructor(
    @Inject('order_service') private readonly orderClient: ClientProxy,
  ) {}

  async validateVoucher(payload: ValidateVoucherRequest): Promise<unknown> {
    return lastValueFrom(
      this.orderClient.send('vouchers.validate', payload),
    );
  }

  async listAvailable(): Promise<unknown> {
    return lastValueFrom(
      this.orderClient.send('vouchers.list_available', {}),
    );
  }

  async adminList(query: ListVouchersQuery): Promise<unknown> {
    return lastValueFrom(
      this.orderClient.send('vouchers.admin_list', query),
    );
  }

  async adminCreate(payload: CreateVoucherRequest): Promise<unknown> {
    return lastValueFrom(
      this.orderClient.send('vouchers.admin_create', payload),
    );
  }

  async adminUpdate(
    id: string,
    payload: UpdateVoucherRequest,
  ): Promise<unknown> {
    return lastValueFrom(
      this.orderClient.send('vouchers.admin_update', { id, payload }),
    );
  }

  async adminDelete(id: string): Promise<unknown> {
    return lastValueFrom(
      this.orderClient.send('vouchers.admin_delete', { id }),
    );
  }
}

