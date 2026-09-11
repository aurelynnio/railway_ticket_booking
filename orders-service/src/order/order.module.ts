import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from '../prisma/prisma.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import * as QUEUES from '../common/constants/queue.constants';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ClientsModule.register([
      {
        name: 'payment_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: QUEUES.QUEUE_PAYMENTS,
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': '',
              'x-dead-letter-routing-key': QUEUES.QUEUE_RAILWAY_DEAD_LETTER,
            },
          },
        },
      },
      {
        name: 'ticket_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: QUEUES.QUEUE_TICKETS,
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': '',
              'x-dead-letter-routing-key': QUEUES.QUEUE_RAILWAY_DEAD_LETTER,
            },
          },
        },
      },
      {
        name: 'orders_expiration_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: QUEUES.QUEUE_ORDERS_EXPIRATION,
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': '',
              'x-dead-letter-routing-key': QUEUES.QUEUE_ORDERS_EXPIRED_PROCESS,
              'x-message-ttl': parseInt(process.env.ORDER_EXPIRATION_TTL_MS || QUEUES.ORDER_EXPIRATION_TTL_MS_DEFAULT, 10),
            },
          },
        },
      },
      {
        name: 'notification_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: QUEUES.QUEUE_NOTIFICATIONS,
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': '',
              'x-dead-letter-routing-key': QUEUES.QUEUE_RAILWAY_DEAD_LETTER,
            },
          },
        },
      },
      {
        // users-service was merged into auth-service, so user lookups now
        // go to the auth queue (the users.get_by_id command lives there).
        name: 'users_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: QUEUES.QUEUE_AUTH,
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': '',
              'x-dead-letter-routing-key': QUEUES.QUEUE_RAILWAY_DEAD_LETTER,
            },
          },
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}


