import {
  Catch,
  HttpException,
  Logger,
  RpcExceptionFilter,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';

interface ErrorResponse {
  status: number;
  message: unknown;
}

function isErrorRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Serializes NestJS exceptions thrown inside handlers into the
 * `{ status, message }` shape that api-gateway's AllExceptionsFilter maps back
 * to proper HTTP status codes (401/403/404/409/...).
 *
 * Anything that is NOT an HttpException deliberately keeps its message OUT of
 * the response: those are driver errors (Prisma, ioredis) whose text contains
 * table/column names, query fragments and source paths, and the gateway would
 * otherwise relay it verbatim to the HTTP caller. The detail is logged locally.
 *
 * `HttpException` messages are written by our own code and are safe to return —
 * they are what produces the useful 4xx messages the client relies on.
 */
@Catch()
export class MicroserviceExceptionFilter implements RpcExceptionFilter {
  private readonly logger = new Logger(MicroserviceExceptionFilter.name);

  catch(exception: unknown): Observable<ErrorResponse> {
    let errorResponse: ErrorResponse = {
      status: 500,
      message: 'Internal server error',
    };

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      const message = isErrorRecord(exceptionResponse)
        ? (exceptionResponse.message ?? exceptionResponse.error ?? exceptionResponse)
        : exceptionResponse;
      errorResponse = { status: exception.getStatus(), message };
    } else if (isErrorRecord(exception) && typeof exception.status === 'number') {
      errorResponse = {
        status: exception.status,
        message: exception.message ?? 'Microservice error',
      };
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled microservice exception: ${exception.message}`,
        exception.stack,
      );

      if (process.env.NODE_ENV !== 'production') {
        errorResponse.message = exception.message;
      }
    }

    return throwError(() => errorResponse);
  }
}
