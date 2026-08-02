import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: 'order_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'orders_queue',
          queueOptions: {
            durable: false,
            arguments: {
              'x-dead-letter-exchange': 'orders_dead_letter_exchange',
              'x-dead-letter-routing-key': 'orders_dead_letter_queue',
            },
          },
        },
      },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaClient],
})
export class PaymentsModule {}
