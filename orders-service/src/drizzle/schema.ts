import { randomUUID } from 'node:crypto';
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  primaryKey,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const vouchers = pgTable(
  'vouchers',
  {
    id: uuid('id')
      .defaultRandom()
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    code: varchar('code', { length: 32 }).notNull().unique(),
    title: varchar('title', { length: 120 }).notNull(),
    description: text('description'),
    discountType: varchar('discount_type', { length: 20 }).notNull(),
    discountValue: bigint('discount_value', { mode: 'bigint' }).notNull(),
    maxDiscount: bigint('max_discount', { mode: 'bigint' }),
    minOrderAmount: bigint('min_order_amount', { mode: 'bigint' }),
    usageLimit: integer('usage_limit'),
    perUserLimit: integer('per_user_limit'),
    usedCount: integer('used_count').notNull().default(0),
    validFrom: timestamp('valid_from', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$defaultFn(() => new Date()),
    validTo: timestamp('valid_to', { precision: 3, mode: 'date' }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
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
    index('vouchers_code_idx').on(table.code),
    index('vouchers_is_active_valid_from_valid_to_idx').on(
      table.isActive,
      table.validFrom,
      table.validTo,
    ),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id')
      .defaultRandom()
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    userId: uuid('user_id').notNull(),
    ticketItemId: uuid('ticket_item_id').notNull(),
    ticketId: uuid('ticket_id').notNull(),
    ticketTitle: varchar('ticket_title', { length: 180 }).notNull(),
    trainNumber: varchar('train_number', { length: 64 }),
    departureStationCode: varchar('departure_station_code', { length: 24 }),
    departureStationName: varchar('departure_station_name', { length: 120 }),
    arrivalStationCode: varchar('arrival_station_code', { length: 24 }),
    arrivalStationName: varchar('arrival_station_name', { length: 120 }),
    departureTime: timestamp('departure_time', { precision: 3, mode: 'date' }),
    arrivalTime: timestamp('arrival_time', { precision: 3, mode: 'date' }),
    coachCode: varchar('coach_code', { length: 48 }),
    seatClass: varchar('seat_class', { length: 80 }),
    seatType: varchar('seat_type', { length: 80 }),
    quantity: integer('quantity').notNull(),
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    totalPrice: bigint('total_price', { mode: 'bigint' }).notNull(),
    voucherId: uuid('voucher_id').references(() => vouchers.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    voucherCode: varchar('voucher_code', { length: 32 }),
    discountAmount: bigint('discount_amount', { mode: 'bigint' })
      .notNull()
      .default(sql`0`)
      .$defaultFn(() => BigInt(0)),
    ticketCode: varchar('ticket_code', { length: 24 }).unique(),
    qrPayload: varchar('qr_payload', { length: 2000 }),
    idempotencyKey: varchar('idempotency_key', { length: 64 }).unique(),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 24 }),
    cancelReason: varchar('cancel_reason', { length: 255 }),
    status: integer('status').notNull().default(0),
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
    index('orders_user_id_idx').on(table.userId),
    index('orders_ticket_id_idx').on(table.ticketId),
    index('orders_ticket_item_id_idx').on(table.ticketItemId),
    index('orders_voucher_id_idx').on(table.voucherId),
    index('orders_status_idx').on(table.status),
    index('orders_status_deleted_at_created_at_id_idx').on(
      table.status,
      table.deletedAt,
      table.createdAt,
      table.id,
    ),
  ],
);

export const orderSeatLabels = pgTable(
  'order_seat_labels',
  {
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    seatLabel: varchar('seat_label', { length: 32 }).notNull(),
  },
  (table) => [
    primaryKey({
      name: 'order_seat_labels_pkey',
      columns: [table.orderId, table.seatLabel],
    }),
  ],
);

export const orderPassengers = pgTable(
  'order_passengers',
  {
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    fullName: varchar('full_name', { length: 120 }).notNull(),
    passengerType: varchar('passenger_type', { length: 40 }).notNull(),
    identityNumber: varchar('identity_number', { length: 40 }),
    phoneNumber: varchar('phone_number', { length: 24 }),
  },
  (table) => [
    primaryKey({
      name: 'order_passengers_pkey',
      columns: [table.orderId, table.fullName, table.passengerType],
    }),
  ],
);

export const voucherUsages = pgTable(
  'voucher_usages',
  {
    id: uuid('id')
      .defaultRandom()
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    voucherId: uuid('voucher_id')
      .notNull()
      .references(() => vouchers.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    userId: uuid('user_id').notNull(),
    orderId: uuid('order_id').notNull(),
    discountAmount: bigint('discount_amount', { mode: 'bigint' }).notNull(),
    usedAt: timestamp('used_at', { precision: 3, mode: 'date' })
      .notNull()
      .defaultNow()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    unique('voucher_usages_voucher_id_order_id_key').on(
      table.voucherId,
      table.orderId,
    ),
    index('voucher_usages_user_id_idx').on(table.userId),
  ],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  seatLabels: many(orderSeatLabels),
  passengers: many(orderPassengers),
  voucher: one(vouchers, {
    fields: [orders.voucherId],
    references: [vouchers.id],
  }),
}));

export const orderSeatLabelsRelations = relations(
  orderSeatLabels,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderSeatLabels.orderId],
      references: [orders.id],
    }),
  }),
);

export const orderPassengersRelations = relations(
  orderPassengers,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderPassengers.orderId],
      references: [orders.id],
    }),
  }),
);

export const vouchersRelations = relations(vouchers, ({ many }) => ({
  orders: many(orders),
  usages: many(voucherUsages),
}));

export const voucherUsagesRelations = relations(voucherUsages, ({ one }) => ({
  voucher: one(vouchers, {
    fields: [voucherUsages.voucherId],
    references: [vouchers.id],
  }),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderSeatLabel = typeof orderSeatLabels.$inferSelect;
export type NewOrderSeatLabel = typeof orderSeatLabels.$inferInsert;
export type OrderPassengerRow = typeof orderPassengers.$inferSelect;
export type NewOrderPassengerRow = typeof orderPassengers.$inferInsert;
export type Voucher = typeof vouchers.$inferSelect;
export type NewVoucher = typeof vouchers.$inferInsert;
export type VoucherUsage = typeof voucherUsages.$inferSelect;
export type NewVoucherUsage = typeof voucherUsages.$inferInsert;
