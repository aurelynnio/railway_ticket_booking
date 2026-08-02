# Railway Ticket Booking

Repo nay la mot he thong dat ve tau tach thanh nhieu ung dung doc lap:

- `client`: Next.js 16 frontend cho nguoi dung va admin
- `api-gateway`: NestJS HTTP gateway cho browser/client
- `auth-service`, `users-service`, `search-service`, `tickets-service`, `orders-service`, `payments-service`, `notification-service`: NestJS microservices giao tiep qua RabbitMQ

`api-gateway` la diem vao HTTP. Cac service phia sau chu yeu nhan message qua RMQ (`ClientProxy.send(...)`, `@MessagePattern(...)`). Hien tai co them luong event chon loc `payment.paid` tu `payments-service` sang `orders-service`.

## Kien truc tong quan

```text
client (Next.js, http://localhost:3000)
  -> api-gateway (NestJS HTTP, http://localhost:8080)
    -> auth-service
    -> users-service
    -> search-service
    -> tickets-service
    -> orders-service
    -> payments-service
```

## Cau truc repo

```text
.
|- client/
|- api-gateway/
|- auth-service/
|- users-service/
|- search-service/
|- tickets-service/
|- orders-service/
|- payments-service/
|- infra/
|  |- docker/
|  \- nginx/
\- README.md
```

## Service map

| App | Vai tro | Kieu chay | Cong / Queue |
| --- | --- | --- | --- |
| `client` | UI cho user/admin | Next.js HTTP app | `3000` |
| `api-gateway` | HTTP gateway, cookie auth, forward request vao RMQ | Nest HTTP app | `8080` |
| `auth-service` | dang ky, dang nhap, refresh token, reset password | Nest RMQ microservice | `auth_queue` |
| `users-service` | danh sach user, profile, update user | Nest RMQ microservice | `users_queue` |
| `search-service` | tim hanh trinh/ve tau | Nest RMQ microservice | `search_queue` |
| `tickets-service` | CRUD ticket, stock, seat map, reserve/release | Nest RMQ microservice | `tickets_queue` |
| `orders-service` | checkout, order workflow, issue ticket, cancel/refund | Nest RMQ microservice | `orders_queue`, `orders_expired_process_queue` |
| `payments-service` | tao payment, doi trang thai thanh toan | Nest RMQ microservice | `payments_queue` |
| `notification-service` | gui email thong bao | Nest RMQ microservice | `notifications_queue` |

## Luu tru du lieu hien tai

Moi service MySQL co database rieng biet de dam bao data isolation:

| App | Luu tru | Database |
| --- | --- | --- |
| `auth-service` | Prisma + MySQL | `railway_auth` |
| `users-service` | Prisma + MySQL | `railway_users` |
| `orders-service` | Prisma + MySQL | `railway_orders` |
| `payments-service` | Prisma + MySQL | `railway_payments` |
| `notification-service` | Prisma + MySQL | `railway_notifications` |
| `search-service` | Prisma + MongoDB + Elasticsearch | `railway_ticket_search` |
| `tickets-service` | Prisma + MongoDB + Redis cache | `railway_ticket_tickets` |

Luu y quan trong:

- File `infra/docker/init-databases.sql` se tu dong tao cac database rieng khi MySQL container khoi dong lan dau.
- `search-service` su dung Elasticsearch de tim kiem nhanh. Neu chua co ES, search se fallback ve MongoDB.
- Sau khi cai dependency hoac sua schema, can chay `npx prisma generate` trong tung service.

## Yeu cau moi truong

- Node.js 20+
- npm
- Docker Desktop (de chay MySQL, Redis, RabbitMQ)
- MongoDB local/container neu can `search-service` va `tickets-service`
- Elasticsearch 8.x (tu dong chay qua Docker Compose)

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
DATABASE_URL=mysql://app:app@localhost:3306/railway_auth
JWT_SECRET=change-me
```

### `users-service`

```env
DATABASE_URL=mysql://app:app@localhost:3306/railway_users
```

### `orders-service`

```env
DATABASE_URL=mysql://app:app@localhost:3306/railway_orders
```

### `payments-service`

```env
DATABASE_URL=mysql://app:app@localhost:3306/railway_payments
```

### `notification-service`

```env
DATABASE_URL=mysql://app:app@localhost:3306/railway_notifications
```

### `search-service`

```env
DATABASE_URL=mongodb://localhost:27017/railway_ticket_search
ELASTICSEARCH_URL=http://localhost:9200
```

### `tickets-service`

```env
DATABASE_URL=mongodb://localhost:27017/railway_ticket_tickets
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Chay ha tang local

Co 2 cach:

- `infra/docker/docker-compose.dev.yml`: ha tang local toi thieu cho dev hien tai. Sau khi chuyen SQL sang Supabase, cache sang Redis Cloud, va Mongo sang Atlas, stack nay chi can RabbitMQ.
- `infra/docker/docker-compose.yml`: full stack cu, gom ca backend containers + Redis Sentinel cluster. Nang hon, hop cho smoke test gan production.

Tu root repo:

```powershell
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

Stack dev nhe nay se dung:

- RabbitMQ: `localhost:5672`
- RabbitMQ management: `http://localhost:15672`

Neu can full stack Docker:

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
```

## Cai dat dependencies

Moi app la mot project doc lap. Can cai rieng:

```powershell
cd api-gateway; npm install
cd ..\auth-service; npm install
cd ..\users-service; npm install
cd ..\search-service; npm install
cd ..\tickets-service; npm install
cd ..\orders-service; npm install
cd ..\payments-service; npm install
cd ..\client; npm install
```

## Cau hinh env

- Tao `.env` rieng trong tung app bang cach copy tu file `.env.example` cung cap san.
- Khong commit `.env` that, repo da ignore toan bo `.env` va chi giu lai example templates.
- Vi cloud credentials da tung bi paste vao chat/local files, hay rotate lai Supabase, MongoDB Atlas, Redis Cloud, JWT, SMTP, VNPay, va Google OAuth secrets truoc khi deploy that.

Danh sach example files:

- `auth-service/.env.example`
- `users-service/.env.example`
- `orders-service/.env.example`
- `payments-service/.env.example`
- `notification-service/.env.example`
- `search-service/.env.example`
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
cd ..\users-service; npx prisma generate
cd ..\orders-service; npx prisma generate
cd ..\payments-service; npx prisma generate
cd ..\notification-service; npx prisma generate
cd ..\search-service; npx prisma generate
cd ..\tickets-service; npx prisma generate
```

## Thu tu chay local de dev

1. Chay ha tang nhe:

```powershell
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

2. `search-service` va `tickets-service` hien dang tro sang MongoDB Atlas qua `DATABASE_URL`.
3. `tickets-service` hien dung Redis Cloud, khong can Redis local nua.
4. Start cac microservice backend:

```powershell
cd auth-service; npm run start:dev
cd ..\users-service; npm run start:dev
cd ..\orders-service; npm run start:dev
cd ..\payments-service; npm run start:dev
cd ..\notification-service; npm run start:dev
cd ..\search-service; npm run start:dev
cd ..\tickets-service; npm run start:dev
```

5. Start gateway:

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
- Moi service MySQL co database rieng (`railway_auth`, `railway_users`, `railway_orders`, `railway_payments`, `railway_notifications`).
- `api-gateway` nen giu mong, business flow dai hoi nen nam o domain service.
- `orders-service` luu order bang Prisma + MySQL, gom order, seat labels va passengers. Service nay lang nghe 2 RMQ queue: `orders_queue` va `orders_expired_process_queue`.
- `payments-service -> orders-service` da co event `payment.paid`, nhung phan lon flow van la command/query dong bo qua RabbitMQ.
- `notification-service` chi nhan event tu cac service khac (auth, orders), khong co HTTP endpoint.
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
