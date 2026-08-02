import { PrismaClient as AuthPrisma } from '../auth-service/node_modules/@prisma/client/index.js';
import { PrismaClient as UsersPrisma } from '../users-service/node_modules/@prisma/client/index.js';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const PASSWORD = "Demo@2026";
// Pre-computed bcrypt hash for "Demo@2026"
const HASHED_PASSWORD = "$2b$10$av.0y3quGJKU.AVe3XeszOfNMbuwyEi4D.RZ8yM8t.kuAuPjPgW6K";

const now = new Date();
const isoAt = (dayOffset, hour, minute = 0) => {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
};

const saleStart = isoAt(-1, 0);
const saleEnd = isoAt(45, 23, 59);

// Sync user IDs across both databases
const SEED_USERS = [
  {
    id: "f3c7e090-e837-4d7a-85d8-c92c206f4ee1",
    username: "ops-admin",
    email: "ops.admin@railway.demo",
    role: 1, // ADMIN
  },
  {
    id: "a7b7e090-e837-4d7a-85d8-c92c206f4ee2",
    username: "mai-anh",
    email: "mai.anh@railway.demo",
    role: 0, // USER
  },
  {
    id: "b7b7e090-e837-4d7a-85d8-c92c206f4ee3",
    username: "linh-tran",
    email: "linh.tran@railway.demo",
    role: 0, // USER
  }
];

let globalCookies = [];

async function dbSeedUsers() {
  console.log("Connecting to PostgreSQL databases via Prisma...");
  const authPrisma = new AuthPrisma({
    datasources: {
      db: {
        url: "postgresql://postgres.qjeymrlotmdtktfdieqs:Myhabit2004%40@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?schema=railway_auth"
      }
    }
  });

  const usersPrisma = new UsersPrisma({
    datasources: {
      db: {
        url: "postgresql://postgres.qjeymrlotmdtktfdieqs:Myhabit2004%40@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?schema=railway_users"
      }
    }
  });

  try {
    for (const u of SEED_USERS) {
      console.log(`Upserting user: ${u.username} (${u.email})`);
      
      // Upsert in AuthAccount
      await authPrisma.authAccount.upsert({
        where: { email: u.email },
        update: {
          username: u.username,
          password: HASHED_PASSWORD,
          role: u.role,
        },
        create: {
          id: u.id,
          username: u.username,
          email: u.email,
          password: HASHED_PASSWORD,
          role: u.role,
          emailVerified: true,
        }
      });

      // Upsert in User profile
      await usersPrisma.user.upsert({
        where: { email: u.email },
        update: {
          username: u.username,
          password: HASHED_PASSWORD,
          role: u.role,
        },
        create: {
          id: u.id,
          username: u.username,
          email: u.email,
          password: HASHED_PASSWORD,
          role: u.role,
        }
      });
    }
    console.log("Successfully synchronized users in both databases!");
  } catch (err) {
    console.error("Database seed failed:", err);
    throw err;
  } finally {
    await authPrisma.$disconnect();
    await usersPrisma.$disconnect();
  }
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (globalCookies.length > 0) {
    headers["Cookie"] = globalCookies.join("; ");
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Extract set-cookie headers
  const setCookies = response.headers.getSetCookie();
  if (setCookies && setCookies.length > 0) {
    const parsedCookies = setCookies.map(cookieStr => cookieStr.split(';')[0]);
    // Clear and merge new cookies
    for (const newCookie of parsedCookies) {
      const name = newCookie.split('=')[0];
      globalCookies = globalCookies.filter(c => !c.startsWith(`${name}=`));
      globalCookies.push(newCookie);
    }
  }

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    const message =
      typeof data?.message === "string" ? data.message : text || response.statusText;
    throw new Error(`${options.method || "GET"} ${path} failed: ${message}`);
  }

  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function optional(path, options = {}) {
  try {
    return await request(path, options);
  } catch (error) {
    console.warn(`Skipped ${path}: ${error.message}`);
    return null;
  }
}

function seatRange(prefix, count) {
  return Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);
}

function ticketItem({
  name,
  coachCode,
  seatClass,
  seatType,
  seats,
  original,
  flash,
}) {
  return {
    name,
    coachCode,
    seatClass,
    seatType,
    seatLabels: seats,
    availableSeatLabels: seats,
    stockInitial: seats.length,
    stockAvailable: seats.length,
    stockPrepared: true,
    priceOriginal: String(original),
    priceFlash: String(flash),
    saleStartTime: saleStart,
    saleEndTime: saleEnd,
  };
}

const tickets = [
  {
    title: "SE1 Hanoi to Hue Sleeper",
    trainNumber: "SE1",
    departureStationCode: "HAN",
    departureStationName: "Ha Noi",
    arrivalStationCode: "HUE",
    arrivalStationName: "Hue",
    journeyNote: "Overnight coastal service with sleeper and soft-seat inventory.",
    dateStart: isoAt(7, 12, 20),
    dateEnd: isoAt(8, 2, 35),
    status: 1,
    ticketItems: [
      ticketItem({
        name: "Soft sleeper cabin",
        coachCode: "A1",
        seatClass: "Sleeper",
        seatType: "Lower berth",
        seats: seatRange("A", 12),
        original: 920000,
        flash: 860000,
      }),
      ticketItem({
        name: "Soft seat",
        coachCode: "B2",
        seatClass: "Seat",
        seatType: "Recliner",
        seats: seatRange("B", 16),
        original: 640000,
        flash: 590000,
      }),
    ],
  },
  {
    title: "SE3 Hanoi to Da Nang Express",
    trainNumber: "SE3",
    departureStationCode: "HAN",
    departureStationName: "Ha Noi",
    arrivalStationCode: "DAD",
    arrivalStationName: "Da Nang",
    journeyNote: "High-demand weekend service for central-coast travel.",
    dateStart: isoAt(10, 15, 45),
    dateEnd: isoAt(11, 8, 10),
    status: 1,
    ticketItems: [
      ticketItem({
        name: "VIP sleeper",
        coachCode: "V1",
        seatClass: "Premium",
        seatType: "Private berth",
        seats: seatRange("V", 8),
        original: 1320000,
        flash: 1240000,
      }),
      ticketItem({
        name: "Standard sleeper",
        coachCode: "S2",
        seatClass: "Sleeper",
        seatType: "Upper berth",
        seats: seatRange("S", 14),
        original: 980000,
        flash: 930000,
      }),
    ],
  },
  {
    title: "SE6 Nha Trang to Saigon Day Train",
    trainNumber: "SE6",
    departureStationCode: "NTR",
    departureStationName: "Nha Trang",
    arrivalStationCode: "SGN",
    arrivalStationName: "Sai Gon",
    journeyNote: "Daytime route with business and economy options.",
    dateStart: isoAt(13, 7, 15),
    dateEnd: isoAt(13, 15, 40),
    status: 1,
    ticketItems: [
      ticketItem({
        name: "Business seat",
        coachCode: "C1",
        seatClass: "Business",
        seatType: "Wide recliner",
        seats: seatRange("C", 10),
        original: 520000,
        flash: 485000,
      }),
      ticketItem({
        name: "Economy seat",
        coachCode: "D3",
        seatClass: "Economy",
        seatType: "Standard",
        seats: seatRange("D", 20),
        original: 360000,
        flash: 330000,
      }),
    ],
  },
  {
    title: "LP2 Sapa Gateway Night Service",
    trainNumber: "LP2",
    departureStationCode: "HAN",
    departureStationName: "Ha Noi",
    arrivalStationCode: "LCI",
    arrivalStationName: "Lao Cai",
    journeyNote: "Mountain route prepared for seasonal tourism demand.",
    dateStart: isoAt(18, 21, 30),
    dateEnd: isoAt(19, 5, 55),
    status: 0,
    ticketItems: [
      ticketItem({
        name: "Tourist sleeper",
        coachCode: "T1",
        seatClass: "Sleeper",
        seatType: "Cabin berth",
        seats: seatRange("T", 10),
        original: 760000,
        flash: 720000,
      }),
    ],
  },
];

function orderPayload(user, ticket, item, quantity, seats, passengers) {
  return {
    userId: user.id,
    ticketId: ticket.id,
    ticketItemId: item.id,
    ticketTitle: ticket.title,
    trainNumber: ticket.trainNumber,
    departureStationCode: ticket.departureStationCode,
    departureStationName: ticket.departureStationName,
    arrivalStationCode: ticket.arrivalStationCode,
    arrivalStationName: ticket.arrivalStationName,
    departureTime: ticket.dateStart,
    arrivalTime: ticket.dateEnd,
    coachCode: item.coachCode,
    seatClass: item.seatClass,
    seatType: item.seatType,
    quantity,
    unitPrice: Number(item.priceFlash ?? item.priceOriginal ?? 0),
    seatLabels: seats,
    passengers,
  };
}

async function reserveSeats(ticketId, itemId, seats, passengerPrefix) {
  for (const [index, seatLabel] of seats.entries()) {
    await optional(`/tickets/${ticketId}/ticket-items/${itemId}/reserve-seat`, {
      method: "POST",
      body: {
        seatLabel,
        passengerId: `${passengerPrefix}-${index + 1}`,
      },
    });
  }
}

async function seedApiData() {
  console.log("Logging in as Admin to obtain authentication cookies...");
  const loginResult = await request("/auth/login", {
    method: "POST",
    body: {
      email: SEED_USERS[0].email,
      password: PASSWORD,
    }
  });

  console.log("Logged in successfully! Session cookies acquired:", globalCookies.map(c => c.split('=')[0]));

  console.log("Seeding tickets, orders, and payments via Gateway...");
  
  const createdTickets = [];
  for (const ticket of tickets) {
    console.log(`Creating ticket: "${ticket.title}"...`);
    const created = await request("/tickets", {
      method: "POST",
      body: ticket,
    });
    console.log(`Created ticket "${ticket.title}" with ID: ${created.id}`);

    if (created.status !== 1 && ticket.status === 1) {
      console.log(`Publishing ticket ${created.id}...`);
      await optional(`/tickets/${created.id}/publish`, { method: "POST" });
      console.log(`Published ticket ${created.id}`);
    }

    createdTickets.push(created);
  }

  const [firstTicket, secondTicket, thirdTicket] = createdTickets;
  const firstItem = firstTicket.ticketItems[0];
  const secondItem = secondTicket.ticketItems[0];
  const thirdItem = thirdTicket.ticketItems[1] ?? thirdTicket.ticketItems[0];

  const orderInputs = [
    orderPayload(SEED_USERS[1], firstTicket, firstItem, 2, ["A1", "A2"], [
      {
        fullName: "Mai Anh",
        passengerType: "Adult",
        identityNumber: "CCCD-DEMO-001",
        phoneNumber: "0901000001",
      },
      {
        fullName: "Thanh Binh",
        passengerType: "Adult",
        identityNumber: "CCCD-DEMO-002",
        phoneNumber: "0901000002",
      },
    ]),
    orderPayload(SEED_USERS[2], secondTicket, secondItem, 1, ["V1"], [
      {
        fullName: "Linh Tran",
        passengerType: "Adult",
        identityNumber: "CCCD-DEMO-003",
        phoneNumber: "0901000003",
      },
    ]),
    orderPayload(SEED_USERS[1], thirdTicket, thirdItem, 1, ["D1"], [
      {
        fullName: "Mai Anh",
        passengerType: "Adult",
        identityNumber: "CCCD-DEMO-001",
        phoneNumber: "0901000001",
      },
    ]),
  ];

  console.log("Creating orders...");
  const createdOrders = [];
  for (const [index, input] of orderInputs.entries()) {
    console.log(`Reserving seats for order ${index + 1}: ${JSON.stringify(input.seatLabels)}...`);
    await reserveSeats(input.ticketId, input.ticketItemId, input.seatLabels, `demo-order-${index + 1}`);
    console.log(`Seats reserved. Submitting order ${index + 1} to Gateway...`);
    const ord = await request("/orders", {
      method: "POST",
      body: input,
    });
    console.log(`Order ${index + 1} submitted successfully! ID: ${ord.id}`);
    createdOrders.push(ord);
  }

  console.log("Creating payments...");
  const createdPayments = [];
  for (const [index, order] of createdOrders.entries()) {
    console.log(`Submitting payment for order ${index + 1} (ID: ${order.id})...`);
    const p = await request("/payments", {
      method: "POST",
      body: {
        orderId: order.id,
        userId: order.userId,
        amount: String(order.totalPrice),
        paymentMethod: "demo-card",
      },
    });
    console.log(`Payment created successfully! ID: ${p.id}`);
    createdPayments.push(p);
  }

  // Complete one order fully (issue ticket with QR payload)
  console.log("Completing payment for first order...");
  await request("/payments/mark-paid", {
    method: "POST",
    body: { id: createdPayments[0].id, paidAt: new Date().toISOString() },
  });
  console.log("Marking first order as paid, confirming, and issuing ticket...");
  await optional(`/orders/${createdOrders[0].id}/mark-paid`, { method: "POST" });
  await optional(`/orders/${createdOrders[0].id}/confirm`, { method: "POST" });
  await optional(`/orders/${createdOrders[0].id}/issue-ticket`, { method: "POST" });
  console.log("First order fully processed (ticket issued with QR payload)!");

  // Make second order payment processing
  console.log("Setting second order payment to processing...");
  await request("/payments/mark-processing", {
    method: "POST",
    body: { id: createdPayments[1].id },
  });

  // Make third order failed/cancelled
  console.log("Setting third order payment to failed and cancelling order...");
  await request("/payments/mark-failed", {
    method: "POST",
    body: { id: createdPayments[2].id },
  });
  await optional(`/orders/${createdOrders[2].id}/cancel`, {
    method: "POST",
    body: { reason: "Demo failed payment" },
  });

  // Sync to search indexes
  console.log("Syncing search indexes...");
  await optional("/search/sync", { method: "POST" });

  console.log("Seeding Completed Successfully!");
  console.log("----------------------------------------");
  console.log("Login Details:");
  console.log(`Admin Account:`);
  console.log(`  Email: ${SEED_USERS[0].email}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`User Account (Mai Anh):`);
  console.log(`  Email: ${SEED_USERS[1].email}`);
  console.log(`  Password: ${PASSWORD}`);
}

async function run() {
  await dbSeedUsers();
  await seedApiData();
}

run().catch(console.error);
