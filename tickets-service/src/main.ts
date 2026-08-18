import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TicketModule } from './ticket.module';
import { Transport } from '@nestjs/microservices';

import { MicroserviceExceptionFilter } from './common/filter/microservice-exception.filter';
import { RmqAckInterceptor } from './rmq-ack.interceptor';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(TicketModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'tickets_queue',
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
