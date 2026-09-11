import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import type { ChannelWrapper } from 'amqp-connection-manager';
import type { Message } from 'amqplib';
import { from, Observable, throwError } from 'rxjs';
import { catchError, mergeMap, tap } from 'rxjs/operators';
import { DEAD_LETTER_QUEUE } from '../constants/queue.constants';

@Injectable()
export class RmqAckInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const rmqContext = context.switchToRpc().getContext<RmqContext>();
    const channel = rmqContext.getChannelRef() as ChannelWrapper;
    const message = rmqContext.getMessage() as Message;

    return next.handle().pipe(
      tap({ complete: () => channel.ack(message) }),
      catchError((error: unknown) =>
        from(channel.assertQueue(DEAD_LETTER_QUEUE, { durable: true })).pipe(
          mergeMap(() => {
            channel.nack(message, false, false);
            return throwError(() => error);
          }),
        ),
      ),
    );
  }
}

