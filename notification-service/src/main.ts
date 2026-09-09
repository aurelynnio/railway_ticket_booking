import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { Transport } from '@nestjs/microservices';
import { RmqAckInterceptor } from './common/interceptors/rmq-ack.interceptor';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(NotificationModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'notifications_queue',
      noAck: false,
      queueOptions: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': 'railway_dead_letter_queue',
        },
      },
    },
  });
  app.useGlobalInterceptors(new RmqAckInterceptor());
  await app.listen();
}
void bootstrap();
