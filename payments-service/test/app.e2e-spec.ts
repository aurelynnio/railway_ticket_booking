import { Test } from '@nestjs/testing';
import { PaymentsModule } from '../src/payments.module';

describe('PaymentsModule (e2e)', () => {
  it('should compile the root module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PaymentsModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
