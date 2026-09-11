# Railway Ticket Booking

Repo nay la mot he thong dat ve tau tach thanh nhieu ung dung doc lap:

- `client`: Next.js 16 frontend cho nguoi dung va admin
- `api-gateway`: NestJS HTTP gateway cho browser/client
- `auth-service`, `tickets-service`, `orders-service`, `payments-service`, `notification-service`: NestJS microservices giao tiep qua RabbitMQ (auth-service quan ly ca Auth & Users; tickets-service quan ly ca Tickets & Search)

`api-gateway` la diem vao HTTP. Cac service phia sau chu yeu nhan message qua RMQ (`ClientProxy.send(...)`, `@MessagePattern(...)`). Hien tai co them luong event chon loc `payment.paid` tu `payments-service` sang `orders-service`.

## Kien truc tong quan

```text
client (Next.js, http://localhost:3000)
  -> api-gateway (NestJS HTTP, http://localhost:8080)
    -> auth-service (Auth + User Profile)
    -> tickets-service (Tickets + Station Search)
    -> orders-service
    -> payments-service
    - notification-service
```

## Cac he thong da trien khai

Repo nay khong chi la CRUD app — day la danh sach cac he thong/co che ky thuat tieu bieu da duoc trien khai trong ma nguon, kem vi tri cu the:

| #   | He thong                                          | Van de giai quyet                                                                                                                                                                                                                     | Vi tri                                                                                             |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | **API Gateway + Global Guard Chain**              | Bao mat tap trung: `Throttler → JwtAuth → Roles` chay toan cuc, moi endpoint mac dinh duoc bao ve, chi `@Public()` moi bypass                                                                                                         | `api-gateway/src/api-gateway.module.ts`                                                            |
| 2   | **Distributed Locking (Redlock + fencing token)** | Chong double-booking ghe khi 2 request cung chot 1 ghe; auto-extension (`redlock.using()`) de lock khong het han giua chung                                                                                                           | `tickets-service/src/redis/redis.service.ts`, `ticket.service.ts`                                  |
| 3   | **Transactional Outbox**                          | Giai quyet dual-write problem: event `payment.paid` duoc ghi cung DB transaction voi trang thai Paid; cron worker publish moi 10s + exponential backoff                                                                               | `payments-service/src/payment.service.ts`, `prisma/schema.prisma` (bang `PaymentOutbox`)           |
| 4   | **Saga Choreography + Compensation**              | Distributed transaction: `payment.paid` → markPaid → confirm → issueTicket → email; that bai/het han thi compensation (cancelWorkflow, release seats) thay vi rollback 2PC                                                            | `orders-service/src/order.service.ts` (`handlePaymentPaidEvent`, `cancelWorkflow`)                 |
| 5   | **Delayed Queue (TTL + Dead-Letter)**             | "Bo dem nguoc" 10 phut khong can cron server: message nam trong `orders_expiration_queue` co `x-message-ttl: 600000`, het TTL thi dead-letter sang queue xu ly expire                                                                 | `orders-service/src/order.module.ts`, `main.ts`                                                    |
| 6   | **Idempotency Key**                               | Chong tao order trung khi client double-click/retry: unique constraint tren `idempotency_key`, request trung key → replay response                                                                                                    | `orders-service/src/order.service.ts` (`checkout`), migration `20260813000000_add_idempotency_key` |
| 7   | **Redis Sentinel HA Cluster**                     | High-availability cache + lock: 1 Master + 2 Replica + 3 Sentinel (quorum 2/3 chong split-brain), auto-failover; app tach read replica (round-robin) / write master                                                                   | `infra/docker/docker-compose.yml`, `tickets-service/src/redis/`                                    |
| 8   | **Database-per-Service (Polyglot Persistence)**   | Data isolation: PostgreSQL cho auth/orders/payments/notifications/tickets (moi DB rieng); Redis cho cache + lock. tickets-service da migrate tu MongoDB sang PostgreSQL voi `SELECT ... FOR UPDATE` row lock thay cho read-then-write | `infra/docker/init-databases.sql`, cac `prisma/schema.prisma`                                      |
| 9   | **VNPay Payment IPN Integration**                 | Thanh toan server-to-server: IPN la nguon truth (verify checksum → check amount → idempotent status), Return URL chi hien thi; xu ly TxnRef 32-char va dong stale payment truoc khi issue TxnRef moi                                  | `api-gateway/src/payment/vnpay.service.ts`                                                         |
| 10  | **Email Token Security (hashed token)**           | Reset/verification token chi luu hash trong DB, raw token chi di qua email, co expiry; forgot-password tra generic message chong email enumeration                                                                                    | `auth-service/src/auth.service.ts`                                                                 |
| 11  | **Nginx Reverse Proxy + Container Infra**         | Single entry port 80: route `/api/*` → gateway, `/*` → Next.js; gzip, security headers, rate limit 2 tang (api 20r/s, auth 5r/s); DB/MQ chi internal network; Docker multi-stage + non-root                                           | `infra/nginx/default.conf`, `infra/docker/docker-compose.yml`                                      |
| 12  | **Client State Layer + Refresh Dedupe**           | TanStack Query cho server-state; axios interceptor voi refresh-token deduplication (singleton promise — nhieu request 401 dong thoi chi fire 1 refresh)                                                                               | `client/lib/http.ts`, `client/app/providers.tsx`                                                   |

### Luong thanh toan end-to-end

Chuoi xu ly thanh toan la to hop 5 he thong (3 + 4 + 5 + 6 + 9), gom 3 giai doan:

1. **Checkout & giu ghe** — Redlock hold seats → tao order (idempotency key) → emit vao TTL queue
2. **Thanh toan thanh cong** — VNPay IPN → Outbox (cung transaction) → cron publish → Saga `payment.paid` → issueTicket + email
3. **Compensation** — TTL 10 phut het han → expire order + payment → hoan ghe ve kho

## Cau truc repo

```text
.
|- client/
|- api-gateway/
|- auth-service/
|- tickets-service/
|- orders-service/
|- payments-service/
|- notification-service/
|- infra/
|  |- docker/
|  \- nginx/
\- README.md
```

## Service map

| App                    | Vai tro                                                           | Kieu chay             | Cong / Queue                                   |
| ---------------------- | ----------------------------------------------------------------- | --------------------- | ---------------------------------------------- |
| `client`               | UI cho user/admin                                                 | Next.js HTTP app      | `3000`                                         |
| `api-gateway`          | HTTP gateway, cookie auth, forward request vao RMQ                | Nest HTTP app         | `8080`                                         |
| `auth-service`         | dang ky, dang nhap, refresh token, reset password, quan ly user   | Nest RMQ microservice | `auth_queue`                                   |
| `tickets-service`      | CRUD ticket, stock, seat map, reserve/release, tim kiem ga/chuyen | Nest RMQ microservice | `tickets_queue`                                |
| `orders-service`       | checkout, order workflow, issue ticket, cancel/refund             | Nest RMQ microservice | `orders_queue`, `orders_expired_process_queue` |
| `payments-service`     | tao payment, doi trang thai thanh toan                            | Nest RMQ microservice | `payments_queue`                               |
| `notification-service` | gui email thong bao                                               | Nest RMQ microservice | `notifications_queue`                          |

## Luu tru du lieu hien tai

Toan bo backend service dung PostgreSQL voi database rieng de dam bao data isolation (tickets-service da migrate tu MongoDB sang PostgreSQL):

| App                    | Luu tru                           | Database                |
| ---------------------- | --------------------------------- | ----------------------- |
| `auth-service`         | Prisma + PostgreSQL               | `railway_auth`          |
| `orders-service`       | Prisma + PostgreSQL               | `railway_orders`        |
| `payments-service`     | Prisma + PostgreSQL               | `railway_payments`      |
| `notification-service` | Prisma + PostgreSQL               | `railway_notifications` |
| `tickets-service`      | Prisma + PostgreSQL + Redis cache | `railway_tickets`       |

Luu y quan trong:

- File `infra/docker/init-databases.sql` se tu dong tao cac database rieng khi PostgreSQL container khoi dong lan dau. Service `db-migrate` trong full Compose se chay migration truoc khi cac service PostgreSQL khoi dong.
- tickets-service dung 2 bang `tickets` + `ticket_items` (FK 1:N). Cac flow reserve/release chay trong `$transaction` voi `SELECT ... FOR UPDATE` tren row cua ticket de serialize mutation.
- Sau khi cai dependency hoac sua schema, can chay `npx prisma generate` trong tung service.
- De migrate du lieu cu tu MongoDB: `scripts/migrate-tickets-mongo-to-pg.mjs` (idempotent, chay nhieu lan duoc).

## Yeu cau moi truong

- Node.js 20+
- npm
- Docker Desktop (de chay PostgreSQL, Redis, RabbitMQ)

## Bien moi truong toi thieu

### `api-gateway`

```env
PORT=8080
CLIENT_ORIGIN=http://localhost:3000
```

### `client`

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### `auth-service`

```env
DATABASE_URL=postgresql://app:app@localhost:5432/railway_auth
JWT_SECRET=change-me
```

### `orders-service`

```env
DATABASE_URL=postgresql://app:app@localhost:5432/railway_orders
```

### `payments-service`

```env
DATABASE_URL=postgresql://app:app@localhost:5432/railway_payments
```

### `notification-service`

```env
DATABASE_URL=postgresql://app:app@localhost:5432/railway_notifications
```

### `tickets-service`

```env
DATABASE_URL=postgresql://app:app@localhost:5432/railway_tickets
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Chay ha tang local

Co 2 cach:

- `infra/docker/docker-compose.dev.yml`: ha tang local toi thieu cho dev hien tai (RabbitMQ).
- `infra/docker/docker-compose.yml`: full stack gom ca backend containers + Redis Sentinel cluster + PostgreSQL.

Tu root repo:

```powershell
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

Stack dev nhe nay se dung:

- RabbitMQ: `localhost:5672`
- RabbitMQ management: `http://localhost:15672`

Neu can full stack Docker, copy `infra/docker/.env.docker.example` thanh `.env.docker` trong cung thu muc, thay moi placeholder bang secret/URL that va chay:

```powershell
docker compose --env-file infra/docker/.env.docker -f infra/docker/docker-compose.yml up -d --build
```

Full Compose chi expose Nginx o port `80`; API gateway va client chi truy cap noi bo. Phai dat TLS/HTTPS o reverse proxy hoac load balancer truoc khi dung production. Khi `NODE_ENV=production`, gateway tu choi CORS HTTP, VNPay test mode va cac VNPay secret/URL placeholder.

## Cai dat dependencies

Moi app la mot project doc lap. Can cai rieng:

```powershell
cd api-gateway; npm install
cd ..\auth-service; npm install
cd ..\tickets-service; npm install
cd ..\orders-service; npm install
cd ..\payments-service; npm install
cd ..\notification-service; npm install
cd ..\client; npm install
```

## Cau hinh env

- Tao `.env` rieng trong tung app bang cach copy tu file `.env.example` cung cap san.
- Khong commit `.env` that, repo da ignore toan bo `.env` va chi giu lai example templates.

Danh sach example files:

- `auth-service/.env.example`
- `orders-service/.env.example`
- `payments-service/.env.example`
- `notification-service/.env.example`
- `tickets-service/.env.example`
- `api-gateway/.env.example`
- `client/.env.example`

Kiem tra `.env` thuc te co lech voi template khong:

```powershell
.\scripts\check-env-template.ps1
```

Neu Prisma client chua duoc tao dung, chay them trong tung service dung Prisma:

```powershell
cd auth-service; npx prisma generate
cd ..\tickets-service; npx prisma generate
cd ..\orders-service; npx prisma generate
cd ..\payments-service; npx prisma generate
cd ..\notification-service; npx prisma generate
```

## Prisma migrations

Nam relational service da co baseline migration trong `prisma/migrations`. Kiem tra truoc khi deploy:

```powershell
.\scripts\migrate-databases.ps1 -DryRun
```

Ap dung vao cac database da duoc cau hinh trong `.env` cua tung service:

```powershell
.\scripts\migrate-databases.ps1
```

## Thu tu chay local de dev

1. Chay ha tang:

```powershell
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

2. Start cac microservice backend:

```powershell
cd auth-service; npm run start:dev
cd ..\tickets-service; npm run start:dev
cd ..\orders-service; npm run start:dev
cd ..\payments-service; npm run start:dev
cd ..\notification-service; npm run start:dev
```

3. Start gateway:

```powershell
cd api-gateway
npm run start:dev
```

6. Start frontend:

```powershell
cd client
npm run dev
```

Sau do mo:

- Frontend: `http://localhost:3000`
- API gateway: `http://localhost:8080`

## Giam lag khi dev

- Uu tien Docker cho infra toi thieu, con Nest/Next chay native bang `npm run start:dev` va `npm run dev`.
- Khong can start tat ca service neu ban chi sua 1 flow.
- Redis Sentinel cluster trong full compose khong can cho dev hang ngay; `tickets-service` da tro sang Redis Cloud.
- Khi xong, tat stack nhe:

```powershell
docker compose -f infra/docker/docker-compose.dev.yml down
```

## HTTP surface qua `api-gateway`

Gateway hien expose cac nhom route chinh:

- `/auth`
- `/users`
- `/search`
- `/tickets`
- `/orders`
- `/payments`

Client frontend dang goi `api-gateway` qua `withCredentials: true`, nen auth flow hien tai la cookie-based:

- `api-gateway` set/xoa `HttpOnly` cookies `accessToken` va `refreshToken`
- client goi `GET /auth/session` de lay user hien tai
- khi `401`, client co co che refresh token roi retry request

## Script hay dung

Trong tung app backend:

```powershell
npm run start:dev
npm run build
npm run lint
npm run test
npm run typecheck:tsc
```

Trong `client`:

```powershell
npm run dev
npm run build
npm run lint
```

## Tinh trang hien tai can biet

- Repo da tach thanh sibling services, khong phai Nest monorepo chung.
- Moi relational service PostgreSQL co database rieng (`railway_auth`, `railway_users`, `railway_orders`, `railway_payments`, `railway_notifications`) va baseline Prisma migration. Full Compose chay `db-migrate` one-shot truoc khi start cac service nay.
- `api-gateway` nen giu mong, business flow dai hoi nen nam o domain service.
- `orders-service` luu order bang Prisma + PostgreSQL, gom order, seat labels va passengers. Service nay lang nghe 2 RMQ queue: `orders_queue` va `orders_expired_process_queue`.
- `payments-service -> orders-service` da co event `payment.paid`, nhung phan lon flow van la command/query dong bo qua RabbitMQ.
- `notification-service` chi nhan event tu cac service khac (auth, orders), khong co HTTP endpoint.
- Cac RMQ queue nghiep vu la durable, xu ly voi manual acknowledgement va dead-letter vao `railway_dead_letter_queue` khi handler loi. Can theo doi/replay DLQ bang RabbitMQ Management trong van hanh.
- Google OAuth dang duoc an o client va gateway tra `501` thay vi redirect bang client id gia; chi mo lai sau khi co provider flow day du.

Khi deploy len RabbitMQ da co queue cu, RabbitMQ khong cho doi `durable` hay DLQ arguments tren queue dang ton tai. Sau khi drain message an toan, can xoa va de service tao lai: `auth_queue`, `tickets_queue`, `orders_queue`, `orders_expiration_queue`, `orders_expired_process_queue`, `payments_queue`, va `notifications_queue`. Khong purge hoac xoa queue khi chua backup/kiem dem message dang cho xu ly.

- `client/README.md` hien van la README mac dinh cua Next.js, khong phan anh toan bo repo nay.

## Goi y verify sau khi sua code

Neu sua backend:

```powershell
cd <service>
npm run typecheck:tsc
npm run build
```

Neu sua frontend:

```powershell
cd client
npm run lint
npm run build
```
