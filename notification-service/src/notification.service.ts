import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly prisma: PrismaClient) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
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
        'SMTP settings are missing. Emails will be logged to console instead.',
      );
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
      this.logger.log(`
========================================
[MOCK EMAIL DISPATCHED]
From: ${from}
To: ${data.email}
Subject: ${subject}
----------------------------------------
${text}
========================================
`);
    }

    try {
      await this.prisma.notification.create({
        data: {
          userId: data.userId || null,
          recipientEmail: data.email,
          type: data.type,
          subject,
          body: text,
          status,
        },
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

  async listByUser(data: { userId: string; page?: number; limit?: number }) {
    const page = data.page ?? 1;
    const limit = Math.min(data.limit ?? 10, 50);
    const skip = (page - 1) * limit;

    const [total, notifications] = await Promise.all([
      this.prisma.notification.count({ where: { userId: data.userId } }),
      this.prisma.notification.findMany({
        where: { userId: data.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: notifications,
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
    const where = data.type ? { type: data.type } : {};

    const [total, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }
}
