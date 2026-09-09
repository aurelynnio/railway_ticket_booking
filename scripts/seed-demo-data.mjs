const API_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const PASSWORD = process.env.DEMO_PASSWORD;
if (!PASSWORD) {
  console.error("Set DEMO_PASSWORD env");
  process.exit(1);
}

const now = new Date();
const isoAt = (dayOffset, hour, minute = 0) => {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
};

const saleStart = isoAt(-1, 0);
const saleEnd = isoAt(45, 23, 59);

let authCookies = "";

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(authCookies ? { Cookie: authCookies } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    authCookies = setCookie.split(";")[0];
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

async function ensureGateway() {
  const health = await request("/tickets/health");
  console.log(`Gateway reachable through tickets service: ${health.status || "ok"}`);
}

async function findOrCreateUser(user) {
  let userId = null;
  try {
    const created = await request("/auth/register", {
      method: "POST",
      body: {
        username: user.username,
        email: user.email,
        password: PASSWORD,
      },
    });
    // POST /auth/register returns the created account: { id, username, email, role, ... }
    userId = created?.id ?? null;
  } catch {
    // User may already exist
  }

  if (user.role === 1) {
    try {
      await request("/auth/login", {
        method: "POST",
        body: {
          email: user.email,
          password: PASSWORD,
        },
      });
      console.log(`Authenticated as admin: ${user.email}`);
    } catch (err) {
      console.warn(`Admin login note: ${err.message}`);
    }
  }

  return {
    // Real account id from the register response when the account was created
    // on this run. When it already existed we cannot recover it here, so fall
    // back to the username; note POST /orders overrides userId from the JWT,
    // so order ownership is not affected by this fallback.
    id: userId || user.username,
    email: user.email,
    username: user.username,
    role: user.role,
  };
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

const users = [
  {
    username: "ops-admin",
    email: "ops.admin@railway.demo",
    role: 1,
  },
  {
    username: "mai-anh",
    email: "mai.anh@railway.demo",
    role: 0,
  },
  {
    username: "linh-tran",
    email: "linh.tran@railway.demo",
    role: 0,
  },
];

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

async function seed() {
  console.log(`Seeding demo data through ${API_URL}`);
  await ensureGateway();

  const createdUsers = [];
  for (const user of users) {
    createdUsers.push(await findOrCreateUser(user));
  }

  // Idempotency: reuse tickets created by previous runs instead of duplicating.
  // Prefer an exact trainNumber + dateStart match; fall back to trainNumber so
  // a re-run never creates a duplicate for the same train.
  const ticketsPage = await request("/tickets?limit=100");
  const existingTickets = Array.isArray(ticketsPage) ? ticketsPage : ticketsPage?.data ?? [];
  const findExistingTicket = (ticket) =>
    existingTickets.find(
      (t) => t.trainNumber === ticket.trainNumber && t.dateStart === ticket.dateStart,
    ) ?? existingTickets.find((t) => t.trainNumber === ticket.trainNumber);

  const createdTickets = [];
  for (const ticket of tickets) {
    const existing = findExistingTicket(ticket);
    if (existing) {
      console.log(`Ticket "${ticket.title}" already exists (ID: ${existing.id}) — skipping creation.`);
      createdTickets.push(existing);
      continue;
    }
    const created = await request("/tickets", {
      method: "POST",
      body: ticket,
    });

    if (created.status !== 1 && ticket.status === 1) {
      await optional(`/tickets/${created.id}/publish`, { method: "POST" });
    }

    createdTickets.push(created);
  }

  const [firstTicket, secondTicket, thirdTicket] = createdTickets;
  const firstItem = firstTicket.ticketItems[0];
  const secondItem = secondTicket.ticketItems[0];
  const thirdItem = thirdTicket.ticketItems[1] ?? thirdTicket.ticketItems[0];

  const orderInputs = [
    orderPayload(createdUsers[1], firstTicket, firstItem, 2, ["A1", "A2"], [
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
    orderPayload(createdUsers[2], secondTicket, secondItem, 1, ["V1"], [
      {
        fullName: "Linh Tran",
        passengerType: "Adult",
        identityNumber: "CCCD-DEMO-003",
        phoneNumber: "0901000003",
      },
    ]),
    orderPayload(createdUsers[1], thirdTicket, thirdItem, 1, ["D1"], [
      {
        fullName: "Mai Anh",
        passengerType: "Adult",
        identityNumber: "CCCD-DEMO-001",
        phoneNumber: "0901000001",
      },
    ]),
  ];

  // Fixed deterministic idempotency key per demo order so re-runs replay
  // instead of creating duplicates.
  orderInputs.forEach((input, index) => {
    input.idempotencyKey = `demo-seed-order-${index + 1}`;
  });

  const createdOrders = [];
  for (const [index, input] of orderInputs.entries()) {
    // Idempotency: skip if an order for this ticket already exists (re-run).
    const ordersPage = await request(`/orders?ticketId=${input.ticketId}&limit=50`);
    const existingOrders = Array.isArray(ordersPage) ? ordersPage : ordersPage?.data ?? [];
    if (existingOrders.length > 0) {
      console.log(`Order for ticket ${input.ticketId} already exists (ID: ${existingOrders[0].id}) — skipping.`);
      createdOrders.push(existingOrders[0]);
      continue;
    }
    await reserveSeats(input.ticketId, input.ticketItemId, input.seatLabels, `demo-order-${index + 1}`);
    createdOrders.push(
      await request("/orders", {
        method: "POST",
        body: input,
      }),
    );
  }

  const createdPayments = [];
  for (const order of createdOrders) {
    // Idempotency: reuse an existing payment for this order (re-run).
    const existingPayments = await request(`/payments/order/${order.id}`);
    if (Array.isArray(existingPayments) && existingPayments.length > 0) {
      console.log(`Payment for order ${order.id} already exists (ID: ${existingPayments[0].id}) — skipping.`);
      createdPayments.push(existingPayments[0]);
      continue;
    }
    createdPayments.push(
      await request("/payments", {
        method: "POST",
        body: {
          orderId: order.id,
          userId: order.userId,
          amount: String(order.totalPrice),
          paymentMethod: "demo-card",
        },
      }),
    );
  }

  // optional(): re-runs against already-processed payments must not abort the seed.
  await optional("/payments/mark-paid", {
    method: "POST",
    body: { id: createdPayments[0].id, paidAt: new Date().toISOString() },
  });
  await optional(`/orders/${createdOrders[0].id}/mark-paid`, { method: "POST" });
  await optional(`/orders/${createdOrders[0].id}/confirm`, { method: "POST" });
  await optional(`/orders/${createdOrders[0].id}/issue-ticket`, { method: "POST" });

  await optional("/payments/mark-processing", {
    method: "POST",
    body: { id: createdPayments[1].id },
  });

  await optional("/payments/mark-failed", {
    method: "POST",
    body: { id: createdPayments[2].id },
  });
  await optional(`/orders/${createdOrders[2].id}/cancel`, {
    method: "POST",
    body: { reason: "Demo failed payment" },
  });

  // Search now queries the tickets DB directly — no separate index to sync.

  console.log("");
  console.log("Demo data created:");
  console.log(`- Users: ${createdUsers.length}`);
  console.log(`- Tickets: ${createdTickets.length}`);
  console.log(`- Orders: ${createdOrders.length}`);
  console.log(`- Payments: ${createdPayments.length}`);
  console.log("");
  console.log("Open these pages in the client:");
  console.log("- http://localhost:3000/");
  console.log("- http://localhost:3000/search?departureStationCode=HAN&arrivalStationCode=HUE");
  console.log("- http://localhost:3000/admin");
  console.log("- http://localhost:3000/admin/tickets");
  console.log("- http://localhost:3000/admin/orders");
  console.log("- http://localhost:3000/admin/payments");
  console.log("- http://localhost:3000/admin/users");
  console.log("");
  console.log(`Demo user password: ${PASSWORD}`);
}

seed().catch((error) => {
  console.error(error.message);
  console.error("");
  console.error("Make sure the gateway and backing services are running, then retry:");
  console.error("  node scripts/seed-demo-data.mjs");
  process.exitCode = 1;
});
