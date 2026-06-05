import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TicketModule } from './ticket/ticket.module';
import { UserModule } from './user/user.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [AuthModule, TicketModule, UserModule, PaymentModule],
})
export class ApiGatewayModule {}
