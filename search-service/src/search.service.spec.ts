import type { PrismaClient } from '@prisma/client';
import { SearchService } from './search.service';

describe('SearchService', () => {
  it('reports its service health without accessing the database', () => {
    const service = new SearchService({} as PrismaClient);

    expect(service.health()).toEqual(
      expect.objectContaining({
        service: 'search-service',
        status: 'ok',
      }),
    );
  });
});
