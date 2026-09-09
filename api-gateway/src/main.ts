import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateApiGatewayRuntimeConfig } from './config/runtime-config';

async function bootstrap() {
  validateApiGatewayRuntimeConfig();
  const app = await NestFactory.create(ApiGatewayModule);
  // Behind nginx, honor the X-Forwarded-For hop so ThrottlerGuard rate-limits
  // the real client IP instead of the reverse proxy address.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const port = Number(process.env.PORT ?? 8080);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  app.use(cookieParser());

  await app.listen(port);
  new Logger('ApiGateway').log(`Running at http://localhost:${port}`);
}
void bootstrap();
