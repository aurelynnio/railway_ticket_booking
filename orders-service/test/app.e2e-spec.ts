import { Test } from '@nestjs/testing';
import { OrdersModule } from '../src/orders.module';

describe('OrdersModule (e2e)', () => {
  it('should compile the root module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [OrdersModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
