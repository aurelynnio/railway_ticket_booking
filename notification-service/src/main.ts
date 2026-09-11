import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification/notification.module';
import { Transport } from '@nestjs/microservices';
import { MicroserviceExceptionFilter } from './common/filters/microservice-exception.filter';
import { RmqAckInterceptor } from './common/interceptors/rmq-ack.interceptor';
import { NOTIFICATIONS_QUEUE, DEAD_LETTER_QUEUE } from './common/constants/queue.constants';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(NotificationModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: NOTIFICATIONS_QUEUE,
      noAck: false,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': DEAD_LETTER_QUEUE,
        },
      },
    },
  });
  app.useGlobalFilters(new MicroserviceExceptionFilter());
  app.useGlobalInterceptors(new RmqAckInterceptor());
  await app.listen();
}
void bootstrap();
