import { Inject, Injectable, Logger } from '@nestjs/common';
import { Redis_Client, Redis_Replica_Clients } from './redis.constants';
import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  public readonly redlock: Redlock;
  private replicaIndex = 0;

  constructor(
    @Inject(Redis_Client) private readonly redis: Redis,
    @Inject(Redis_Replica_Clients)
    private readonly replicaClients: Redis[],
  ) {
    this.redlock = new Redlock([this.redis], {
      driftFactor: 0.01,
      retryCount: 0,
      retryDelay: 200,
      retryJitter: 200,
    });
  }

  // Lấy 1 replica client theo round-robin
  // Nếu không có replica client (standalone mode) thì fallback về master
  private getReplica(): Redis {
    if (!this.replicaClients || this.replicaClients.length === 0) {
      return this.redis; // fallback khi chạy standalone
    }
    const client = this.replicaClients[this.replicaIndex % this.replicaClients.length];
    this.replicaIndex = (this.replicaIndex + 1) % this.replicaClients.length;
    return client;
  }

  // READ: ưu tiên đọc từ replica (giảm tải master)
  async get(key: string): Promise<string | null> {
    const replica = this.getReplica();
    return replica.get(key);
  }

  // WRITE: luôn ghi vào master (vì replica có thể bị delay replication)
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

  // Expose master & replicas cho ai cần truy cập trực tiếp
  get master(): Redis {
    return this.redis;
  }

  get replicas(): Redis[] {
    return this.replicaClients;
  }
}

