import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiGatewayService {
  health() {
    return {
      service: 'api-gateway',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
