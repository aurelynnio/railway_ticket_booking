jest.mock('./ticket.service', () => ({
  TicketService: class TicketService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

describe('TicketController', () => {
  let controller: TicketController;

  const ticketsService = {
    health: jest.fn(() => 'ok'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        {
          provide: TicketService,
          useValue: ticketsService,
        },
      ],
    }).compile();

    controller = module.get<TicketController>(TicketController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return the health status', () => {
    expect(controller.health()).toBe('ok');
    expect(ticketsService.health).toHaveBeenCalledTimes(1);
  });
});
