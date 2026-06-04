import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiGatewayService {
  health() {
    return {
      service: 'ApiGateway',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
