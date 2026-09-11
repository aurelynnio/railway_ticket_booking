import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order/order.module';
import * as QUEUES from './common/constants/queue.constants';
import { Transport } from '@nestjs/microservices';
import { MicroserviceExceptionFilter } from './common/filters/microservice-exception.filter';
import { RmqAckInterceptor } from './common/interceptors/rmq-ack.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(OrderModule);

  app.useGlobalFilters(new MicroserviceExceptionFilter());

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
      queue: QUEUES.QUEUE_ORDERS,
      noAck: false,
      prefetchCount: 1,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': QUEUES.QUEUE_RAILWAY_DEAD_LETTER,
        },
      },
    },
  }, { inheritAppConfig: true });

  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: QUEUES.QUEUE_ORDERS_EXPIRED_PROCESS,
      noAck: false,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': QUEUES.QUEUE_RAILWAY_DEAD_LETTER,
        },
      },
    },
  }, { inheritAppConfig: true });

  await app.startAllMicroservices();
  await app.init();
  Logger.log('OrderService microservices started', 'Bootstrap');
}
void bootstrap();

