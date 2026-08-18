import { Test } from '@nestjs/testing';
import { OrderModule } from '../src/order.module';

describe('OrderModule (e2e)', () => {
  it('should compile the root module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [OrderModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
