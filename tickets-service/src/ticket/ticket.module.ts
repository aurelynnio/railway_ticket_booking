import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    DrizzleModule,
  ],
  controllers: [TicketController],
  providers: [TicketService],
})
export class TicketModule {}
