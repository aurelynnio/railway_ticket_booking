# Railway Ticket Booking

Repo nay la mot he thong dat ve tau tach thanh nhieu ung dung doc lap:

- `client`: Next.js 16 frontend cho nguoi dung va admin
- `api-gateway`: NestJS HTTP gateway cho browser/client
- `auth-service`, `users-service`, `search-service`, `tickets-service`, `orders-service`, `payments-service`: NestJS microservices giao tiep qua RabbitMQ

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
| `orders-service` | checkout, order workflow, issue ticket, cancel/refund | Nest RMQ microservice | `orders_queue` |
| `payments-service` | tao payment, doi trang thai thanh toan | Nest RMQ microservice | `payments_queue` |

## Luu tru du lieu hien tai

| App | Luu tru |
| --- | --- |
| `auth-service` | Prisma + MySQL |
| `users-service` | Prisma + MySQL |
| `payments-service` | Prisma + MySQL |
| `orders-service` | Prisma + MySQL |
| `search-service` | Prisma + MongoDB |
| `tickets-service` | Prisma + MongoDB + Redis cache |

Luu y quan trong:

- `infra/docker/docker-compose.yml` hien chi dung MySQL, Redis, RabbitMQ.
- Neu muon chay `search-service` va `tickets-service`, ban can tu cap them MongoDB va `DATABASE_URL` phu hop.
- `orders-service` da luu order bang Prisma + MySQL; can chay `npx prisma generate` sau khi cai dependency hoac sua schema.

## Yeu cau moi truong

- Node.js 20+
- npm
- Docker Desktop (de chay MySQL, Redis, RabbitMQ)
- MongoDB local/container neu can `search-service` va `tickets-service`

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
DATABASE_URL=mysql://app:app@localhost:3306/railway_ticket_booking
JWT_SECRET=change-me
```

### `users-service`

```env
DATABASE_URL=mysql://app:app@localhost:3306/railway_ticket_booking
```

### `payments-service`

```env
DATABASE_URL=mysql://app:app@localhost:3306/railway_ticket_booking
```

### `orders-service`

```env
DATABASE_URL=mysql://app:app@localhost:3306/railway_ticket_booking
```

### `search-service`

```env
DATABASE_URL=mongodb://localhost:27017/railway_ticket_search
```

### `tickets-service`

```env
DATABASE_URL=mongodb://localhost:27017/railway_ticket_tickets
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Chay ha tang local

Tu root repo:

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
```

Stack nay se dung:

- MySQL: `localhost:3306`
- Redis: `localhost:6379`
- RabbitMQ: `localhost:5672`
- RabbitMQ management: `http://localhost:15672`

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

Neu Prisma client chua duoc tao dung, chay them trong tung service dung Prisma:

```powershell
cd auth-service; npx prisma generate
cd ..\users-service; npx prisma generate
cd ..\payments-service; npx prisma generate
cd ..\search-service; npx prisma generate
cd ..\tickets-service; npx prisma generate
cd ..\orders-service; npx prisma generate
```

## Thu tu chay local de dev

1. Chay ha tang trong `infra/docker`.
2. Dam bao MongoDB da san sang neu can `search-service` va `tickets-service`.
3. Start cac microservice backend:

```powershell
cd auth-service; npm run start:dev
cd ..\users-service; npm run start:dev
cd ..\search-service; npm run start:dev
cd ..\tickets-service; npm run start:dev
cd ..\orders-service; npm run start:dev
cd ..\payments-service; npm run start:dev
```

4. Start gateway:

```powershell
cd api-gateway
npm run start:dev
```

5. Start frontend:

```powershell
cd client
npm run dev
```

Sau do mo:

- Frontend: `http://localhost:3000`
- API gateway: `http://localhost:8080`

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
- `api-gateway` nen giu mong, business flow dai hoi nen nam o domain service.
- `orders-service` luu order bang Prisma + MySQL, gom order, seat labels va passengers.
- `payments-service -> orders-service` da co event `payment.paid`, nhung phan lon flow van la command/query dong bo qua RabbitMQ.
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
