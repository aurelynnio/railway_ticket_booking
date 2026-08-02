import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

function isErrorRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    console.error('Caught exception in Gateway AllExceptionsFilter:', exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: unknown = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = isErrorRecord(exceptionResponse)
        ? (exceptionResponse.message ?? exceptionResponse.error)
        : exceptionResponse;
    } else if (isErrorRecord(exception) && typeof exception.status === 'number' && exception.status >= 400 && exception.status < 600) {
      status = exception.status;
      message = exception.response ?? exception.message ?? 'Microservice error';
    } else if (isErrorRecord(exception) && typeof exception.statusCode === 'number' && exception.statusCode >= 400 && exception.statusCode < 600) {
      status = exception.statusCode;
      message = exception.message ?? 'Microservice error';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
