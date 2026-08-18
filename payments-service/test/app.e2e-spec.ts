import { Test } from '@nestjs/testing';
import { PaymentModule } from '../src/payment.module';

describe('PaymentModule (e2e)', () => {
  it('should compile the root module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PaymentModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
