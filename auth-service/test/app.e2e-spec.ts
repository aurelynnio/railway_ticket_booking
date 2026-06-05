process.env.JWT_SECRET ??= 'test-secret';

import { Test } from '@nestjs/testing';
import { AuthModule } from '../src/auth.module';

describe('AuthModule (e2e)', () => {
  it('should compile the root module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
