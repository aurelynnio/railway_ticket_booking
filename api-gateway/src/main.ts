import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway.module';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateApiGatewayRuntimeConfig } from './config/runtime-config';
import { ACCESS_TOKEN_COOKIE_NAME } from './auth/auth.constants';

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

  const configuredOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!requestOrigin) return callback(null, true);

      const isAllowed = configuredOrigins.some((allowed) => {
        if (allowed === '*' || allowed === requestOrigin) return true;
        try {
          const allowedHost = new URL(allowed).host;
          const reqHost = new URL(requestOrigin).host;
          return (
            reqHost === allowedHost ||
            reqHost === `www.${allowedHost}` ||
            `www.${reqHost}` === allowedHost
          );
        } catch {
          return false;
        }
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${requestOrigin}`));
      }
    },
    credentials: true,
  });

  app.use(cookieParser());

  // Swagger/OpenAPI: mặc định chỉ bật ngoài production (Dockerfile đặt NODE_ENV=production).
  // Đặt ENABLE_SWAGGER=true để bật tường minh, ví dụ khi demo full stack Docker.
  // Path là 'docs' (không phải 'api/docs') vì nginx đã strip tiền tố /api:
  //   http://localhost/api/docs (qua nginx) -> http://api-gateway:8080/docs
  const swaggerEnabled = process.env.ENABLE_SWAGGER
    ? process.env.ENABLE_SWAGGER === 'true'
    : process.env.NODE_ENV !== 'production';

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Railway Ticket Booking API')
      .setDescription(
        'HTTP surface cua api-gateway: auth, users, search, tickets, orders, payments, vouchers, notifications.',
      )
      .setVersion('1.0')
      // Auth bằng cookie HttpOnly accessToken (mặc định của gateway) hoặc Bearer token
      .addCookieAuth(ACCESS_TOKEN_COOKIE_NAME)
      .addBearerAuth()
      .build();

    SwaggerModule.setup(
      'docs',
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
      { swaggerOptions: { persistAuthorization: true } },
    );

    new Logger('ApiGateway').log(
      `Swagger UI: http://localhost:${port}/docs (qua nginx: /api/docs)`,
    );
  }

  await app.listen(port);
  new Logger('ApiGateway').log(`Running at http://localhost:${port}`);
}
void bootstrap();
