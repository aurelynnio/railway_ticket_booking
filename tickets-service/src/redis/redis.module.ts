import {
  Global,
  Module,
  Logger,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { Redis_Client, Redis_Replica_Clients } from './redis.constants';
import { RedisCacheService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: Redis_Client,
      useFactory: (): Redis => {
        const logger = new Logger('RedisModule');
        const sentinelsEnv = process.env.REDIS_SENTINELS; // e.g. "sentinel1:26379,sentinel2:26379"
        const masterName = process.env.REDIS_SENTINEL_NAME || 'mymaster';
        const redisPassword = process.env.REDIS_PASSWORD;
        const sentinelPassword = process.env.REDIS_SENTINEL_PASSWORD;
        const db = parseInt(process.env.REDIS_DB as string) || 0;
        // Cấu hình chung cho cả hai chế độ (Sentinel & Standalone)
        const commonOptions: RedisOptions = {
          password: redisPassword,
          db,
          connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT as string) || 10000,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
          retryStrategy: (times: number) => {
            // Retry với delay tăng dần: 50ms, 100ms, 200ms... tối đa 2000ms
            const delay = Math.min(times * 50, 2000);
            logger.warn(`Redis reconnect attempt #${times}, retrying in ${delay}ms`);
            return delay;
          },
          reconnectOnError: (err) => {
            const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
            return targetErrors.some((e) => err.message.includes(e));
          },
        };

        if (sentinelsEnv) {
          // Chế độ Sentinel: tự động failover giữa các master/replica
          const sentinels = sentinelsEnv.split(',').map((s) => {
            const [host, port] = s.trim().split(':');
            return { host, port: parseInt(port) || 26379 };
          });

          logger.log(
            `Connecting to Redis via Sentinel [${masterName}] with ${sentinels.length} sentinels`,
          );

          const client = new Redis({
            ...commonOptions,
            sentinels,
            name: masterName,
            sentinelPassword,
            // Khi gọi .read() sẽ route tới replica ngẫu nhiên
            preferredSlaves: undefined,
            enableOfflineQueue: true,
          });

          client.on('connect', () => logger.log('Redis Sentinel master connected'));
          client.on('ready', () => logger.log('Redis master ready'));
          client.on('error', (err) => logger.error('Redis master error', err.stack));
          client.on('close', () => logger.warn('Redis master connection closed'));
          client.on('reconnecting', (ms: number) =>
            logger.warn(`Redis master reconnecting in ${ms}ms`),
          );
          client.on('+switch-master', (data) =>
            logger.warn(`Sentinel switched master: ${JSON.stringify(data)}`),
          );

          return client;
        }

        // Chế độ Standalone (không dùng Sentinel)
        const host = process.env.REDIS_HOST || 'localhost';
        const port = parseInt(process.env.REDIS_PORT as string) || 6379;
        logger.log(`Connecting to Redis Standalone at ${host}:${port}`);

        const client = new Redis({
          ...commonOptions,
          host,
          port,
        });

        client.on('connect', () => logger.log('Redis connected'));
        client.on('error', (err) => logger.error('Redis error', err.stack));

        return client;
      },
    },
    // Tạo N replica clients (mặc định 2) để tách tải đọc
    {
      provide: Redis_Replica_Clients,
      useFactory: (): Redis[] => {
        const logger = new Logger('RedisReplicaClients');
        const sentinelsEnv = process.env.REDIS_SENTINELS;
        const masterName = process.env.REDIS_SENTINEL_NAME || 'mymaster';
        const redisPassword = process.env.REDIS_PASSWORD;
        const sentinelPassword = process.env.REDIS_SENTINEL_PASSWORD;
        const db = parseInt(process.env.REDIS_DB as string) || 0;
        const replicaCount = parseInt(process.env.REDIS_REPLICA_COUNT as string) || 2;

        // Nếu không có Sentinel, fallback về master (vì standalone không có replica)
        if (!sentinelsEnv) {
          logger.warn(
            'No REDIS_SENTINELS configured. Replica clients will reuse master (standalone mode).',
          );
          // Trả về mảng rỗng, service sẽ fallback về master client
          return [];
        }

        const sentinels = sentinelsEnv.split(',').map((s) => {
          const [host, port] = s.trim().split(':');
          return { host, port: parseInt(port) || 26379 };
        });

        const commonOptions: RedisOptions = {
          password: redisPassword,
          db,
          connectTimeout: 10000,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: false,
          retryStrategy: (times: number) => Math.min(times * 50, 2000),
          reconnectOnError: (err) =>
            ['READONLY', 'ECONNRESET', 'ETIMEDOUT'].some((e) =>
              err.message.includes(e),
            ),
        };

        // Tạo replicaCount client, mỗi client pin vào 1 replica index cố định
        // Khi replica chết, ioredis sẽ tự lấy replica khác qua Sentinel
        const replicas: Redis[] = Array.from({ length: replicaCount }, (_, index) => {
          const client = new Redis({
            ...commonOptions,
            sentinels,
            name: masterName,
            sentinelPassword,
            // Pin replica theo index: client 0 → replica[0], client 1 → replica[1]
            // Nếu replica đó chết hoặc không có replica, fallback thay vì crash app
            preferredSlaves: (slaves) => {
              if (!slaves || slaves.length === 0) {
                // Không có replica → trả về null để ioredis dùng master
                logger.warn(
                  `Replica client #${index + 1}: no replicas available, falling back to master`,
                );
                return null;
              }
              return slaves[index % slaves.length];
            },
            enableOfflineQueue: true,
          });

          const clientId = index + 1;
          client.on('connect', () =>
            logger.log(`Replica client #${clientId} connected`),
          );
          client.on('ready', () =>
            logger.log(`Replica client #${clientId} ready`),
          );
          client.on('error', (err) =>
            logger.error(`Replica client #${clientId} error`, err.stack),
          );
          client.on('close', () =>
            logger.warn(`Replica client #${clientId} closed`),
          );

          return client;
        });

        logger.log(`Created ${replicas.length} replica clients`);
        return replicas;
      },
    },
    RedisCacheService,
  ],
  exports: [Redis_Client, Redis_Replica_Clients, RedisCacheService],
})
export class RedisModule implements OnModuleDestroy {
  private readonly logger = new Logger('RedisModule');

  constructor(
    @Inject(Redis_Client) private readonly master: Redis,
    @Inject(Redis_Replica_Clients) private readonly replicas: Redis[],
  ) {}

  async onModuleDestroy() {
    this.logger.log('Disconnecting Redis clients on module destroy...');
    const disconnects: Promise<void>[] = [
      this.master.quit().then(() => undefined).catch(() => undefined),
      ...this.replicas.map((r) =>
        r.quit().then(() => undefined).catch(() => undefined),
      ),
    ];
    await Promise.all(disconnects);
    this.logger.log('All Redis clients disconnected');
  }
}

