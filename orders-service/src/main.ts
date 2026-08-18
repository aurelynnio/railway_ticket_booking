import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { Transport } from '@nestjs/microservices';
import { RmqAckInterceptor } from './rmq-ack.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(OrderModule);

  app.useGlobalInterceptors(new RmqAckInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'orders_queue',
      noAck: false,
      prefetchCount: 1,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': 'railway_dead_letter_queue',
        },
      },
    },
  }, { inheritAppConfig: true });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'orders_expired_process_queue',
      noAck: false,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': 'railway_dead_letter_queue',
        },
      },
    },
  }, { inheritAppConfig: true });

  await app.startAllMicroservices();
  await app.init();
  Logger.log('OrderService microservices started', 'Bootstrap');
}
void bootstrap();
