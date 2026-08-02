import { Catch, HttpException, RpcExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';

interface ErrorResponse {
  status: number;
  message: unknown;
}

function isErrorRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Catch()
export class MicroserviceExceptionFilter implements RpcExceptionFilter {
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
      errorResponse.message = exception.message;
    }

    return throwError(() => errorResponse);
  }
}
