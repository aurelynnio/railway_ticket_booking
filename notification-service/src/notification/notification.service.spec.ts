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

  it('redacts password reset token and verification token from persisted notification body', async () => {
    const rawResetToken = 'super-secret-reset-token-12345';
    await service.handlePasswordReset({
      userId: '4e6d33c3-889d-41f5-9503-2169fe7c133d',
      email: 'alice@example.com',
      token: rawResetToken,
    });

    const [passwordResetCall] = insertValuesSpy.mock.calls[0];
    expect(passwordResetCall.type).toBe('password_reset');
    expect(passwordResetCall.body).not.toContain(rawResetToken);
    expect(passwordResetCall.body).not.toContain('reset-password?token=');
    expect(passwordResetCall.body).toContain('A reset link has been sent to your email address');

    insertValuesSpy.mockClear();

    const rawVerificationToken = 'verify-token-xyz-987';
    await service.handleEmailVerification({
      userId: '4e6d33c3-889d-41f5-9503-2169fe7c133d',
      email: 'alice@example.com',
      fullName: 'Alice',
      token: rawVerificationToken,
    });

    const [verificationCall] = insertValuesSpy.mock.calls[0];
    expect(verificationCall.type).toBe('email_verification');
    expect(verificationCall.body).not.toContain(rawVerificationToken);
    expect(verificationCall.body).toContain('A verification email with your verification code has been sent');
  });

  it('sanitizes secret-bearing notification bodies in listByUser', async () => {
    const drizzle = {
      db: {
        select: jest.fn(() => ({
          from: jest.fn(() => ({
            where: jest.fn().mockResolvedValue([{ total: 1 }]),
          })),
        })),
        query: {
          notifications: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: '1',
                userId: 'user-1',
                type: 'password_reset',
                body: 'Hello, http://localhost:3000/reset-password?token=exposed-secret-token',
                recipientEmail: 'user@example.com',
                subject: 'Reset Password',
                status: 'sent',
                createdAt: new Date(),
              },
            ]),
          },
        },
      },
    };

    const notificationService = new NotificationService(drizzle as unknown as DrizzleService);
    const result = await notificationService.listByUser({ userId: 'user-1' });

    expect(result.data[0].body).not.toContain('exposed-secret-token');
    expect(result.data[0].body).toContain('A reset link has been sent to your email address');
  });
});
