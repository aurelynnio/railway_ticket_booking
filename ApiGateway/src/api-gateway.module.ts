import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [AuthModule, TicketModule],
})
export class ApiGatewayModule {}
