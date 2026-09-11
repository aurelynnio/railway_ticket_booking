import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_QUEUE, DEAD_LETTER_QUEUE } from '../common/constants/queue.constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        // After merging users-service into auth-service, all user commands
        // are handled by the auth_service queue.
        name: 'user_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: AUTH_QUEUE,
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
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
