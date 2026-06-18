import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CheckoutSagaOrchestrator } from './checkout-saga.orchestrator';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: 'payment_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'payments_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
      {
        name: 'ticket_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'tickets_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaClient, CheckoutSagaOrchestrator],
})
export class OrdersModule {}
