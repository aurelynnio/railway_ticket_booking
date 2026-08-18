import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
  ],
  controllers: [TicketController],
  providers: [TicketService, PrismaClient],
})
export class TicketModule {}
