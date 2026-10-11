import { randomUUID } from 'node:crypto';
import {
  pgTable,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id')
      .defaultRandom()
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    title: text('title'),
    trainNumber: text('train_number'),
    departureStationCode: text('departure_station_code'),
    departureStationName: text('departure_station_name'),
    arrivalStationCode: text('arrival_station_code'),
    arrivalStationName: text('arrival_station_name'),
    journeyNote: text('journey_note'),
    images: text('images')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`)
      .$defaultFn(() => []),
    dateStart: timestamp('date_start', { precision: 3, mode: 'date' }),
    dateEnd: timestamp('date_end', { precision: 3, mode: 'date' }),
    status: integer('status').notNull().default(0),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' })
      .defaultNow()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .defaultNow()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { precision: 3, mode: 'date' }),
  },
  (table) => [
    index('tickets_status_date_start_idx').on(table.status, table.dateStart),
    index('tickets_departure_station_code_arrival_station_code_idx').on(
      table.departureStationCode,
      table.arrivalStationCode,
    ),
    index('tickets_train_number_idx').on(table.trainNumber),
  ],
);

export const ticketItems = pgTable(
  'ticket_items',
  {
    id: uuid('id')
      .defaultRandom()
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    name: text('name'),
    description: text('description'),
    coachCode: text('coach_code'),
    seatClass: text('seat_class'),
    seatType: text('seat_type'),
    images: text('images')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`)
      .$defaultFn(() => []),
    seatLabels: text('seat_labels')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`)
      .$defaultFn(() => []),
    availableSeatLabels: text('available_seat_labels')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`)
      .$defaultFn(() => []),
    stockInitial: integer('stock_initial'),
    stockAvailable: integer('stock_available'),
    stockPrepared: boolean('is_stock_prepared').notNull().default(false),
    priceOriginal: bigint('price_original', { mode: 'bigint' }),
    priceFlash: bigint('price_flash', { mode: 'bigint' }),
    saleStartTime: timestamp('sale_start_time', { precision: 3, mode: 'date' }),
    saleEndTime: timestamp('sale_end_time', { precision: 3, mode: 'date' }),
    createdAt: timestamp('created_at', { precision: 3, mode: 'date' })
      .defaultNow()
      .$defaultFn(() => new Date()),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
      .defaultNow()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { precision: 3, mode: 'date' }),
  },
  (table) => [index('ticket_items_ticket_id_idx').on(table.ticketId)],
);

export const ticketsRelations = relations(tickets, ({ many }) => ({
  ticketItems: many(ticketItems),
}));

export const ticketItemsRelations = relations(ticketItems, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketItems.ticketId],
    references: [tickets.id],
  }),
}));

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type TicketItem = typeof ticketItems.$inferSelect;
export type NewTicketItem = typeof ticketItems.$inferInsert;
export type TicketWithItems = Ticket & {
  ticketItems: TicketItem[];
};

