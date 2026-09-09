import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, lastValueFrom, of, throwError } from 'rxjs';
import { RmqAckInterceptor } from './rmq-ack.interceptor';

describe('RmqAckInterceptor', () => {
  const message = { fields: { deliveryTag: 1 } };
  const channel = {
    ack: jest.fn(),
    nack: jest.fn(),
    assertQueue: jest.fn().mockResolvedValue({}),
  };
  const context = {
    switchToRpc: () => ({
      getContext: () => ({
        getChannelRef: () => channel,
        getMessage: () => message,
      }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    channel.assertQueue.mockResolvedValue({});
  });

  it('acknowledges a message after its handler completes', async () => {
    const interceptor = new RmqAckInterceptor();
    const next = { handle: () => of('done') } as CallHandler;

    await expect(lastValueFrom(interceptor.intercept(context, next))).resolves.toBe(
      'done',
    );

    expect(channel.ack).toHaveBeenCalledWith(message);
    expect(channel.nack).not.toHaveBeenCalled();
  });

  it('dead-letters a message when its handler fails', async () => {
    const interceptor = new RmqAckInterceptor();
    const next = {
      handle: () => throwError(() => new Error('handler failed')),
    } as CallHandler;

    await expect(firstValueFrom(interceptor.intercept(context, next))).rejects.toThrow(
      'handler failed',
    );

    expect(channel.assertQueue).toHaveBeenCalledWith('railway_dead_letter_queue', {
      durable: true,
    });
    expect(channel.nack).toHaveBeenCalledWith(message, false, false);
  });
});

