import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway.module';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateApiGatewayRuntimeConfig } from './config/runtime-config';
import { ACCESS_TOKEN_COOKIE_NAME } from './auth/auth.constants';

/**
 * Number of trusted reverse-proxy hops, from `TRUST_PROXY` (default 1 = nginx).
 * `false` disables proxy trust entirely, which is the right setting when the
 * gateway is exposed directly.
 */
function resolveTrustProxyHops(): number | false {
  const raw = process.env.TRUST_PROXY?.trim();
  if (raw === undefined || raw === '') return 1;
  if (raw === 'false') return false;

  const hops = Number(raw);
  if (!Number.isInteger(hops) || hops < 0) {
    throw new Error(
      `TRUST_PROXY must be a non-negative integer or "false" (got "${raw}")`,
    );
  }
  return hops;
}

/**
 * Allows an exact origin match, or the `www.`/non-`www.` variant of the SAME
 * scheme. Comparing host only (the previous behaviour) would also accept
 * `http://` for an `https://` allow-list entry, which downgrades a
 * credential-bearing cross-origin request to plaintext.
 */
function isAllowedOrigin(
  requestOrigin: string,
  configuredOrigins: string[],
): boolean {
  const normalizedRequest = requestOrigin
    .trim()
    .replace(/\/+$/, '')
    .toLowerCase();

  return configuredOrigins.some((allowed) => {
    const normalizedAllowed = allowed.toLowerCase();
    if (normalizedAllowed === normalizedRequest) return true;

    try {
      const allowedUrl = new URL(normalizedAllowed);
      const requestUrl = new URL(normalizedRequest);
      if (allowedUrl.protocol !== requestUrl.protocol) return false;

      const allowedHost = allowedUrl.host;
      const requestHost = requestUrl.host;
      return (
        requestHost === `www.${allowedHost}` ||
        `www.${requestHost}` === allowedHost
      );
    } catch {
      return false;
    }
  });
}

async function bootstrap() {
  validateApiGatewayRuntimeConfig();
  const app = await NestFactory.create(ApiGatewayModule);
  // Behind nginx, honor the X-Forwarded-For hop so ThrottlerGuard rate-limits
  // the real client IP instead of the reverse proxy address.
  //
  // SECURITY: this only works if the gateway is NOT directly reachable. When a
  // client can hit the gateway without passing through the trusted proxy, it can
  // send any X-Forwarded-For value and pick its own rate-limit bucket, which
  // defeats login brute-force protection. Compose therefore binds the port to
  // loopback only. Keep the hop count in sync with the real proxy chain.
  app.getHttpAdapter().getInstance().set('trust proxy', resolveTrustProxyHops());
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
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter((o) => o.length > 0);

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // No Origin header: same-origin/cross-site form posts and non-browser
      // clients. Cookie auth is still enforced, and browsers always send Origin
      // on cross-site state-changing requests, so this cannot be used for CSRF.
      if (!requestOrigin) return callback(null, true);

      if (isAllowedOrigin(requestOrigin, configuredOrigins)) {
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
