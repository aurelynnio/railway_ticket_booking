import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { OrdersModule } from './orders.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(OrdersModule);

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'orders_queue',
      noAck: true,
      prefetchCount: 1,
      queueOptions: {
        durable: false,
        arguments: {
          'x-dead-letter-exchange': 'orders_dead_letter_exchange',
          'x-dead-letter-routing-key': 'orders_dead_letter_queue',
        },
      },
    },
  });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'orders_expired_process_queue',
      noAck: true,
      queueOptions: {
        durable: false,
      },
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.startAllMicroservices();
  await app.init();
  console.log('OrdersService microservices started');
}
void bootstrap();
