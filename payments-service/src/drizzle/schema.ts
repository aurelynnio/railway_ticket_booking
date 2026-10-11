import { randomUUID } from 'node:crypto';
import {
  pgTable,
  uuid,
  varchar,
  bigint,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const payments = pgTable(
  'payments',
  {
    id: uuid('id')
      .defaultRandom()
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    orderId: uuid('order_id').notNull(),
    userId: uuid('user_id'),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    paymentMethod: varchar('payment_method', { length: 36 }).notNull(),
    status: integer('status').notNull().default(0),
    transactionId: uuid('transaction_id').notNull().unique(),
    paidAt: timestamp('paid_at', { precision: 3, mode: 'date' }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { precision: 3, mode: 'date' }),
  },
  (table) => [
    index('payments_order_id_idx').on(table.orderId),
    index('payments_user_id_idx').on(table.userId),
    index('payments_status_idx').on(table.status),
  ],
);

export const paymentOutbox = pgTable(
  'payment_outbox',
  {
    id: uuid('id')
      .defaultRandom()
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    paymentId: uuid('payment_id').notNull(),
    orderId: uuid('order_id').notNull(),
    userId: uuid('user_id'),
    transactionId: uuid('transaction_id').notNull(),
    paidAt: timestamp('paid_at', { precision: 3, mode: 'date' }).notNull(),
    status: integer('status').notNull().default(0),
    attemptCount: integer('attempt_count').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$defaultFn(() => new Date()),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$defaultFn(() => new Date()),
    processedAt: timestamp('processed_at', { precision: 3, mode: 'date' }),
  },
  (table) => [
    index('payment_outbox_status_next_attempt_at_idx').on(
      table.status,
      table.nextAttemptAt,
    ),
  ],
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentOutbox = typeof paymentOutbox.$inferSelect;
export type NewPaymentOutbox = typeof paymentOutbox.$inferInsert;

