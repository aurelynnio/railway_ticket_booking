import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TicketModule } from './ticket/ticket.module';
import { UserModule } from './user/user.module';
import { PaymentModule } from './payment/payment.module';
import { OrderModule } from './order/order.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    AuthModule,
    TicketModule,
    UserModule,
    PaymentModule,
    OrderModule,
    SearchModule,
  ],
})
export class ApiGatewayModule {}
