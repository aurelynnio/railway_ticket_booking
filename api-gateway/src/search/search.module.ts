import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { TICKETS_QUEUE, DEAD_LETTER_QUEUE } from '../common/constants/queue.constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        // After merging search-service into tickets-service, all search
        // commands are handled by the tickets_service queue.
        name: 'search_service',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: TICKETS_QUEUE,
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
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
