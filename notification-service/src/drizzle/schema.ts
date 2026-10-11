import { randomUUID } from 'node:crypto';
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id')
      .defaultRandom()
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    userId: uuid('user_id'),
    recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
    type: varchar('type', { length: 80 }).notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    body: text('body').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('sent'),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at', { precision: 3, mode: 'date' }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('notifications_user_id_idx').on(table.userId),
    index('notifications_user_id_is_read_idx').on(table.userId, table.isRead),
    index('notifications_type_idx').on(table.type),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

