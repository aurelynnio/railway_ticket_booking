import { Test } from '@nestjs/testing';
import { ApiGatewayModule } from '../src/api-gateway.module';

describe('ApiGatewayModule (e2e)', () => {
  it('should compile the root module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ApiGatewayModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
