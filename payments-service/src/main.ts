import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment/payment.module';
import { Transport } from '@nestjs/microservices';
import { MicroserviceExceptionFilter } from './common/filters/microservice-exception.filter';
import { RmqAckInterceptor } from './common/interceptors/rmq-ack.interceptor';
import { PAYMENTS_QUEUE, RAILWAY_DEAD_LETTER_QUEUE } from './common/constants/queue.constants';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(PaymentModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: PAYMENTS_QUEUE,
      noAck: false,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': RAILWAY_DEAD_LETTER_QUEUE,
        },
      },
    },
  });
  app.useGlobalFilters(new MicroserviceExceptionFilter());
  app.useGlobalInterceptors(new RmqAckInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.listen();
}
void bootstrap();
