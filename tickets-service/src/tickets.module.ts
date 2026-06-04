import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, PrismaClient],
})
export class TicketsModule {}
