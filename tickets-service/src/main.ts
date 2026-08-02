import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TicketsModule } from './tickets.module';
import { Transport } from '@nestjs/microservices';

import { MicroserviceExceptionFilter } from './common/filter/microservice-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(TicketsModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'tickets_queue',
      queueOptions: {
        durable: false,
      },
    },
  });
  app.useGlobalFilters(new MicroserviceExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.listen();
}
void bootstrap();
