import Redis from 'ioredis';
import { RedisCacheService } from './redis.service';

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let redis: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    scan: jest.Mock;
  };

  beforeEach(() => {
    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      scan: jest.fn(),
    };

    service = new RedisCacheService(redis as unknown as Redis);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('set should forward ttl writes with EX', async () => {
    redis.set.mockResolvedValue('OK');

    const result = await service.set('tickets:1', 'value', 300);

    expect(redis.set).toHaveBeenCalledWith('tickets:1', 'value', 'EX', 300);
    expect(result).toBe('OK');
  });

  it('set should write without ttl when no ttl is provided', async () => {
    redis.set.mockResolvedValue('OK');

    const result = await service.set('tickets:1', 'value');

    expect(redis.set).toHaveBeenCalledWith('tickets:1', 'value');
    expect(result).toBe('OK');
  });

  it('patternDel should scan until cursor 0 and accumulate deleted keys', async () => {
    redis.scan
      .mockResolvedValueOnce(['1', ['tickets:1', 'tickets:2']])
      .mockResolvedValueOnce(['0', ['tickets:3']]);
    redis.del.mockResolvedValueOnce(2).mockResolvedValueOnce(1);

    const deleted = await service.patternDel('tickets:*');

    expect(redis.scan).toHaveBeenNthCalledWith(
      1,
      '0',
      'MATCH',
      'tickets:*',
      'COUNT',
      100,
    );
    expect(redis.scan).toHaveBeenNthCalledWith(
      2,
      '1',
      'MATCH',
      'tickets:*',
      'COUNT',
      100,
    );
    expect(redis.del).toHaveBeenNthCalledWith(1, 'tickets:1', 'tickets:2');
    expect(redis.del).toHaveBeenNthCalledWith(2, 'tickets:3');
    expect(deleted).toBe(3);
  });

  it('patternDel should skip delete calls when a scan page is empty', async () => {
    redis.scan.mockResolvedValue(['0', []]);

    const deleted = await service.patternDel('tickets:*');

    expect(redis.del).not.toHaveBeenCalled();
    expect(deleted).toBe(0);
  });

  it('acquireLock should return true when redis set returns OK', async () => {
    redis.set.mockResolvedValue('OK');
    const result = await service.acquireLock('my-lock', 5000);
    expect(redis.set).toHaveBeenCalledWith('my-lock', 'locked', 'PX', 5000, 'NX');
    expect(result).toBe(true);
  });

  it('acquireLock should return false when redis set returns null', async () => {
    redis.set.mockResolvedValue(null);
    const result = await service.acquireLock('my-lock', 5000);
    expect(result).toBe(false);
  });

  it('releaseLock should call del and return key delete count', async () => {
    redis.del.mockResolvedValue(1);
    const result = await service.releaseLock('my-lock');
    expect(redis.del).toHaveBeenCalledWith('my-lock');
    expect(result).toBe(1);
  });
});
