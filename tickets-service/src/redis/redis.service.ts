import { Inject, Injectable } from '@nestjs/common';
import { Redis_Client } from './redis.module';
import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';

@Injectable()
export class RedisCacheService {
  public readonly redlock: Redlock;

  constructor(@Inject(Redis_Client) private readonly redis: Redis) {
    this.redlock = new Redlock([this.redis], {
      driftFactor: 0.01,
      retryCount: 0,
      retryDelay: 200,
      retryJitter: 200,
    });
  }

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

  async acquireLock(
    key: string,
    ttlMs: number,
    retryCount = 0,
    retryDelay = 50,
  ): Promise<Lock | null> {
    try {
      return await this.redlock.acquire([key], ttlMs, {
        retryCount,
        retryDelay,
        retryJitter: 0,
      });
    } catch (err) {
      return null;
    }
  }

  async releaseLock(lock: Lock): Promise<void> {
    await lock.release();
  }
}

