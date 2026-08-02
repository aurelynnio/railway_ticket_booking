import type { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const originalSmtpHost = process.env.SMTP_HOST;
  const originalSmtpUser = process.env.SMTP_USER;
  const originalSmtpPass = process.env.SMTP_PASS;
  let service: NotificationService;
  let prisma: {
    notification: {
      create: jest.Mock<
        Promise<unknown>,
        [
          {
            data: {
              userId: string | null;
              recipientEmail: string;
              type: string;
              subject: string;
              body: string;
              status: string;
            };
          },
        ]
      >;
    };
  };

  beforeEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    prisma = {
      notification: {
        create: jest
          .fn<
            Promise<unknown>,
            [
              {
                data: {
                  userId: string | null;
                  recipientEmail: string;
                  type: string;
                  subject: string;
                  body: string;
                  status: string;
                };
              },
            ]
          >()
          .mockResolvedValue({}),
      },
    };
    service = new NotificationService(prisma as unknown as PrismaClient);
  });

  afterAll(() => {
    process.env.SMTP_HOST = originalSmtpHost;
    process.env.SMTP_USER = originalSmtpUser;
    process.env.SMTP_PASS = originalSmtpPass;
  });

  it('persists a registration notification when SMTP is not configured', async () => {
    await service.handleUserRegistered({
      userId: '4e6d33c3-889d-41f5-9503-2169fe7c133d',
      email: 'alice@example.com',
      fullName: 'Alice',
    });

    const [createArgs] = prisma.notification.create.mock.calls[0];

    expect(createArgs.data.userId).toBe('4e6d33c3-889d-41f5-9503-2169fe7c133d');
    expect(createArgs.data.recipientEmail).toBe('alice@example.com');
    expect(createArgs.data.type).toBe('user_registered');
    expect(createArgs.data.subject).toBe('Welcome to Railway Ticket Booking!');
    expect(createArgs.data.status).toBe('sent');
  });
});
