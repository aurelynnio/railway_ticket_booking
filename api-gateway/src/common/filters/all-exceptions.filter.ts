import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractMessage(response: unknown): unknown {
  if (isRecord(response)) {
    return response.message ?? response.error;
  }
  return response;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: unknown = 'Internal server error';
    /** Full detail for the server log only — never sent to the client on 5xx. */
    let internalDetail: string | undefined;
    let internalStack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = extractMessage(exception.getResponse());
    } else if (
      isRecord(exception) &&
      typeof exception.status === 'number' &&
      exception.status >= 400 &&
      exception.status < 600
    ) {
      // Error forwarded from a microservice as { status, message }.
      status = exception.status;
      const body = isRecord(exception.response) ? exception.response : undefined;
      message =
        (body && (body.message ?? body.error)) ??
        (typeof exception.message === 'string'
          ? exception.message
          : 'Microservice error');
    } else if (
      isRecord(exception) &&
      typeof exception.statusCode === 'number' &&
      exception.statusCode >= 400 &&
      exception.statusCode < 600
    ) {
      status = exception.statusCode;
      message =
        typeof exception.message === 'string'
          ? exception.message
          : 'Microservice error';
    } else if (exception instanceof Error) {
      internalDetail = exception.message;
      internalStack = exception.stack;
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // 4xx messages are intentional business messages written by our own
      // services, so they pass through. 5xx messages are NOT: a microservice
      // forwards raw Error/Prisma text (table and column names, query
      // fragments, file paths), so in production the client gets a generic
      // message while the detail goes to the log.
      this.logger.error(
        `Request failed with status ${status}: ${
          internalDetail ?? String(message)
        }`,
        internalStack,
      );

      if (process.env.NODE_ENV === 'production') {
        message = 'Internal server error';
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
