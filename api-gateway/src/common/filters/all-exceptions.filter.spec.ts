import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let response: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let host: ArgumentsHost;

  const buildHost = () => {
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    host = {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;
    return { response, host };
  };

  const originalNodeEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('should return the status and message of an HttpException', () => {
    const { response } = buildHost();
    const error = new BadRequestException('invalid input');

    filter = new AllExceptionsFilter();
    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'invalid input',
    });
  });

  it('should pass through a microservice error status and message', () => {
    const { response } = buildHost();
    const error = Object.assign(new Error('order not found'), {
      status: HttpStatus.NOT_FOUND,
      response: { statusCode: HttpStatus.NOT_FOUND, message: 'order not found' },
    });

    filter = new AllExceptionsFilter();
    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'order not found',
    });
  });

  it('should not leak the internal error message in production', () => {
    const { response } = buildHost();
    process.env.NODE_ENV = 'production';
    const error = new Error('secret db credentials leaked');

    filter = new AllExceptionsFilter();
    filter.catch(error, host);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });

  it('should expose the error message in non-production for debuggability', () => {
    const { response } = buildHost();
    process.env.NODE_ENV = 'development';
    const error = new Error('some internal detail');

    filter = new AllExceptionsFilter();
    filter.catch(error, host);

    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'some internal detail',
    });
  });
});
