import { Test } from '@nestjs/testing';
import { UsersModule } from '../src/users.module';

describe('UsersModule (e2e)', () => {
  it('should compile the root module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
