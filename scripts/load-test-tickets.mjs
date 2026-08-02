import { performance } from "node:perf_hooks";

const API_URL = process.env.API_URL || "http://localhost:8080";
const SCENARIO = process.env.SCENARIO || "availability";
const CONCURRENCY = parsePositiveInt(process.env.CONCURRENCY, 10);
const REQUESTS = parsePositiveInt(process.env.REQUESTS, 200);
const TICKET_ID = process.env.TICKET_ID || "";
const TICKET_ITEM_ID = process.env.TICKET_ITEM_ID || "";
const SEAT_LABELS = (process.env.SEAT_LABELS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const AUTH_COOKIE = process.env.AUTH_COOKIE || "";
const EXTRA_HEADERS = parseHeaders(process.env.EXTRA_HEADERS || "");

async function main() {
  validateConfig();

  const latencies = [];
  const errors = [];
  const statusCounts = new Map();
  const startedAt = performance.now();
  let completed = 0;
  let success = 0;

  const workers = Array.from({ length: CONCURRENCY }, (_, index) =>
    runWorker(index, async () => {
      const requestIndex = completed++;
      if (requestIndex >= REQUESTS) {
        return false;
      }

      const beganAt = performance.now();

      try {
        const response = await executeScenario(index, requestIndex);
        const elapsed = performance.now() - beganAt;
        latencies.push(elapsed);
        success += 1;
        statusCounts.set(
          response.status,
          (statusCounts.get(response.status) || 0) + 1,
        );
      } catch (error) {
        const elapsed = performance.now() - beganAt;
        latencies.push(elapsed);
        errors.push(error instanceof Error ? error.message : String(error));
      }

      return true;
    }),
  );

  await Promise.all(workers);

  const totalMs = performance.now() - startedAt;
  printSummary({
    totalMs,
    success,
    failures: REQUESTS - success,
    latencies,
    errors,
    statusCounts,
  });
}

async function runWorker(workerIndex, next) {
  while (await next(workerIndex)) {
    // Loop until the shared request budget is exhausted.
  }
}

async function executeScenario(workerIndex, requestIndex) {
  switch (SCENARIO) {
    case "availability":
      return request(`/tickets/${TICKET_ID}/availability`);
    case "seat-map":
      return request(`/tickets/${TICKET_ID}/seat-map`);
    case "reserve-seat-release":
      return reserveAndRelease(workerIndex, requestIndex);
    default:
      throw new Error(
        `Unsupported SCENARIO="${SCENARIO}". Use availability, seat-map, or reserve-seat-release.`,
      );
  }
}

async function reserveAndRelease(workerIndex, requestIndex) {
  const seatLabel = SEAT_LABELS[workerIndex];
  const passengerId = `load-${workerIndex + 1}-${requestIndex + 1}`;

  const reserveResponse = await request(
    `/tickets/${TICKET_ID}/ticket-items/${TICKET_ITEM_ID}/reserve-seat`,
    {
      method: "POST",
      body: {
        seatLabel,
        passengerId,
      },
    },
  );

  await request(`/tickets/${TICKET_ID}/ticket-items/${TICKET_ITEM_ID}/release-seat`, {
    method: "POST",
    body: {
      seatLabel,
      passengerId,
    },
  });

  return reserveResponse;
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...EXTRA_HEADERS,
    ...(options.headers || {}),
  };

  if (AUTH_COOKIE) {
    headers.Cookie = AUTH_COOKIE;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = safeJson(text);

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : text || response.statusText;
    throw new Error(`${response.status} ${options.method || "GET"} ${path}: ${message}`);
  }

  return {
    status: response.status,
    data,
  };
}

function safeJson(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function validateConfig() {
  if (!TICKET_ID) {
    throw new Error("Missing TICKET_ID.");
  }

  if (SCENARIO === "reserve-seat-release") {
    if (!TICKET_ITEM_ID) {
      throw new Error("reserve-seat-release requires TICKET_ITEM_ID.");
    }

    if (!AUTH_COOKIE) {
      throw new Error(
        "reserve-seat-release requires AUTH_COOKIE because reserve-seat endpoints are authenticated.",
      );
    }

    if (SEAT_LABELS.length === 0) {
      throw new Error(
        "reserve-seat-release requires SEAT_LABELS, for example SEAT_LABELS=A1,A2,A3.",
      );
    }

    if (CONCURRENCY > SEAT_LABELS.length) {
      throw new Error(
        `CONCURRENCY=${CONCURRENCY} is higher than available SEAT_LABELS=${SEAT_LABELS.length}. Give each worker a unique seat label.`,
      );
    }
  }
}

function parseHeaders(raw) {
  if (!raw.trim()) {
    return {};
  }

  return raw.split(";").reduce((headers, entry) => {
    const [key, ...rest] = entry.split("=");
    if (!key || rest.length === 0) {
      return headers;
    }

    headers[key.trim()] = rest.join("=").trim();
    return headers;
  }, {});
}

function parsePositiveInt(raw, fallback) {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function percentile(sortedValues, ratio) {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * ratio) - 1),
  );
  return sortedValues[index];
}

function printSummary({ totalMs, success, failures, latencies, errors, statusCounts }) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg =
    latencies.length === 0
      ? 0
      : latencies.reduce((sum, value) => sum + value, 0) / latencies.length;
  const seconds = totalMs / 1000;

  console.log("");
  console.log(`Ticket load scenario: ${SCENARIO}`);
  console.log(`Target: ${API_URL}`);
  console.log(`Requests: ${REQUESTS}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Success: ${success}`);
  console.log(`Failures: ${failures}`);
  console.log(`Elapsed: ${seconds.toFixed(2)}s`);
  console.log(`Throughput: ${(REQUESTS / seconds).toFixed(2)} req/s`);
  console.log(`Avg latency: ${avg.toFixed(2)} ms`);
  console.log(`P50 latency: ${percentile(sorted, 0.5).toFixed(2)} ms`);
  console.log(`P95 latency: ${percentile(sorted, 0.95).toFixed(2)} ms`);
  console.log(`P99 latency: ${percentile(sorted, 0.99).toFixed(2)} ms`);
  console.log("");
  console.log("Status counts:");

  if (statusCounts.size === 0) {
    console.log("- none");
  } else {
    for (const [status, count] of [...statusCounts.entries()].sort((a, b) => a[0] - b[0])) {
      console.log(`- ${status}: ${count}`);
    }
  }

  if (errors.length > 0) {
    console.log("");
    console.log("Sample errors:");
    for (const message of errors.slice(0, 10)) {
      console.log(`- ${message}`);
    }
  }

  console.log("");
  console.log("Examples:");
  console.log(
    '- Read availability: `set TICKET_ID=<id> && set SCENARIO=availability && node scripts/load-test-tickets.mjs`',
  );
  console.log(
    '- Read seat map: `set TICKET_ID=<id> && set SCENARIO=seat-map && set CONCURRENCY=20 && set REQUESTS=500 && node scripts/load-test-tickets.mjs`',
  );
  console.log(
    '- Reserve/release: `set TICKET_ID=<id> && set TICKET_ITEM_ID=<itemId> && set SCENARIO=reserve-seat-release && set SEAT_LABELS=A1,A2,A3,A4,A5 && set AUTH_COOKIE=accessToken=...; refreshToken=... && node scripts/load-test-tickets.mjs`',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
