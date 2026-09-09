// =============================================================================
// One-time migration: MongoDB `ticket` collection -> PostgreSQL
// (tickets + ticket_items tables in the railway_tickets database).
//
// Prerequisites:
//   1. tickets-service schema is already switched to PostgreSQL
//      (prisma/schema.prisma provider = "postgresql").
//   2. Run `npx prisma generate` in tickets-service so @prisma/client
//      targets PostgreSQL.
//   3. Run `npx prisma migrate deploy` (or migrate-databases.ps1) so the
//      tickets/ticket_items tables exist.
//
// Usage (from repo root):
//   MONGO_URL="mongodb://localhost:27017/railway_ticket_tickets?replicaSet=rs0" `
//   PG_URL="postgresql://app:app@localhost:5432/railway_tickets" `
//   node scripts/migrate-tickets-mongo-to-pg.mjs
//
// The script is idempotent: tickets that already exist in PostgreSQL (same id)
// are skipped, so it is safe to re-run after a partial failure.
// =============================================================================

import { MongoClient } from '../tickets-service/node_modules/mongodb/index.js';
import { PrismaClient } from '../tickets-service/node_modules/@prisma/client/index.js';

const MONGO_URL =
  process.env.MONGO_URL ||
  'mongodb://localhost:27017/railway_ticket_tickets?replicaSet=rs0';
const PG_URL =
  process.env.PG_URL ||
  'postgresql://app:app@localhost:5432/railway_tickets';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toBigIntOrNull(value) {
  if (value === null || value === undefined) return null;
  // mongodb driver may return Long, number, bigint or string
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.trunc(value));
  if (typeof value === 'string') {
    try {
      return BigInt(value);
    } catch {
      return null;
    }
  }
  if (typeof value?.toString === 'function') {
    try {
      return BigInt(value.toString());
    } catch {
      return null;
    }
  }
  return null;
}

function toDateOrNull(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toStatusNumber(value) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

let migrated = 0;
let skipped = 0;
let failed = 0;

async function migrate() {
  const mongo = new MongoClient(MONGO_URL);
  const prisma = new PrismaClient({ datasources: { db: { url: PG_URL } } });

  try {
    await mongo.connect();
    const collection = mongo.db().collection('ticket');
    const total = await collection.countDocuments();
    console.log(`Found ${total} ticket documents in MongoDB`);

    const cursor = collection.find({});
    for await (const doc of cursor) {
      const ticketId = String(doc._id);

      if (!UUID_PATTERN.test(ticketId)) {
        console.warn(`SKIP (not a UUID): ${ticketId}`);
        skipped++;
        continue;
      }

      try {
        const existing = await prisma.ticket.findUnique({
          where: { id: ticketId },
        });
        if (existing) {
          skipped++;
          continue;
        }

        await prisma.$transaction(async (tx) => {
          await tx.ticket.create({
            data: {
              id: ticketId,
              title: doc.title ?? null,
              trainNumber: doc.train_number ?? null,
              departureStationCode: doc.departure_station_code ?? null,
              departureStationName: doc.departure_station_name ?? null,
              arrivalStationCode: doc.arrival_station_code ?? null,
              arrivalStationName: doc.arrival_station_name ?? null,
              journeyNote: doc.journey_note ?? null,
              dateStart: toDateOrNull(doc.date_start),
              dateEnd: toDateOrNull(doc.date_end),
              status: toStatusNumber(doc.status),
              createdAt: toDateOrNull(doc.created_at),
              updatedAt: toDateOrNull(doc.updated_at) ?? new Date(),
              deletedAt: toDateOrNull(doc.deleted_at),
            },
          });

          const items = Array.isArray(doc.ticket_items)
            ? doc.ticket_items
            : [];

          for (const item of items) {
            const itemId = String(item.id);
            if (!UUID_PATTERN.test(itemId)) {
              console.warn(
                `SKIP item (not a UUID): ticket=${ticketId} item=${itemId}`,
              );
              continue;
            }

            await tx.ticketItem.create({
              data: {
                id: itemId,
                ticketId,
                name: item.name ?? null,
                description: item.description ?? null,
                coachCode: item.coach_code ?? null,
                seatClass: item.seat_class ?? null,
                seatType: item.seat_type ?? null,
                seatLabels: Array.isArray(item.seat_labels)
                  ? item.seat_labels.map(String)
                  : [],
                availableSeatLabels: Array.isArray(item.available_seat_labels)
                  ? item.available_seat_labels.map(String)
                  : [],
                stockInitial:
                  item.stock_initial === null || item.stock_initial === undefined
                    ? null
                    : Number(item.stock_initial),
                stockAvailable:
                  item.stock_available === null ||
                  item.stock_available === undefined
                    ? null
                    : Number(item.stock_available),
                stockPrepared: Boolean(item.is_stock_prepared),
                priceOriginal: toBigIntOrNull(item.price_original),
                priceFlash: toBigIntOrNull(item.price_flash),
                saleStartTime: toDateOrNull(item.sale_start_time),
                saleEndTime: toDateOrNull(item.sale_end_time),
                createdAt: toDateOrNull(item.created_at),
                updatedAt: toDateOrNull(item.updated_at) ?? new Date(),
                deletedAt: toDateOrNull(item.deleted_at),
              },
            });
          }
        });

        migrated++;
        console.log(`OK ${ticketId} (${items.length} items)`);
      } catch (error) {
        failed++;
        console.error(`FAIL ${ticketId}: ${error.message}`);
      }
    }

    console.log('----------------------------------------');
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped (already exists / invalid id): ${skipped}`);
    console.log(`Failed: ${failed}`);
  } finally {
    await mongo.close();
    await prisma.$disconnect();
  }
}

migrate().catch((error) => {
  console.error('Migration aborted:', error);
  process.exit(1);
});
