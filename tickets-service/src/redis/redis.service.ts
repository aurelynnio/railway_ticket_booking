import { Inject, Injectable } from '@nestjs/common';
import { Redis_Client } from './redis.module';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService {
  constructor(@Inject(Redis_Client) private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<'OK' | null> {
    if (ttlSeconds) {
      return this.redis.set(key, value, 'EX', ttlSeconds);
    }
    return this.redis.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async patternDel(pattern: string): Promise<number> {
    let cursor = '0';
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );

      cursor = nextCursor;

      if (keys.length) {
        deletedCount += await this.redis.del(...keys);
      }
    } while (cursor !== '0');

    return deletedCount;
  }

  async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    const result = await this.redis.set(key, 'locked', 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<number> {
    return this.redis.del(key);
  }
}
