import { randomUUID } from 'node:crypto';
import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const authAccounts = pgTable('auth_accounts', {
  id: uuid('id')
    .defaultRandom()
    .$defaultFn(() => randomUUID())
    .primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  role: integer('role').notNull().default(0),
  emailVerified: boolean('email_verified').notNull().default(false),
  tokenVersion: integer('token_version').notNull().default(0),
  googleId: varchar('google_id', { length: 255 }).unique(),
  avatar: varchar('avatar', { length: 2048 }),
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
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id')
    .defaultRandom()
    .$defaultFn(() => randomUUID())
    .primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => authAccounts.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { precision: 3, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' })
    .notNull()
    .defaultNow()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
    .notNull()
    .defaultNow()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id')
    .defaultRandom()
    .$defaultFn(() => randomUUID())
    .primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => authAccounts.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { precision: 3, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' })
    .notNull()
    .defaultNow()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
    .notNull()
    .defaultNow()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id')
    .defaultRandom()
    .$defaultFn(() => randomUUID())
    .primaryKey(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  revokedAt: timestamp('revoked_at', { precision: 3, mode: 'date' }),
  expiresAt: timestamp('expires_at', { precision: 3, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' })
    .notNull()
    .defaultNow()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
    .notNull()
    .defaultNow()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const authAccountsRelations = relations(authAccounts, ({ one }) => ({
  passwordResetToken: one(passwordResetTokens, {
    fields: [authAccounts.id],
    references: [passwordResetTokens.userId],
  }),
  emailVerificationToken: one(emailVerificationTokens, {
    fields: [authAccounts.id],
    references: [emailVerificationTokens.userId],
  }),
}));

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    authAccount: one(authAccounts, {
      fields: [passwordResetTokens.userId],
      references: [authAccounts.id],
    }),
  }),
);

export const emailVerificationTokensRelations = relations(
  emailVerificationTokens,
  ({ one }) => ({
    authAccount: one(authAccounts, {
      fields: [emailVerificationTokens.userId],
      references: [authAccounts.id],
    }),
  }),
);

export type AuthAccount = typeof authAccounts.$inferSelect;
export type NewAuthAccount = typeof authAccounts.$inferInsert;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
