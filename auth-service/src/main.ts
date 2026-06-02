import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AuthModule, {
    transport: Transport.TCP,
    options: {
      host: process.env.HOST ?? 'localhost',
      port: Number(process.env.PORT ?? 3001),
    },
  });

  await app.listen();
}
void bootstrap();
