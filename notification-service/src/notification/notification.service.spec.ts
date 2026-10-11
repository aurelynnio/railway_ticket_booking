import { DrizzleService } from '../drizzle/drizzle.service';
import { notifications } from '../drizzle/schema';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const originalSmtpHost = process.env.SMTP_HOST;
  const originalSmtpUser = process.env.SMTP_USER;
  const originalSmtpPass = process.env.SMTP_PASS;
  let service: NotificationService;
  let insertValuesSpy: jest.Mock<
    Promise<unknown>,
    [
      {
        userId: string | null;
        recipientEmail: string;
        type: string;
        subject: string;
        body: string;
        status: string;
      },
    ]
  >;
  let insertSpy: jest.Mock;

  beforeEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    insertValuesSpy = jest.fn().mockResolvedValue([]);
    insertSpy = jest.fn(() => ({ values: insertValuesSpy }));
    const drizzle = {
      db: {
        insert: insertSpy,
      },
    };
    service = new NotificationService(drizzle as unknown as DrizzleService);
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

    expect(insertSpy).toHaveBeenCalledWith(notifications);
    const [createArgs] = insertValuesSpy.mock.calls[0];

    expect(createArgs.userId).toBe('4e6d33c3-889d-41f5-9503-2169fe7c133d');
    expect(createArgs.recipientEmail).toBe('alice@example.com');
    expect(createArgs.type).toBe('user_registered');
    expect(createArgs.subject).toBe('Welcome to Railway Ticket Booking!');
    expect(createArgs.status).toBe('skipped');
  });
});
