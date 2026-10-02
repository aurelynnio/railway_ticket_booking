import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './utils/generate-token.utils';
import { NOTIFICATIONS_QUEUE, DEAD_LETTER_QUEUE } from '../common/constants/queue.constants';
import { describeWeakJwtSecret } from '../common/utils/secret-strength.utils';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not configured');
        }

        // Placeholder-shaped secrets are rejected in EVERY environment, not just
        // production: shipping a repo-visible secret would let anyone forge a
        // token for any account whose userId/email is known (the seed script
        // publishes an admin's UUID, for example).
        const problem = describeWeakJwtSecret(secret);
        if (problem) {
          throw new Error(`JWT_SECRET is not acceptable: ${problem}`);
        }

        return {
          secret,
        };
      },
    }),
    ClientsModule.register([
      {
        name: 'notification_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: NOTIFICATIONS_QUEUE,
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': '',
              'x-dead-letter-routing-key': DEAD_LETTER_QUEUE,
            },
          },
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService],
})
export class AuthModule {}
