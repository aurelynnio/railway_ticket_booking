import { Injectable, Logger } from '@nestjs/common';
import { and, count, desc, eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import { notifications } from '../drizzle/schema';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly drizzle: DrizzleService) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpIsPlaceholder = [smtpHost, smtpUser, smtpPass].some(
      (value) =>
        !value ||
        value.toLowerCase().includes('example.com') ||
        value.toLowerCase().startsWith('replace-with'),
    );

    if (!smtpIsPlaceholder) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log(
        `Nodemailer transporter initialized for host: ${smtpHost}`,
      );
    } else {
      this.logger.warn(
        'SMTP settings are missing. Emails will be persisted with skipped status.',
      );

      if (process.env.NODE_ENV === 'production') {
        throw new Error('SMTP settings must be configured in production');
      }
    }
  }

  private async sendAndPersist(
    data: { userId?: string; email: string; type: string },
    subject: string,
    text: string,
    html?: string,
  ) {
    const from = process.env.EMAIL_FROM || 'no-reply@railway-ticket.com';
    let status = 'sent';

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: data.email,
          subject,
          text,
          html: html || text.replace(/\n/g, '<br>'),
        });
        this.logger.log(
          `Email sent successfully to ${data.email} with subject: "${subject}"`,
        );
      } catch (error) {
        status = 'failed';
        this.logger.error(`Failed to send email to ${data.email}:`, error);
      }
    } else {
      status = 'skipped';
      this.logger.warn(
        `SMTP is not configured; skipped ${data.type} email for ${data.email}.`,
      );
    }

    try {
      await this.drizzle.db.insert(notifications).values({
        userId: data.userId || null,
        recipientEmail: data.email,
        type: data.type,
        subject,
        body: text,
        status,
      });
    } catch (error) {
      this.logger.error(
        `Failed to persist notification for ${data.email}:`,
        error,
      );
    }
  }

  async handleUserRegistered(data: {
    userId?: string;
    email: string;
    fullName: string;
  }) {
    const subject = 'Welcome to Railway Ticket Booking!';
    const text = `Hi ${data.fullName || 'User'},\n\nThank you for registering at Railway Ticket Booking. You can now search for train trips, reserve seats, and purchase tickets online.\n\nBest regards,\nRailway Ticket Booking Team`;
    await this.sendAndPersist(
      { userId: data.userId, email: data.email, type: 'user_registered' },
      subject,
      text,
    );
  }

  async handlePasswordReset(data: {
    userId?: string;
    email: string;
    token: string;
  }) {
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${data.token}&email=${encodeURIComponent(data.email)}`;
    const subject = 'Reset Your Password - Railway Ticket Booking';
    const text = `Hello,\n\nYou requested to reset your password. Please use the following link to reset your password:\n\n${resetUrl}\n\nThis link is valid for 10 minutes. If you did not request this, you can safely ignore this email.\n\nBest regards,\nRailway Ticket Booking Team`;
    await this.sendAndPersist(
      { userId: data.userId, email: data.email, type: 'password_reset' },
      subject,
      text,
    );
  }

  async handleEmailVerification(data: {
    userId?: string;
    email: string;
    fullName: string;
    token: string;
  }) {
    const subject = 'Verify Your Railway Ticket Booking Email';
    const text = `Hello ${data.fullName || 'User'},\n\nUse this verification token in your profile to verify your email address:\n\n${data.token}\n\nThis token expires in 24 hours. If you did not create this account, you can safely ignore this email.\n\nBest regards,\nRailway Ticket Booking Team`;
    await this.sendAndPersist(
      { userId: data.userId, email: data.email, type: 'email_verification' },
      subject,
      text,
    );
  }

  async handleOrderCreated(data: {
    userId?: string;
    email: string;
    orderId: string;
    totalPrice: number;
    trainNumber: string;
    seatLabels: string[];
  }) {
    const subject = `Order Pending Payment: #${data.orderId}`;
    const text = `Hello,\n\nYour order #${data.orderId} has been created successfully.\n\nDetails:\n- Train: ${data.trainNumber}\n- Seats: ${data.seatLabels.join(', ')}\n- Total Price: ${data.totalPrice} VND\n\nPlease complete your payment within 10 minutes to secure your reservation.\n\nBest regards,\nRailway Ticket Booking Team`;
    await this.sendAndPersist(
      { userId: data.userId, email: data.email, type: 'order_created' },
      subject,
      text,
    );
  }

  async handlePaymentPaid(data: {
    userId?: string;
    email: string;
    orderId: string;
    amount: number;
    ticketCode: string;
  }) {
    const subject = `Booking Confirmed: #${data.orderId}`;
    const text = `Hello,\n\nWe have received your payment of ${data.amount} VND for order #${data.orderId}.\n\nYour booking is confirmed! Your ticket code is: ${data.ticketCode}.\n\nPlease show this code at the station to board your train.\n\nThank you for choosing Railway Ticket Booking!\n\nBest regards,\nRailway Ticket Booking Team`;
    await this.sendAndPersist(
      { userId: data.userId, email: data.email, type: 'payment_paid' },
      subject,
      text,
    );
  }

  async handleOrderRefunded(data: {
    userId?: string;
    email: string;
    orderId: string;
    amount: number;
    trainNumber: string;
  }) {
    const subject = `Order Refunded: #${data.orderId}`;
    const text = `Hello,\n\nOrder #${data.orderId} (train ${data.trainNumber || 'N/A'}) has been refunded.\n\nRefunded amount: ${data.amount} VND.\n\nIf you have any questions about this refund, please contact our support team.\n\nBest regards,\nRailway Ticket Booking Team`;
    await this.sendAndPersist(
      { userId: data.userId, email: data.email, type: 'order_refunded' },
      subject,
      text,
    );
  }

  async listByUser(data: { userId: string; page?: number; limit?: number }) {
    const page = data.page ?? 1;
    const limit = Math.min(data.limit ?? 10, 50);
    const skip = (page - 1) * limit;
    const whereClause = eq(notifications.userId, data.userId);

    const [[{ total: totalCount }], rows] = await Promise.all([
      this.drizzle.db
        .select({ total: count() })
        .from(notifications)
        .where(whereClause),
      this.drizzle.db.query.notifications.findMany({
        where: whereClause,
        orderBy: [desc(notifications.createdAt)],
        offset: skip,
        limit,
      }),
    ]);
    const total = Number(totalCount);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async listAll(data: { page?: number; limit?: number; type?: string }) {
    const page = data.page ?? 1;
    const limit = Math.min(data.limit ?? 20, 100);
    const skip = (page - 1) * limit;
    const whereClause = data.type
      ? eq(notifications.type, data.type)
      : undefined;

    const [[{ total: totalCount }], rows] = await Promise.all([
      this.drizzle.db
        .select({ total: count() })
        .from(notifications)
        .where(whereClause),
      this.drizzle.db.query.notifications.findMany({
        where: whereClause,
        orderBy: [desc(notifications.createdAt)],
        offset: skip,
        limit,
      }),
    ]);
    const total = Number(totalCount);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(data: { notificationId: string; userId: string }) {
    const notification = await this.drizzle.db.query.notifications.findFirst({
      where: eq(notifications.id, data.notificationId),
    });
    if (
      !notification ||
      (notification.userId && notification.userId !== data.userId)
    ) {
      return {
        success: false,
        message: 'Notification not found or access denied',
      };
    }
    const now = new Date();
    const [updated] = await this.drizzle.db
      .update(notifications)
      .set({ isRead: true, readAt: now, updatedAt: now })
      .where(eq(notifications.id, data.notificationId))
      .returning();
    return { success: true, data: updated };
  }

  async markAllAsRead(data: { userId: string }) {
    const now = new Date();
    const updatedRows = await this.drizzle.db
      .update(notifications)
      .set({ isRead: true, readAt: now, updatedAt: now })
      .where(
        and(
          eq(notifications.userId, data.userId),
          eq(notifications.isRead, false),
        ),
      )
      .returning({ id: notifications.id });
    return { success: true, count: updatedRows.length };
  }

  async getUnreadCount(data: { userId: string }) {
    const [{ total }] = await this.drizzle.db
      .select({ total: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, data.userId),
          eq(notifications.isRead, false),
        ),
      );
    return { unreadCount: Number(total) };
  }

  async broadcastMarketing(data: {
    subject: string;
    body: string;
    voucherCode?: string;
    recipients?: Array<{ email: string; userId?: string }>;
    recipientEmails?: string[];
  }) {
    let bodyWithVoucher = data.body;
    if (data.voucherCode) {
      bodyWithVoucher += `\n\n🎉 Mã khuyến mãi: ${data.voucherCode}`;
    }

    let recipients: Array<{ email: string; userId?: string }> = [];
    if (data.recipients && data.recipients.length > 0) {
      recipients = data.recipients;
    } else if (data.recipientEmails && data.recipientEmails.length > 0) {
      recipients = data.recipientEmails.map((e) => ({
        email: e,
        userId: undefined,
      }));
    } else {
      const distinctRecipients = await this.drizzle.db
        .selectDistinctOn([notifications.recipientEmail], {
          recipientEmail: notifications.recipientEmail,
          userId: notifications.userId,
        })
        .from(notifications);
      recipients = distinctRecipients.map((r) => ({
        email: r.recipientEmail,
        userId: r.userId ?? undefined,
      }));
    }

    let createdCount = 0;
    for (const rec of recipients) {
      await this.sendAndPersist(
        { userId: rec.userId, email: rec.email, type: 'marketing_promotion' },
        data.subject,
        bodyWithVoucher,
      );
      createdCount++;
    }

    return { success: true, sentCount: createdCount };
  }
}
