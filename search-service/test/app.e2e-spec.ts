import { Test } from '@nestjs/testing';
import { SearchModule } from '../src/search.module';

describe('SearchModule (e2e)', () => {
  it('should compile the root module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [SearchModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
