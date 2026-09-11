import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ORDERS_QUEUE, RAILWAY_DEAD_LETTER_QUEUE } from '../common/constants/queue.constants';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: 'order_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: ORDERS_QUEUE,
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': '',
              'x-dead-letter-routing-key': RAILWAY_DEAD_LETTER_QUEUE,
            },
          },
        },
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
