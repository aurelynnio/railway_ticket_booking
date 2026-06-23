import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { TicketModule } from './ticket/ticket.module';
import { UserModule } from './user/user.module';
import { PaymentModule } from './payment/payment.module';
import { OrderModule } from './order/order.module';
import { SearchModule } from './search/search.module';
import { JwtAuthGuard } from './common/guards/jwt.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    TicketModule,
    UserModule,
    PaymentModule,
    OrderModule,
    SearchModule,
  ],
  providers: [
    // Thứ tự guard: Throttler → JwtAuth → Roles
    // 1. Rate limit trước (chống brute-force)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 2. Auth: kiểm tra JWT token, bypass nếu có @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 3. Authorization: kiểm tra @Roles(), bypass nếu không có @Roles()
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class ApiGatewayModule {}
