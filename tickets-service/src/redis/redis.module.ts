import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

export const Redis_Client = 'Redis_Client';

@Global()
@Module({
  providers: [
    {
      provide: Redis_Client,
      useFactory: () => {
        const sentinelsEnv = process.env.REDIS_SENTINELS; // e.g. "sentinel1:26379,sentinel2:26379"
        const masterName = process.env.REDIS_SENTINEL_NAME || 'mymaster';

        if (sentinelsEnv) {
          const sentinels = sentinelsEnv.split(',').map((s) => {
            const [host, port] = s.trim().split(':');
            return { host, port: parseInt(port) || 26379 };
          });

          return new Redis({
            sentinels,
            name: masterName,
          });
        }

        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT as string) || 6379,
        });
      },
    },
  ],
  exports: [Redis_Client],
})
export class RedisModule {}

