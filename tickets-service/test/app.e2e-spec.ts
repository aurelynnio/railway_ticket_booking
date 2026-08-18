jest.mock('../src/ticket.service', () => ({
  TicketService: class TicketService {},
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: class PrismaClient {},
}));

import { Test } from '@nestjs/testing';
import { TicketModule } from '../src/ticket.module';

describe('TicketModule (e2e)', () => {
  it('should compile the root module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TicketModule],
    }).compile();

    expect(moduleRef).toBeDefined();
  });
});
