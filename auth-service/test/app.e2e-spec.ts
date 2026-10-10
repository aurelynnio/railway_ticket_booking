// Compliant, obviously-fake test secret. auth-service's own secret-strength
// guard (common/utils/secret-strength.utils.ts) rejects anything shorter than
// 32 characters or with fewer than 12 distinct characters, so the previous
// 'test-secret' value made this spec fail before it could check the very thing
// it exists to check (that the root module still compiles).
process.env.JWT_SECRET ??= 'e2e-test-only-jwt-secret-0123456789abcdef';

import { Test } from '@nestjs/testing';
import { AuthModule } from '../src/auth/auth.module';

describe('AuthModule (e2e)', () => {
  it('should compile the root module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
