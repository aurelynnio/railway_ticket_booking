import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  const port = Number(process.env.PORT ?? 3000);

  app.enableCors({
    origin: '*',
    Credential: true,
  });

  await app.listen(port);
  console.log(`ApiGateway running at http://localhost:${port}`);
}
void bootstrap();
