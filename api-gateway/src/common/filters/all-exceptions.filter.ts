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

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = extractMessage(exception.getResponse());
    } else if (
      isRecord(exception) &&
      typeof exception.status === 'number' &&
      exception.status >= 400 &&
      exception.status < 600
    ) {
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
      // Never leak internal error details to the client in production.
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`Request failed with status ${status}: ${String(message)}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
