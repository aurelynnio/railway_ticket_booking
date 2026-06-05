jest.mock('../src/tickets.service', () => ({
  TicketsService: class TicketsService {},
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
}));

import { Test } from '@nestjs/testing';
import { TicketsModule } from '../src/tickets.module';

describe('TicketsModule (e2e)', () => {
  it('should compile the root module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TicketsModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
