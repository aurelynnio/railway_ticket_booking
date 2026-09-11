/**
 * API Integration Test — railway-ticket-booking
 * -----------------------------------------------------------------------------
 * Comprehensive end-to-end verification of every backend endpoint exposed by
 * the API gateway:
 *   1. Availability (endpoint exists & reachable)
 *   2. HTTP method correctness
 *   3. Input params (query / body / headers) & validation behavior
 *   4. HTTP status codes (200/201/400/401/403/404/409/501/...)
 *   5. Response contract (JSON content-type, pagination shape, key fields)
 *   6. Edge cases (invalid data, insufficient rights, missing resources)
 *   7. Response time per endpoint
 *
 * Output:
 *   - scripts/test-results/api-test-results-<timestamp>.json  (detailed)
 *   - docs/api-tests/api-test-report.md                        (team report)
 *
 * Usage:
 *   node scripts/api-integration-test.mjs
 *   API_URL=http://localhost:8081 DEMO_PASSWORD=DemoPass123 PACE_MS=600 node scripts/api-integration-test.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.API_URL || "http://localhost:8081";
const PASSWORD = process.env.DEMO_PASSWORD || "DemoPass123";
const PACE_MS = Number(process.env.PACE_MS ?? 600);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ops.admin@railway.demo";
const USER_EMAIL = process.env.USER_EMAIL || "mai.anh@railway.demo";
const SECOND_USER_EMAIL = process.env.SECOND_USER_EMAIL || "linh.tran@railway.demo";

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => new Date().toISOString();
const stamp = Date.now();

/** File cookie jar per identity key. */
const sessions = new Map();

function setCookiesFromResponse(key, headers) {
  const jar = sessions.get(key) ?? { access: "", refresh: "" };
  const setCookies = headers.getSetCookie?.() ?? [];
  for (const c of setCookies) {
    const kv = c.split(";")[0];
    const eq = kv.indexOf("=");
    const name = eq > -1 ? kv.slice(0, eq) : "";
    const value = eq > -1 ? kv.slice(eq + 1) : "";
    if (name === "accessToken") jar.access = `${name}=${value}`;
    if (name === "refreshToken") jar.refresh = `${name}=${value}`;
  }
  sessions.set(key, jar);
}

function cookieHeader(key, { access = true, refresh = true } = {}) {
  const jar = sessions.get(key);
  if (!jar) return "";
  return [access ? jar.access : "", refresh ? jar.refresh : ""].filter(Boolean).join("; ");
}

async function checkCase({ id, group, name, method = "GET", path, query, body, headers = {}, cookies, expectedStatus, validate, contentTypeExpected = "json" }) {
  const url = new URL(path, BASE);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const start = performance.now();
  let status = 0;
  let text = "";
  let resHeaders = null;
  let err = null;
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookies ? { Cookie: cookieHeader(cookies) } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    status = res.status;
    resHeaders = res.headers;
    text = await res.text();
    if (typeof cookies === "string" && cookies !== "__none__") {
      setCookiesFromResponse(cookies, res.headers);
    }
  } catch (e) {
    err = e;
  }
  const ms = Math.round((performance.now() - start) * 10) / 10;

  let data = null;
  let contentType = resHeaders?.get("content-type") ?? "";
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  const expected = Array.isArray(expectedStatus) ? [...expectedStatus] : [expectedStatus];
  // Nest renders 201 for @Post by default; accept 201 where 200 is expected.
  if (method === "POST" && !expected.includes(201) && expected.includes(200)) {
    expected.push(201);
  }
  let pass = !err && expected.includes(status);
  let reason = "";
  if (err) {
    reason = `Request failed: ${err.message}`;
  } else if (!pass) {
    reason = `Expected ${expected.join("|")}, got ${status}`;
  }

  let contractNote = "";
  if (pass && validate) {
    try {
      const v = validate(data, resHeaders);
      if (v && v.pass === false) {
        pass = false;
        contractNote = v.note ?? "";
        reason = reason || `Contract violated: ${contractNote}`;
      } else if (v?.note) {
        contractNote = v.note;
      }
    } catch (e) {
      pass = false;
      reason = `validate() threw: ${e.message}`;
    }
  }
  if (pass && contentTypeExpected === "json" && status < 400 && !contentType.includes("application/json") && method !== "HEAD") {
    pass = false;
    reason = `Expected JSON content-type, got "${contentType}"`;
  }

  results.push({
    id, group, name, method, path,
    expectedStatus: expectedStatus ?? null,
    actualStatus: status,
    responseTimeMs: ms,
    pass,
    contentType,
    response: data ?? (text ? text.slice(0, 200) : ""),
    reason: reason || contractNote || null,
  });

  if (PACE_MS > 0) await sleep(PACE_MS);
  return data;
}

const ok = { pass: true };
const note = (n) => ({ pass: true, note: n });
function code(...codes) { return codes.length === 1 ? codes[0] : codes; }

/* ============================ SETUP ==================================== */
async function setup() {
  await checkCase({ id: "auth.L06", group: "Auth", name: "login admin", method: "POST", path: "/auth/login", body: { email: ADMIN_EMAIL, password: PASSWORD }, cookies: "admin", expectedStatus: 200 });
  await checkCase({ id: "auth.L07", group: "Auth", name: "login user (mai-anh)", method: "POST", path: "/auth/login", body: { email: USER_EMAIL, password: PASSWORD }, cookies: "user", expectedStatus: 200 });
  await checkCase({ id: "auth.L08", group: "Auth", name: "login user (linh-tran)", method: "POST", path: "/auth/login", body: { email: SECOND_USER_EMAIL, password: PASSWORD }, cookies: "user2", expectedStatus: 200 });

  const suffix = Math.random().toString(36).slice(2, 8);
  await checkCase({ id: "auth.R01", group: "Auth", name: "register fresh user", method: "POST", path: "/auth/register", body: { username: `tester-${suffix}`, email: `tester-${suffix}@railway.demo`, password: PASSWORD }, expectedStatus: 201, validate: (d) => (d?.id ? note(`id=${d.id}`) : { pass: false, note: "no id in response" }) });
  await checkCase({ id: "auth.L09", group: "Auth", name: "login fresh user", method: "POST", path: "/auth/login", body: { email: `tester-${suffix}@railway.demo`, password: PASSWORD }, cookies: "fresh", expectedStatus: 200 });

  const me = await checkCase({ id: "users.M01", group: "Users", name: "GET /users/me (admin)", method: "GET", path: "/users/me", cookies: "admin", expectedStatus: 200, validate: (d) => (d?.id ? ok : { pass: false, note: "missing id" }) });

  // Scratch ticket with an OPEN sale window so reserve/checkout work during the test.
  const itemSeats = Array.from({ length: 14 }, (_, i) => `T${i + 1}`);
  const createRes = await checkCase({ id: "tickets.C01", group: "Tickets", name: "POST /tickets (admin) create scratch", method: "POST", path: "/tickets", cookies: "admin", body: {
    title: "API Test Train",
    trainNumber: `TEST${stamp.toString().slice(-4)}`,
    departureStationCode: "HAN", departureStationName: "Ha Noi",
    arrivalStationCode: "HUE", arrivalStationName: "Hue",
    journeyNote: "Created by the integration test suite",
    dateStart: new Date(Date.now() + 86400000).toISOString(),
    dateEnd: new Date(Date.now() + 90000000).toISOString(),
    status: 1,
    ticketItems: [{
      name: "Test seat", coachCode: "TA", seatClass: "Seat", seatType: "Standard",
      seatLabels: itemSeats, availableSeatLabels: itemSeats,
      stockInitial: itemSeats.length, stockAvailable: itemSeats.length, stockPrepared: true,
      priceOriginal: "150000", priceFlash: "120000",
      saleStartTime: new Date(Date.now() - 3600000).toISOString(),
      saleEndTime: new Date(Date.now() + 30 * 86400000).toISOString(),
    }],
  }, expectedStatus: 201, validate: (d) => (d?.id && d?.ticketItems?.[0]?.id ? ok : { pass: false, note: "missing id/ticketItems" }) });

  return { suffix, adminId: me?.id, ticketId: createRes?.id, itemId: createRes?.ticketItems?.[0]?.id };
}

const startTime = performance.now();
let ctx;
try {
  ctx = await setup();
} catch (e) {
  if (!results.length) throw e;
}

/* ------------------------------ AUTH ---------------------------------- */
await checkCase({ id: "auth.H01", group: "Auth", name: "GET /auth/health", method: "GET", path: "/auth/health", expectedStatus: 200 });

const registerBody = { username: "dup-user", email: "dup.user@railway.demo", password: PASSWORD };
await checkCase({ id: "auth.R02", group: "Auth", name: "register new user (or already exists on re-run)", method: "POST", path: "/auth/register", body: registerBody, expectedStatus: code(201, 409) });
await checkCase({ id: "auth.R03", group: "Auth", name: "register duplicate email → 409", method: "POST", path: "/auth/register", body: registerBody, expectedStatus: 409, validate: (d) => (d?.statusCode === 409 ? ok : { pass: false, note: String(JSON.stringify(d)) }) });
await checkCase({ id: "auth.R04", group: "Auth", name: "register missing email → 400", method: "POST", path: "/auth/register", body: { username: "x", password: PASSWORD }, expectedStatus: 400 });
await checkCase({ id: "auth.R05", group: "Auth", name: "register unknown field → 400 (forbidNonWhitelisted)", method: "POST", path: "/auth/register", body: { username: "x2", email: "x2@railway.demo", password: PASSWORD, hacked: true }, expectedStatus: 400 });

await checkCase({ id: "auth.L10", group: "Auth", name: "login wrong password → 401", method: "POST", path: "/auth/login", body: { email: USER_EMAIL, password: "WrongPass1" }, expectedStatus: 401 });
await checkCase({ id: "auth.L11", group: "Auth", name: "login non-existent email → 401", method: "POST", path: "/auth/login", body: { email: "ghost@railway.demo", password: "GhostPass1" }, expectedStatus: 401 });

await checkCase({ id: "auth.S01", group: "Auth", name: "GET /auth/session (authed)", method: "GET", path: "/auth/session", cookies: "user", expectedStatus: 200, validate: (d) => (d?.userId ? ok : { pass: false, note: `userId empty: ${JSON.stringify(d)}` }) });
await checkCase({ id: "auth.S02", group: "Auth", name: "GET /auth/session (anonymous)", method: "GET", path: "/auth/session", expectedStatus: 200, validate: (d) => (d?.userId === "" ? ok : { pass: false, note: "expected empty userId" }) });

await checkCase({ id: "auth.T01", group: "Auth", name: "POST /auth/refresh-token (with cookie)", method: "POST", path: "/auth/refresh-token", cookies: "user", expectedStatus: 200 });
await checkCase({ id: "auth.T02", group: "Auth", name: "POST /auth/refresh-token (no cookie) → 401", method: "POST", path: "/auth/refresh-token", expectedStatus: 401 });

await checkCase({ id: "auth.F01", group: "Auth", name: "POST /auth/forgot-password existing email", method: "POST", path: "/auth/forgot-password", body: { email: USER_EMAIL }, expectedStatus: 200, validate: (d) => (d?.success === true ? ok : { pass: false, note: "no success:true" }) });
await checkCase({ id: "auth.F02", group: "Auth", name: "POST /auth/forgot-password unknown email → generic 200", method: "POST", path: "/auth/forgot-password", body: { email: "nobody@railway.demo" }, expectedStatus: 200 });
await checkCase({ id: "auth.F03", group: "Auth", name: "POST /auth/forgot-password missing email → 400", method: "POST", path: "/auth/forgot-password", body: {}, expectedStatus: 400 });

await checkCase({ id: "auth.P01", group: "Auth", name: "POST /auth/reset-password missing fields → 400", method: "POST", path: "/auth/reset-password", body: {}, expectedStatus: 400 });
await checkCase({ id: "auth.P02", group: "Auth", name: "POST /auth/reset-password invalid token → 401", method: "POST", path: "/auth/reset-password", body: { token: "not-a-real-token", newPassword: PASSWORD }, expectedStatus: 401 });

await checkCase({ id: "auth.C01", group: "Auth", name: "POST /auth/change-password wrong old → 401", method: "POST", path: "/auth/change-password", cookies: "user", body: { oldPassword: "WrongOld1", newPassword: "NewPass123" }, expectedStatus: 401 });
await checkCase({ id: "auth.C02", group: "Auth", name: "POST /auth/change-password correct old → ok", method: "POST", path: "/auth/change-password", cookies: "user", body: { oldPassword: PASSWORD, newPassword: "NewPass123" }, expectedStatus: 200 });

await checkCase({ id: "auth.V01", group: "Auth", name: "POST /auth/verify-email missing token → 400", method: "POST", path: "/auth/verify-email", body: {}, expectedStatus: 400 });
await checkCase({ id: "auth.V02", group: "Auth", name: "POST /auth/resend-verification unknown email → generic 200", method: "POST", path: "/auth/resend-verification", body: { email: "nobody@railway.demo" }, expectedStatus: 200 });

await checkCase({ id: "auth.G01", group: "Auth", name: "GET /auth/google → 501 (not implemented)", method: "GET", path: "/auth/google", expectedStatus: 501 });
await checkCase({ id: "auth.G02", group: "Auth", name: "GET /auth/google/callback no code → 401", method: "GET", path: "/auth/google/callback", expectedStatus: 401 });

// Revoke-all-sessions invalidates refresh tokens; access tokens are JWT-stateless.
await checkCase({ id: "auth.RS01", group: "Auth", name: "POST /auth/revoke-all-sessions → ok", method: "POST", path: "/auth/revoke-all-sessions", cookies: "user", expectedStatus: 200 });
await checkCase({ id: "auth.RS02", group: "Auth", name: "existing access token still accepted after revoke-all (issue documented)", method: "GET", path: "/users/me", cookies: "user", expectedStatus: 401 });
sessions.set("user", { access: "", refresh: "" });
// Re-login the main user (password changed in C02).
await checkCase({ id: "auth.RS03", group: "Auth", name: "re-login user after password change", method: "POST", path: "/auth/login", body: { email: USER_EMAIL, password: "NewPass123" }, cookies: "user", expectedStatus: 200 });

/* ------------------------------ USERS --------------------------------- */
await checkCase({ id: "users.H01", group: "Users", name: "GET /users/health → 200", method: "GET", path: "/users/health", expectedStatus: 200 });
await checkCase({ id: "users.M02", group: "Users", name: "GET /users/me (anonymous) → 401", method: "GET", path: "/users/me", expectedStatus: 401 });
await checkCase({ id: "users.M03", group: "Users", name: "PATCH /users/me update username", method: "PATCH", path: "/users/me", cookies: "user2", body: { username: "linh-tran-updated" }, expectedStatus: 200 });

await checkCase({ id: "users.L01", group: "Users", name: "GET /users ?page limit (admin)", method: "GET", path: "/users", query: { page: 1, limit: 5 }, cookies: "admin", expectedStatus: 200, validate: (d) => (d?.data && d?.pagination ? ok : { pass: false, note: `expected {data,pagination}` }) });
await checkCase({ id: "users.L02", group: "Users", name: "GET /users (normal user) → 403", method: "GET", path: "/users", cookies: "user2", expectedStatus: 403 });
await checkCase({ id: "users.L03", group: "Users", name: "GET /users ?page=0 → 400", method: "GET", path: "/users", query: { page: 0 }, cookies: "admin", expectedStatus: 400 });

await checkCase({ id: "users.G01", group: "Users", name: "GET /users/by-email (admin)", method: "GET", path: "/users/by-email", query: { email: USER_EMAIL }, cookies: "admin", expectedStatus: 200, validate: (d) => (d?.email ? ok : { pass: false, note: "missing email" }) });
await checkCase({ id: "users.G02", group: "Users", name: "GET /users/by-email (user) → 403", method: "GET", path: "/users/by-email", query: { email: USER_EMAIL }, cookies: "user2", expectedStatus: 403 });

await checkCase({ id: "users.U01", group: "Users", name: "GET /users/:id (admin)", method: "GET", path: `/users/${ctx.adminId}`, cookies: "admin", expectedStatus: 200, validate: (d) => (d?.id === ctx.adminId ? ok : { pass: false, note: "id mismatch" }) });
await checkCase({ id: "users.U02", group: "Users", name: "GET /users/:id (other user) → 403", method: "GET", path: `/users/${ctx.adminId}`, cookies: "user2", expectedStatus: 403 });
await checkCase({ id: "users.U03", group: "Users", name: "GET /users/:nonexistent → 404", method: "GET", path: "/users/00000000-0000-0000-0000-000000000000", cookies: "admin", expectedStatus: 404 });

const newUserId = (await checkCase({ id: "users.C01", group: "Users", name: "POST /users (admin) create (payload wrapper)", method: "POST", path: "/users", cookies: "admin", body: { payload: { username: `adm-created-${ctx.suffix}`, email: `adm-created-${ctx.suffix}@railway.demo`, password: PASSWORD } }, expectedStatus: 201, validate: (d) => (d?.id ? ok : { pass: false, note: "missing id" }) }))?.id;
await checkCase({ id: "users.C02", group: "Users", name: "POST /users (normal user) → 403", method: "POST", path: "/users", cookies: "user2", body: { payload: { username: "x", email: "x3@railway.demo", password: PASSWORD } }, expectedStatus: 403 });
if (newUserId) {
  await checkCase({ id: "users.E01", group: "Users", name: "PATCH /users/:id (admin)", method: "PATCH", path: `/users/${newUserId}`, cookies: "admin", body: { username: `adm-created-${ctx.suffix}-renamed` }, expectedStatus: 200 });
  await checkCase({ id: "users.D01", group: "Users", name: "DELETE /users/:id (admin)", method: "DELETE", path: `/users/${newUserId}`, cookies: "admin", expectedStatus: 200 });
}

/* ----------------------------- TICKETS --------------------------------- */
await checkCase({ id: "tickets.H01", group: "Tickets", name: "GET /tickets/health → 200", method: "GET", path: "/tickets/health", expectedStatus: 200 });
await checkCase({ id: "tickets.L01", group: "Tickets", name: "GET /tickets (public, paginated)", method: "GET", path: "/tickets", query: { page: 1, limit: 5 }, expectedStatus: 200, validate: (d) => (d?.data && d?.pagination ? ok : { pass: false, note: `expected {data,pagination}` }) });
await checkCase({ id: "tickets.L02", group: "Tickets", name: "GET /tickets ?status=bogus → 400", method: "GET", path: "/tickets", query: { status: "bogus" }, expectedStatus: 400 });
await checkCase({ id: "tickets.L03", group: "Tickets", name: "GET /tickets ?limit=0 → 400", method: "GET", path: "/tickets", query: { limit: 0 }, expectedStatus: 400 });

await checkCase({ id: "tickets.G01", group: "Tickets", name: "GET /tickets/:id (detail)", method: "GET", path: `/tickets/${ctx.ticketId}`, expectedStatus: 200, validate: (d) => (d?.id === ctx.ticketId ? ok : { pass: false, note: "id mismatch" }) });
await checkCase({ id: "tickets.G02", group: "Tickets", name: "GET /tickets/:nonexistent → 404", method: "GET", path: `/tickets/00000000-0000-0000-0000-000000000000`, expectedStatus: 404 });

await checkCase({ id: "tickets.A01", group: "Tickets", name: "GET /tickets/:id/availability", method: "GET", path: `/tickets/${ctx.ticketId}/availability`, expectedStatus: 200, validate: (d) => (d?.ticketId && Array.isArray(d?.items) ? ok : { pass: false, note: "missing ticketId/items" }) });
await checkCase({ id: "tickets.A02", group: "Tickets", name: "GET /tickets/:id/seat-map", method: "GET", path: `/tickets/${ctx.ticketId}/seat-map`, expectedStatus: 200, validate: (d) => (Array.isArray(d?.items) ? ok : { pass: false, note: "missing items" }) });

await checkCase({ id: "tickets.C02", group: "Tickets", name: "POST /tickets (user) → 403", method: "POST", path: "/tickets", cookies: "user2", body: { title: "nope" }, expectedStatus: 403 });
await checkCase({ id: "tickets.C03", group: "Tickets", name: "POST /tickets invalid body → 400", method: "POST", path: "/tickets", cookies: "admin", body: { title: 123 }, expectedStatus: 400 });
await checkCase({ id: "tickets.C04", group: "Tickets", name: "POST /tickets unknown field → 400", method: "POST", path: "/tickets", cookies: "admin", body: { title: "X", hacked: true }, expectedStatus: 400 });

await checkCase({ id: "tickets.U01", group: "Tickets", name: "PATCH /tickets/:id (admin)", method: "PATCH", path: `/tickets/${ctx.ticketId}`, cookies: "admin", body: { journeyNote: "updated by test" }, expectedStatus: 200 });
await checkCase({ id: "tickets.U02", group: "Tickets", name: "PATCH /tickets/:id (user) → 403", method: "PATCH", path: `/tickets/${ctx.ticketId}`, cookies: "user2", body: { journeyNote: "x" }, expectedStatus: 403 });

/* ------------------------------ SEARCH ---------------------------------- */
await checkCase({ id: "search.H01", group: "Search", name: "GET /search/health → 200", method: "GET", path: "/search/health", expectedStatus: 200 });
await checkCase({ id: "search.S01", group: "Search", name: "GET /search/trips (full params)", method: "GET", path: "/search/trips", query: { from: "HAN", to: "HUE", date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), sort: "recommended", timeOfDay: "morning", seatClass: "seat", page: 1, limit: 5 }, expectedStatus: 200, validate: (d) => (Array.isArray(d?.data) ? ok : { pass: false, note: `expected {data:[...]}` }) });
await checkCase({ id: "search.S02", group: "Search", name: "GET /search/trips empty query → 200", method: "GET", path: "/search/trips", expectedStatus: 200 });
await checkCase({ id: "search.S03", group: "Search", name: "GET /search/trips invalid date → 400", method: "GET", path: "/search/trips", query: { date: "not-a-date" }, expectedStatus: 400 });
await checkCase({ id: "search.S04", group: "Search", name: "GET /search/trips invalid sort → 400", method: "GET", path: "/search/trips", query: { sort: "bogus" }, expectedStatus: 400 });
await checkCase({ id: "search.S05", group: "Search", name: "GET /search/trips limit=100 → 400 (max 50)", method: "GET", path: "/search/trips", query: { limit: 100 }, expectedStatus: 400 });
await checkCase({ id: "search.S06", group: "Search", name: "GET /search/suggest-stations ?q", method: "GET", path: "/search/suggest-stations", query: { q: "Ha" }, expectedStatus: 200, validate: (d) => (Array.isArray(d) ? ok : { pass: false, note: `expected array` }) });
await checkCase({ id: "search.S07", group: "Search", name: "GET /search/suggest-stations (no q) → 200", method: "GET", path: "/search/suggest-stations", expectedStatus: 200 });

/* ------------------------------ ORDERS ---------------------------------- */
await checkCase({ id: "orders.H01", group: "Orders", name: "GET /orders/health → 200", method: "GET", path: "/orders/health", expectedStatus: 200 });

const tail = stamp.toString().slice(-4);
const checkoutPayload = (quantity = 1, keySuffix = "x", seatLabel = undefined) => ({
  ticketId: ctx.ticketId,
  ticketItemId: ctx.itemId,
  ticketTitle: "API Test Train",
  trainNumber: `TEST${tail}`,
  departureStationCode: "HAN", departureStationName: "Ha Noi",
  arrivalStationCode: "HUE", arrivalStationName: "Hue",
  departureTime: new Date(Date.now() + 86400000).toISOString(),
  arrivalTime: new Date(Date.now() + 90000000).toISOString(),
  coachCode: "TA", seatClass: "Seat", seatType: "Standard",
  quantity, unitPrice: 150000,
  seatLabels: seatLabel ? [seatLabel] : undefined,
  passengers: [{ fullName: "Mai Anh", passengerType: "Adult", identityNumber: "CCCD-API-001", phoneNumber: "0909000001" }],
  contactEmail: USER_EMAIL,
  idempotencyKey: `api-test-order-${tail}-${keySuffix}`,
});

const o1 = await checkCase({ id: "orders.C01", group: "Orders", name: "POST /orders/checkout (user, 2 seats)", method: "POST", path: "/orders/checkout", cookies: "user", body: checkoutPayload(2, "main"), expectedStatus: code(200, 201), validate: (d) => (d?.order?.id && d?.payment?.id ? ok : { pass: false, note: "expected {order, payment}" }) });
const o1Id = o1?.order?.id;
const o1PaymentId = o1?.payment?.id;
const o1TxnId = o1?.payment?.transactionId;

await checkCase({ id: "orders.C02", group: "Orders", name: "POST /orders/checkout idempotent replay → same order", method: "POST", path: "/orders/checkout", cookies: "user", body: checkoutPayload(2, "main"), expectedStatus: code(200, 201), validate: (d) => (d?.order?.id === o1Id ? { pass: true, note: "dedupe OK — replayed key returns same order" } : { pass: false, note: "replay created a NEW order (dedupe broken?)" }) });

const o2 = await checkCase({ id: "orders.C03", group: "Orders", name: "POST /orders/checkout 2nd order (cancel target)", method: "POST", path: "/orders/checkout", cookies: "user", body: checkoutPayload(1, "cancel"), expectedStatus: code(200, 201) });
const o2Id = o2?.order?.id;

const op = await checkCase({ id: "orders.C04", group: "Orders", name: "POST /orders/checkout 3rd order (payment-flow target)", method: "POST", path: "/orders/checkout", cookies: "user", body: checkoutPayload(1, "pm"), expectedStatus: code(200, 201) });
const opId = op?.order?.id;

const orv = await checkCase({ id: "orders.C05", group: "Orders", name: "POST /orders/checkout 4th order (vnpay target)", method: "POST", path: "/orders/checkout", cookies: "user", body: checkoutPayload(1, "vnpay"), expectedStatus: code(200, 201) });
const orvId = orv?.order?.id;

await checkCase({ id: "orders.C06", group: "Orders", name: "POST /orders/checkout (anonymous) → 401", method: "POST", path: "/orders/checkout", cookies: "__none__", body: checkoutPayload(1, "anon"), expectedStatus: 401 });
await checkCase({ id: "orders.C07", group: "Orders", name: "POST /orders/checkout empty body → 400", method: "POST", path: "/orders/checkout", cookies: "user", body: {}, expectedStatus: 400 });

await checkCase({ id: "orders.L01", group: "Orders", name: "GET /orders (user, own list)", method: "GET", path: "/orders", query: { page: 1, limit: 5 }, cookies: "user", expectedStatus: 200, validate: (d) => (Array.isArray(d?.data) ? ok : { pass: false, note: "expected {data}" }) });
await checkCase({ id: "orders.L02", group: "Orders", name: "GET /orders (anonymous) → 401", method: "GET", path: "/orders", cookies: "__none__", expectedStatus: 401 });
await checkCase({ id: "orders.C08", group: "Orders", name: "POST /orders (user) → 403", method: "POST", path: "/orders", cookies: "user", body: checkoutPayload(1, "u403"), expectedStatus: 403 });
await checkCase({ id: "orders.C09", group: "Orders", name: "POST /orders (admin) create", method: "POST", path: "/orders", cookies: "admin", body: (() => { const p = checkoutPayload(1, "admindraft", "T3"); delete p.idempotencyKey; return p; })(), expectedStatus: code(200, 201) });
await checkCase({ id: "orders.C10", group: "Orders", name: "POST /orders unknown field → 400", method: "POST", path: "/orders", cookies: "admin", body: { ...checkoutPayload(1, "x"), hacked: true }, expectedStatus: 400 });

if (o1Id) {
  await checkCase({ id: "orders.G01", group: "Orders", name: "GET /orders/:id (owner)", method: "GET", path: `/orders/${o1Id}`, cookies: "user", expectedStatus: 200, validate: (d) => (d?.id === o1Id ? ok : { pass: false, note: "id mismatch" }) });
  await checkCase({ id: "orders.G02", group: "Orders", name: "GET /orders/:id (non-owner) → 403", method: "GET", path: `/orders/${o1Id}`, cookies: "user2", expectedStatus: 403 });
  await checkCase({ id: "orders.G03", group: "Orders", name: "GET /orders/:id/summary (owner)", method: "GET", path: `/orders/${o1Id}/summary`, cookies: "user", expectedStatus: 200, validate: (d) => (d?.orderId === o1Id ? ok : { pass: false, note: "orderId mismatch" }) });
  await checkCase({ id: "orders.G04", group: "Orders", name: "GET /orders/:nonexistent → 404", method: "GET", path: "/orders/00000000-0000-0000-0000-000000000000", cookies: "user", expectedStatus: 404 });
  await checkCase({ id: "orders.G05", group: "Orders", name: "PATCH /orders/:id/passengers (owner)", method: "PATCH", path: `/orders/${o1Id}/passengers`, cookies: "user", body: { passengers: [{ fullName: "Updated Passenger", passengerType: "Adult", identityNumber: "CCCD-API-002", phoneNumber: "0909000002" }] }, expectedStatus: 200 });
  await checkCase({ id: "orders.G06", group: "Orders", name: "PATCH /orders/:id/passengers no body → 400", method: "PATCH", path: `/orders/${o1Id}/passengers`, cookies: "user", body: {}, expectedStatus: 400 });
  await checkCase({ id: "orders.G07", group: "Orders", name: "PATCH /orders/:id/seat-labels (owner)", method: "PATCH", path: `/orders/${o1Id}/seat-labels`, cookies: "user", body: { seatLabels: ["T1"] }, expectedStatus: 200 });
  await checkCase({ id: "orders.G08", group: "Orders", name: "POST /orders/:id/mark-paid (user) → 403", method: "POST", path: `/orders/${o1Id}/mark-paid`, cookies: "user", expectedStatus: 403 });
}

if (o2Id) {
  await checkCase({ id: "orders.CN01", group: "Orders", name: "POST /orders/:id/cancel (owner)", method: "POST", path: `/orders/${o2Id}/cancel`, cookies: "user", body: { reason: "Customer request" }, expectedStatus: 200, validate: (d) => (d?.order?.status >= 5 ? ok : { pass: false, note: `expected cancelled: ${JSON.stringify(d)}` }) });
}
if (o1Id) {
  await checkCase({ id: "orders.CN02", group: "Orders", name: "POST /orders/:id/cancel (non-owner) → 403", method: "POST", path: `/orders/${o1Id}/cancel`, cookies: "user2", body: { reason: "x" }, expectedStatus: 403 });
}

if (o1Id) {
  await checkCase({ id: "orders.AD01", group: "Orders", name: "POST /orders/:id/mark-paid (admin)", method: "POST", path: `/orders/${o1Id}/mark-paid`, cookies: "admin", expectedStatus: 200 });
  await checkCase({ id: "orders.AD02", group: "Orders", name: "POST /orders/:id/confirm (admin)", method: "POST", path: `/orders/${o1Id}/confirm`, cookies: "admin", expectedStatus: 200 });
  await checkCase({ id: "orders.AD03", group: "Orders", name: "POST /orders/:id/issue-ticket (admin)", method: "POST", path: `/orders/${o1Id}/issue-ticket`, cookies: "admin", expectedStatus: 200, validate: (d) => (d?.ticketCode || d?.qrPayload ? note("has ticket code/QR") : ok) });
  await checkCase({ id: "orders.AD04", group: "Orders", name: "POST /orders/:id/refund (admin)", method: "POST", path: `/orders/${o1Id}/refund`, cookies: "admin", expectedStatus: 200 });
  await checkCase({ id: "orders.AD05", group: "Orders", name: "POST /orders/:id/mark-pending-payment (user) → 403", method: "POST", path: `/orders/${o1Id}/mark-pending-payment`, cookies: "user", expectedStatus: 403 });
}

/* ------------------------------ PAYMENTS -------------------------------- */
await checkCase({ id: "payments.H01", group: "Payments", name: "GET /payments/health → 200", method: "GET", path: "/payments/health", expectedStatus: 200 });
// Debug: surface the exact ids used by the payment-creation cases.
console.log(`[DEBUG] opId=${opId} orvId=${orvId} o1Id=${o1Id} adminId=${ctx.adminId}`);
if (opId) {
  await checkCase({ id: "payments.M00", group: "Payments", name: "GET /payments/order/:orderId (op) — verifies opId is a queryable, UUID-safe order", method: "GET", path: `/payments/order/${opId}`, cookies: "admin", expectedStatus: 200 });
}
if (o1PaymentId) {
  await checkCase({ id: "payments.G01", group: "Payments", name: "GET /payments/:id (owner)", method: "GET", path: `/payments/${o1PaymentId}`, cookies: "user", expectedStatus: 200, validate: (d) => (d?.id === o1PaymentId ? ok : { pass: false, note: "id mismatch" }) });
  await checkCase({ id: "payments.G02", group: "Payments", name: "GET /payments/:id (non-owner) → 403", method: "GET", path: `/payments/${o1PaymentId}`, cookies: "user2", expectedStatus: 403 });
  await checkCase({ id: "payments.G03", group: "Payments", name: "GET /payments/order/:orderId (owner)", method: "GET", path: `/payments/order/${o1Id}`, cookies: "user", expectedStatus: 200, validate: (d) => (Array.isArray(d) ? ok : { pass: false, note: `expected array` }) });
  await checkCase({ id: "payments.G04", group: "Payments", name: "GET /payments/order/:orderId (non-owner) → 403", method: "GET", path: `/payments/order/${o1Id}`, cookies: "user2", expectedStatus: 403 });
}
if (o1TxnId) {
  await checkCase({ id: "payments.G05", group: "Payments", name: "GET /payments/transaction/:txn (admin)", method: "GET", path: `/payments/transaction/${o1TxnId.replaceAll("-", "")}`, cookies: "admin", expectedStatus: 200 });
}
await checkCase({ id: "payments.L01", group: "Payments", name: "GET /payments (admin)", method: "GET", path: "/payments", query: { page: 1, limit: 5 }, cookies: "admin", expectedStatus: 200, validate: (d) => (Array.isArray(d?.data) ? ok : { pass: false, note: "expected {data}" }) });
await checkCase({ id: "payments.L02", group: "Payments", name: "GET /payments (user) → 403", method: "GET", path: "/payments", cookies: "user", expectedStatus: 403 });

const meUser = await checkCase({ id: "payments.U01", group: "Payments", name: "GET /users/me (resolve user id)", method: "GET", path: "/users/me", cookies: "user", expectedStatus: 200 });
if (meUser?.id) {
  await checkCase({ id: "payments.U02", group: "Payments", name: "GET /payments/user/:id (own)", method: "GET", path: `/payments/user/${meUser.id}`, query: { page: 1, limit: 5 }, cookies: "user", expectedStatus: 200, validate: (d) => (Array.isArray(d?.data) ? ok : { pass: false, note: "expected {data}" }) });
}
const user2Me = await checkCase({ id: "payments.U03", group: "Payments", name: "GET /users/me (user2)", method: "GET", path: "/users/me", cookies: "user2", expectedStatus: 200 });
if (user2Me?.id) {
  await checkCase({ id: "payments.U04", group: "Payments", name: "GET /payments/user/:id (own, user2)", method: "GET", path: `/payments/user/${user2Me.id}`, cookies: "user2", expectedStatus: 200 });
  if (meUser?.id !== user2Me.id) {
    await checkCase({ id: "payments.U05", group: "Payments", name: "GET /payments/user/:id (someone else) → 403", method: "GET", path: `/payments/user/${user2Me.id}`, cookies: "user", expectedStatus: 403 });
  }
}

const pm = await checkCase({ id: "payments.M01", group: "Payments", name: "POST /payments (admin) create", method: "POST", path: "/payments", cookies: "admin", body: { orderId: opId, userId: ctx.adminId, amount: "150000", paymentMethod: "test-card", transactionId: `TESTTXN${tail}001` }, expectedStatus: 201, validate: (d) => (d?.id ? ok : { pass: false, note: "missing id" }) });
const pmId = pm?.id;
await checkCase({ id: "payments.M02", group: "Payments", name: "POST /payments (user) → 403", method: "POST", path: "/payments", cookies: "user", body: { orderId: opId, amount: "100", paymentMethod: "x" }, expectedStatus: 403 });
await checkCase({ id: "payments.M03", group: "Payments", name: "POST /payments invalid body → 400", method: "POST", path: "/payments", cookies: "admin", body: { orderId: 123 }, expectedStatus: 400 });

if (pmId) {
  await checkCase({ id: "payments.M04", group: "Payments", name: "POST /payments/mark-processing (admin)", method: "POST", path: "/payments/mark-processing", cookies: "admin", body: { id: pmId }, expectedStatus: 200 });
  await checkCase({ id: "payments.M05", group: "Payments", name: "POST /payments/mark-paid (admin)", method: "POST", path: "/payments/mark-paid", cookies: "admin", body: { id: pmId }, expectedStatus: 200, validate: (d) => (d?.payment?.id ? ok : { pass: false, note: `expected {payment}` }) });
  await checkCase({ id: "payments.M06", group: "Payments", name: "POST /payments/mark-refunded (admin)", method: "POST", path: "/payments/mark-refunded", cookies: "admin", body: { id: pmId }, expectedStatus: 200 });
  await checkCase({ id: "payments.M07", group: "Payments", name: "DELETE /payments/:id (admin)", method: "DELETE", path: `/payments/${pmId}`, cookies: "admin", expectedStatus: 200 });
}
await checkCase({ id: "payments.M08", group: "Payments", name: "POST /payments/mark-paid missing id → 400", method: "POST", path: "/payments/mark-paid", cookies: "admin", body: {}, expectedStatus: 400 });

const pmf = await checkCase({ id: "payments.M09", group: "Payments", name: "POST /payments (admin) create #failed", method: "POST", path: "/payments", cookies: "admin", body: { orderId: orvId, userId: ctx.adminId, amount: "150000", paymentMethod: "test-card", transactionId: `TESTTXN${tail}002` }, expectedStatus: 201 });
if (pmf?.id) {
  await checkCase({ id: "payments.M10", group: "Payments", name: "POST /payments/mark-failed (admin)", method: "POST", path: "/payments/mark-failed", cookies: "admin", body: { id: pmf.id }, expectedStatus: 200 });
  await checkCase({ id: "payments.M11", group: "Payments", name: "DELETE /payments/:id cleanup", method: "DELETE", path: `/payments/${pmf.id}`, cookies: "admin", expectedStatus: 200 });
}
const pm2 = await checkCase({ id: "payments.M12", group: "Payments", name: "POST /payments (admin) create #cancel", method: "POST", path: "/payments", cookies: "admin", body: { orderId: orvId, userId: ctx.adminId, amount: "150000", paymentMethod: "test-card" }, expectedStatus: 201 });
if (pm2?.id) {
  await checkCase({ id: "payments.M13", group: "Payments", name: "POST /payments/cancel (admin)", method: "POST", path: "/payments/cancel", cookies: "admin", body: { id: pm2.id }, expectedStatus: 200 });
  await checkCase({ id: "payments.M14", group: "Payments", name: "DELETE /payments/:id cleanup #2", method: "DELETE", path: `/payments/${pm2.id}`, cookies: "admin", expectedStatus: 200 });
}
const pm3 = await checkCase({ id: "payments.M15", group: "Payments", name: "POST /payments (admin) create #expire", method: "POST", path: "/payments", cookies: "admin", body: { orderId: orvId, userId: ctx.adminId, amount: "150000", paymentMethod: "test-card" }, expectedStatus: 201 });
if (pm3?.id) {
  await checkCase({ id: "payments.M16", group: "Payments", name: "POST /payments/expire (admin)", method: "POST", path: "/payments/expire", cookies: "admin", body: { id: pm3.id }, expectedStatus: 200 });
  await checkCase({ id: "payments.M17", group: "Payments", name: "DELETE /payments/:id cleanup #3", method: "DELETE", path: `/payments/${pm3.id}`, cookies: "admin", expectedStatus: 200 });
}
// transactionId column is UUID; non-UUID input currently yields 500 (expected 400).
await checkCase({ id: "payments.M18", group: "Payments", name: "POST /payments transactionId not a UUID → 400", method: "POST", path: "/payments", cookies: "admin", body: { orderId: orvId, userId: ctx.adminId, amount: "1000", paymentMethod: "test-card", transactionId: "not-a-uuid" }, expectedStatus: 400 });

/* ------------------------------ VNPAY ----------------------------------- */
await checkCase({ id: "vnpay.C01", group: "VNPay", name: "POST /payments/vnpay/create (owner, pending order)", method: "POST", path: "/payments/vnpay/create", cookies: "user", body: { orderId: orvId }, expectedStatus: 200, validate: (d) => (d?.paymentUrl && d?.transactionId ? ok : { pass: false, note: `expected {paymentUrl, transactionId}` }) });
await checkCase({ id: "vnpay.C02", group: "VNPay", name: "POST /payments/vnpay/create (non-owner) → 403", method: "POST", path: "/payments/vnpay/create", cookies: "user2", body: { orderId: orvId }, expectedStatus: 403 });
await checkCase({ id: "vnpay.C03", group: "VNPay", name: "POST /payments/vnpay/create (anonymous) → 401", method: "POST", path: "/payments/vnpay/create", cookies: "__none__", body: { orderId: orvId }, expectedStatus: 401 });
await checkCase({ id: "vnpay.C04", group: "VNPay", name: "POST /payments/vnpay/create empty body → 400", method: "POST", path: "/payments/vnpay/create", cookies: "user", body: {}, expectedStatus: 400 });
await checkCase({ id: "vnpay.C05", group: "VNPay", name: "POST /payments/vnpay/create closed (refunded) order → 409", method: "POST", path: "/payments/vnpay/create", cookies: "user", body: { orderId: o1Id }, expectedStatus: 409 });
await checkCase({ id: "vnpay.R01", group: "VNPay", name: "GET /payments/vnpay/return garbage → redirect (3xx) or 400", method: "GET", path: "/payments/vnpay/return", query: { vnp_TxnRef: "zzz", vnp_Amount: "123" }, expectedStatus: code(302, 400), validate: null, contentTypeExpected: null });
await checkCase({ id: "vnpay.I01", group: "VNPay", name: "GET /payments/vnpay/ipn garbage → RspCode (not 500)", method: "GET", path: "/payments/vnpay/ipn", query: { vnp_TxnRef: "zzz", vnp_Amount: "123" }, expectedStatus: 200, validate: (d) => (d?.RspCode ? ok : { pass: false, note: `expected {RspCode}` }) });

/* ------------ TICKETS · LIFECYCLE (after checkout fixtures) ------------- */
await checkCase({ id: "tickets.AC01", group: "Tickets", name: "POST publish → ok", method: "POST", path: `/tickets/${ctx.ticketId}/publish`, cookies: "admin", expectedStatus: 200 });
await checkCase({ id: "tickets.AC02", group: "Tickets", name: "POST unpublish → ok", method: "POST", path: `/tickets/${ctx.ticketId}/unpublish`, cookies: "admin", expectedStatus: 200 });
await checkCase({ id: "tickets.AC03", group: "Tickets", name: "POST open-sale → ok", method: "POST", path: `/tickets/${ctx.ticketId}/open-sale`, cookies: "admin", body: {}, expectedStatus: 200 });
await checkCase({ id: "tickets.AC04", group: "Tickets", name: "POST close-sale → ok", method: "POST", path: `/tickets/${ctx.ticketId}/close-sale`, cookies: "admin", expectedStatus: 200 });
await checkCase({ id: "tickets.AC05", group: "Tickets", name: "POST prepare-stock → ok", method: "POST", path: `/tickets/${ctx.ticketId}/prepare-stock`, cookies: "admin", body: { stockInitial: 14, availableSeatLabels: ["T1", "T2", "T3", "T4", "T5"] }, expectedStatus: 200 });
await checkCase({ id: "tickets.AC06", group: "Tickets", name: "POST prepare-stock invalid body → 400", method: "POST", path: `/tickets/${ctx.ticketId}/prepare-stock`, cookies: "admin", body: { stockInitial: "abc" }, expectedStatus: 400 });
await checkCase({ id: "tickets.AC07", group: "Tickets", name: "POST open-sale again after close → ok", method: "POST", path: `/tickets/${ctx.ticketId}/open-sale`, cookies: "admin", body: {}, expectedStatus: 200 });

// Ticket-items CRUD. NOTE: POST ticket-items returns the WHOLE ticket.
const itemCreate = await checkCase({ id: "tickets.I01", group: "Tickets", name: "POST /tickets/:id/ticket-items (admin)", method: "POST", path: `/tickets/${ctx.ticketId}/ticket-items`, cookies: "admin", body: { name: "Extra item", coachCode: "TX", seatClass: "Seat", seatType: "Standard", seatLabels: ["X1", "X2", "X3"], availableSeatLabels: ["X1", "X2", "X3"], stockInitial: 3, stockAvailable: 3, priceOriginal: "50000", priceFlash: "45000", saleStartTime: new Date(Date.now() - 3600000).toISOString(), saleEndTime: new Date(Date.now() + 30 * 86400000).toISOString() }, expectedStatus: 201, validate: (d) => (Array.isArray(d?.ticketItems) && d.ticketItems.length > 0 ? ok : { pass: false, note: "expected ticket with ticketItems" }) });
// NOTE: response is the whole ticket; locate the NEW item by name (order is not guaranteed).
const extraItemId = itemCreate?.ticketItems?.find((i) => i.name === "Extra item")?.id ?? itemCreate?.ticketItems?.at(-1)?.id;
await checkCase({ id: "tickets.I02", group: "Tickets", name: "POST ticket-items (user) → 403", method: "POST", path: `/tickets/${ctx.ticketId}/ticket-items`, cookies: "user2", body: { name: "x" }, expectedStatus: 403 });
if (extraItemId) {
  await checkCase({ id: "tickets.I03", group: "Tickets", name: "GET ticket-item detail (public)", method: "GET", path: `/tickets/${ctx.ticketId}/ticket-items/${extraItemId}`, expectedStatus: 200, validate: (d) => (d?.id === extraItemId ? ok : { pass: false, note: "id mismatch" }) });
  await checkCase({ id: "tickets.I04", group: "Tickets", name: "GET ticket-item availability (public)", method: "GET", path: `/tickets/${ctx.ticketId}/ticket-items/${extraItemId}/availability`, expectedStatus: 200, validate: (d) => (Array.isArray(d?.availableSeatLabels) ? ok : { pass: false, note: "missing availableSeatLabels" }) });
  await checkCase({ id: "tickets.I05", group: "Tickets", name: "PATCH ticket-item (admin)", method: "PATCH", path: `/tickets/${ctx.ticketId}/ticket-items/${extraItemId}`, cookies: "admin", body: { description: "renamed by test" }, expectedStatus: 200 });
  await checkCase({ id: "tickets.I06", group: "Tickets", name: "PATCH ticket-item (user) → 403", method: "PATCH", path: `/tickets/${ctx.ticketId}/ticket-items/${extraItemId}`, cookies: "user2", body: { description: "x" }, expectedStatus: 403 });
  await checkCase({ id: "tickets.I07", group: "Tickets", name: "POST change-price (admin)", method: "POST", path: `/tickets/${ctx.ticketId}/ticket-items/${extraItemId}/change-price`, cookies: "admin", body: { priceOriginal: "60000", priceFlash: "55000" }, expectedStatus: 200 });
  await checkCase({ id: "tickets.I08", group: "Tickets", name: "POST change-price invalid → 400", method: "POST", path: `/tickets/${ctx.ticketId}/ticket-items/${extraItemId}/change-price`, cookies: "admin", body: { priceOriginal: "not-a-number" }, expectedStatus: 400 });
  await checkCase({ id: "tickets.I09", group: "Tickets", name: "POST change-sale-window (admin)", method: "POST", path: `/tickets/${ctx.ticketId}/ticket-items/${extraItemId}/change-sale-window`, cookies: "admin", body: { saleStartTime: new Date().toISOString(), saleEndTime: new Date(Date.now() + 86400000).toISOString() }, expectedStatus: 200 });
  await checkCase({ id: "tickets.I10", group: "Tickets", name: "POST reserve-seat (admin)", method: "POST", path: `/tickets/${ctx.ticketId}/ticket-items/${extraItemId}/reserve-seat`, cookies: "admin", body: { seatLabel: "X1" }, expectedStatus: 200, validate: (d) => (d?.id === extraItemId ? ok : { pass: false, note: "missing item id" }) });
  await checkCase({ id: "tickets.I11", group: "Tickets", name: "POST reserve-seat missing label → 400", method: "POST", path: `/tickets/${ctx.ticketId}/ticket-items/${extraItemId}/reserve-seat`, cookies: "admin", body: {}, expectedStatus: 400 });
  await checkCase({ id: "tickets.I12", group: "Tickets", name: "POST release-seat (admin)", method: "POST", path: `/tickets/${ctx.ticketId}/ticket-items/${extraItemId}/release-seat`, cookies: "admin", body: { seatLabel: "X1" }, expectedStatus: 200 });
}
await checkCase({ id: "tickets.I13", group: "Tickets", name: "DELETE ticket-item (user) → 403", method: "DELETE", path: `/tickets/${ctx.ticketId}/ticket-items/${extraItemId}`, cookies: "user2", expectedStatus: 403 });
if (extraItemId) {
  await checkCase({ id: "tickets.I14", group: "Tickets", name: "DELETE ticket-item (admin)", method: "DELETE", path: `/tickets/${ctx.ticketId}/ticket-items/${extraItemId}`, cookies: "admin", expectedStatus: 200 });
}

await checkCase({ id: "tickets.R01", group: "Tickets", name: "POST /tickets/:id/reserve missing ticketItemId → 400", method: "POST", path: `/tickets/${ctx.ticketId}/reserve`, cookies: "admin", body: {}, expectedStatus: 400 });
await checkCase({ id: "tickets.R02", group: "Tickets", name: "POST /tickets/:id/reserve (admin)", method: "POST", path: `/tickets/${ctx.ticketId}/reserve`, cookies: "admin", body: { ticketItemId: ctx.itemId, quantity: 1 }, expectedStatus: code(200, 409) });
await checkCase({ id: "tickets.R03", group: "Tickets", name: "POST /tickets/:id/release (admin)", method: "POST", path: `/tickets/${ctx.ticketId}/release`, cookies: "admin", body: { ticketItemId: ctx.itemId, quantity: 1 }, expectedStatus: 200 });

/* --------------------------- NOTIFICATIONS ------------------------------ */
await checkCase({ id: "notif.M01", group: "Notifications", name: "GET /notifications/my (authed)", method: "GET", path: "/notifications/my", query: { page: 1, limit: 10 }, cookies: "fresh", expectedStatus: 200, validate: (d) => (Array.isArray(d?.data) ? ok : { pass: false, note: `expected {data,pagination}` }) });
await checkCase({ id: "notif.M02", group: "Notifications", name: "GET /notifications/my (anonymous) → 401", method: "GET", path: "/notifications/my", cookies: "__none__", expectedStatus: 401 });
await checkCase({ id: "notif.M03", group: "Notifications", name: "GET /notifications (admin) page=0 → sanitized", method: "GET", path: "/notifications", query: { page: 0 }, cookies: "admin", expectedStatus: 200 });
await checkCase({ id: "notif.M04", group: "Notifications", name: "GET /notifications (admin)", method: "GET", path: "/notifications", query: { page: 1, limit: 5 }, cookies: "admin", expectedStatus: 200, validate: (d) => (Array.isArray(d?.data) ? ok : { pass: false, note: "expected {data}" }) });
await checkCase({ id: "notif.M05", group: "Notifications", name: "GET /notifications (user) → 403", method: "GET", path: "/notifications", cookies: "user", expectedStatus: 403 });
await checkCase({ id: "notif.M06", group: "Notifications", name: "GET /notifications/my?limit=999 → capped", method: "GET", path: "/notifications/my", query: { limit: 999 }, cookies: "fresh", expectedStatus: 200 });

/* --------------------------- AUTH LOGOUT (last) ------------------------ */
await checkCase({ id: "auth.O01", group: "Auth", name: "POST /auth/logout → ok", method: "POST", path: "/auth/logout", cookies: "fresh", expectedStatus: 200 });

/* ============================ REPORT =================================== */
const totalMs = Math.round(performance.now() - startTime);
const passed = results.filter((r) => r.pass).length;
const failed = results.length - passed;

const summary = {
  generatedAt: nowIso(),
  baseUrl: BASE,
  totalCases: results.length,
  passed,
  failed,
  passRate: results.length ? Math.round((passed / results.length) * 1000) / 10 : 0,
  totalElapsedMs: totalMs,
  avgResponseMs: results.length ? Math.round(results.reduce((s, r) => s + r.responseTimeMs, 0) / results.length) : 0,
  byGroup: Object.fromEntries(
    [...new Set(results.map((r) => r.group))].map((g) => {
      const items = results.filter((r) => r.group === g);
      return [g, { total: items.length, passed: items.filter((r) => r.pass).length, failed: items.filter((r) => !r.pass).length }];
    }),
  ),
};

const outDir = join(dirname(fileURLToPath(import.meta.url)), "test-results");
mkdirSync(outDir, { recursive: true });
const jsonPath = join(outDir, `api-test-results-${stamp}.json`);
writeFileSync(jsonPath, JSON.stringify({ summary, results }, null, 2));

const reportPath = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "api-tests", "api-test-report.md");
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, buildMarkdownReport(summary));

console.log(`\nDone: ${passed}/${results.length} passed, ${failed} failed (${totalMs} ms)`);
console.log(`Detailed JSON: ${jsonPath}`);
console.log(`Report:        ${reportPath}`);

function buildMarkdownReport(summary) {
  const lines = [];
  lines.push(`# Báo cáo kiểm tra API — Railway Ticket Booking`);
  lines.push("");
  lines.push(`- **Ngày tạo:** ${summary.generatedAt}`);
  lines.push(`- **Base URL:** ${summary.baseUrl}`);
  lines.push(`- **Tổng ca kiểm tra:** ${summary.totalCases}`);
  lines.push(`- **Đạt:** ${summary.passed} / **Lỗi:** ${summary.failed} (${summary.passRate}%)`);
  lines.push(`- **Thời gian trung bình/ca:** ${summary.avgResponseMs} ms`);
  lines.push("");
  lines.push(`## Tóm tắt theo nhóm`);
  lines.push("");
  lines.push(`| Nhóm | Tổng | Đạt | Lỗi |`);
  lines.push(`| --- | --- | --- | --- |`);
  for (const [g, v] of Object.entries(summary.byGroup)) {
    lines.push(`| ${g} | ${v.total} | ${v.passed} | ${v.failed} |`);
  }
  lines.push("");
  lines.push(`## Danh sách chi tiết`);
  lines.push("");
  lines.push(`| # | Nhóm | Tên ca | Method | Path | Kỳ vọng | Thực tế | Thời gian (ms) | Kết quả | Lý do |`);
  lines.push(`| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |`);
  results.forEach((r, i) => {
    const exp = r.expectedStatus == null ? "—" : Array.isArray(r.expectedStatus) ? r.expectedStatus.join("|") : String(r.expectedStatus);
    lines.push(`| ${i + 1} | ${r.group} | ${r.name} | ${r.method} | \`${r.path}\` | ${exp} | ${r.actualStatus} | ${r.responseTimeMs} | ${r.pass ? "✅" : "❌"} | ${(r.reason ?? "").replace(/\|/g, "\\|")} |`);
  });
  lines.push("");
  lines.push(`## Ghi chú`);
  lines.push("");
  lines.push(`- Các ca **❌** cần đội phát triển xem xét; chi tiết nằm ở cột *Lý do*.`);
  lines.push(`- Response đầy đủ nằm ở file JSON tương ứng trong \`scripts/test-results/\`.`);
  lines.push("");
  return lines.join("\n");
}