import { Global, Module } from '@nestjs/common';

import Redis from 'ioredis';

export const Redis_Client = 'Redis_Client';

@Global()
@Module({
  providers: [
    {
      provide: Redis_Client,
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT as string) || 6379,
        });
      },
    },
  ],
  exports: [Redis_Client],
})
export class CachingModule {}
