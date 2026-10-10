jest.mock('../src/ticket/ticket.service', () => ({
  TicketService: class TicketService {},
}));

jest.mock('@prisma/client', () => ({
  // PrismaService calls $connect() on init and $disconnect() on destroy, so the
  // stub must expose both. A bare empty class made the destroy hook throw
  // ("this.$disconnect is not a function"), which aborted teardown before
  // RedisModule could quit its clients — leaving the process hanging.
  PrismaClient: class PrismaClient {
    async $connect(): Promise<void> {}
    async $disconnect(): Promise<void> {}
  },
}));

import { Test } from '@nestjs/testing';
import { TicketModule } from '../src/ticket/ticket.module';

describe('TicketModule (e2e)', () => {
  it('should compile the root module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TicketModule],
    }).compile();

    expect(moduleRef).toBeDefined();

    // TicketModule pulls in RedisModule, whose factories open real ioredis
    // clients with an infinite retryStrategy. Those handles keep the event loop
    // alive, so without closing the module jest never exits and `npm run
    // test:e2e` hangs forever (it had to be killed manually). close() runs
    // RedisModule.onModuleDestroy, which quits every client.
    await moduleRef.close();
  });
});
