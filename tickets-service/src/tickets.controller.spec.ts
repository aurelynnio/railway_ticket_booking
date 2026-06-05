jest.mock('./tickets.service', () => ({
  TicketsService: class TicketsService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

describe('TicketsController', () => {
  let controller: TicketsController;

  const ticketsService = {
    health: jest.fn(() => 'ok'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: ticketsService,
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
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
