# Báo cáo khắc phục bảo mật

Ngày thực hiện: 2026-09-02
Phạm vi: toàn bộ backend repo (`api-gateway`, 5 microservice, `infra/`, CI/CD, tài liệu)
Kết quả kiểm chứng: **6/6 service build thành công, 93/93 unit test pass**, `docker compose config` hợp lệ, Prisma schema hợp lệ.

---

## 1. Tóm tắt

Đã khắc phục **9 lỗ hổng Critical/High**, **11 vấn đề Medium** và một phần Low.
Ba nhóm không sửa được bằng code (cần quyết định sản phẩm hoặc nâng major) được ghi rõ ở mục 4.

| Mức | Đã sửa | Chưa sửa (có lý do) |
| --- | --- | --- |
| Critical | 1 | 0 |
| High | 8 | 0 |
| Medium | 11 | 2 |
| Low / CVE | 6 | 2 |

---

## 2. Chi tiết đã khắc phục

### 2.1 Critical

**C1. JWT secret placeholder lọt qua kiểm tra production → giả mạo token**

- `auth-service/src/auth/auth.module.ts`: thay kiểm tra cũ (`length < 32 || includes('change-me')`)
  bằng `describeWeakJwtSecret()` trong `auth-service/src/common/utils/secret-strength.utils.ts`.
  Hàm này **chạy ở mọi môi trường**, chặn mọi placeholder (`change-me`, `replace-with`,
  `placeholder`, `your-`, `todo`, `example`, ...) và cả secret entropy thấp (< 12 ký tự phân biệt).
  Trước đây `replace-with-a-random-secret-of-at-least-32-characters` (54 ký tự) **pass**.
- `.github/workflows/ci.yml`: **bỏ** hành vi tự `cp .env.docker.example .env` (đây là nguyên nhân
  deploy chạy production với secret công khai). Nay pipeline **dừng deploy** nếu thiếu `.env.docker`
  hoặc file còn giá trị `replace-with*`/`change-me*`/`placeholder`.
- `infra/docker/.env.docker.example`: placeholder JWT đổi thành giá trị chắc chắn fail, kèm hướng dẫn
  `openssl rand -hex 32`.
- `docs/AWS_EC2_DEPLOYMENT_GUIDE.md`: xoá toàn bộ secret thật đã commit (JWT_SECRET 64 hex, mật khẩu
  Postgres/Redis/RabbitMQ, AWS account ID), thay bằng placeholder + hướng dẫn sinh secret.
- `api-gateway/src/config/runtime-config.ts`: `CLIENT_ORIGIN` được kiểm tra theo **từng origin**
  (trước đây `new URL()` trên chuỗi nhiều origin nên kiểm tra sai), chặn wildcard `*`.

### 2.2 High

**H1. Cổng 8080 public → vô hiệu hoá nginx**
`infra/docker/docker-compose.yml`: đổi `ports: '8080:8080'` → `'127.0.0.1:8080:8080'`.
Giữ được cả 2 mô hình (host nginx proxy tới `127.0.0.1:8080`, container nginx qua Docker network)
nhưng Internet không truy cập trực tiếp được. Tài liệu AWS đã sửa: bỏ rule mở `8080 → 0.0.0.0/0`,
phần troubleshooting đổi sang SSH tunnel thay vì hướng dẫn mở cổng.

**H2. Bypass rate limit bằng `X-Forwarded-For`**
`api-gateway/src/main.ts`: `trust proxy` đọc từ `TRUST_PROXY` (mặc định `1`, `false` = không tin).
Thêm `TRUST_PROXY` vào compose và `.env.docker.example`.
Kết hợp H1 (cổng chỉ loopback) nên không còn đường giả mạo header. Đã kiểm chứng thực nghiệm bằng
Express rằng khi gọi trực tiếp, `req.ip` nhận nguyên giá trị `X-Forwarded-For` → đây là lý do phải
đóng cổng.

**H3. Swagger public mặc định ở production**
compose đổi `ENABLE_SWAGGER: ${ENABLE_SWAGGER:-true}` → `${ENABLE_SWAGGER:-false}` và thêm vào
`.env.docker.example`. Tài liệu AWS bỏ hướng dẫn coi `/api/docs` là endpoint công khai.

**H4. Gian lận giá vé qua `passengerType`**
- `passengerType` nay là enum đóng `ADULT | CHILD | STUDENT | SENIOR`, validate ở **cả** gateway và
  orders-service (trước đây chỉ `@IsString()`).
- `orders-service/.../order.service.ts`: tách `resolvePassengerDiscountRate()`. **Giảm giá chỉ được
  áp dụng khi hành khách có `identityNumber`**; không có giấy tờ thì tính giá người lớn. Đây là điểm
  cốt lõi: trước đây chỉ cần khai `"CHILD"` là được giảm 25% mà không cần gì cả.
- `identityNumber` được lưu cùng hành khách để nhân viên đối chiếu tại ga.

**H5. Sửa đơn sau khi đã thanh toán**
- `ensureMutable()` nay chặn cả `Paid`/`Confirmed`/`TicketIssued` (trước chỉ chặn đơn đã đóng).
- `updatePassengers()` **tính lại tổng tiền** theo thành phần hành khách mới (hàm dùng chung
  `calculateOrderPricing()`), ghi lại `totalPrice`/`discountAmount`, và **huỷ các payment pending cũ**
  khi số tiền thay đổi — nên không thể trả giá cũ cho đơn đã đổi hành khách.
- Sửa nhãn ghế sau thanh toán bị chặn, tránh việc ghế đã giữ bị bán lại.

**H6. `handlePaymentPaidEvent` không xác minh gì**
Thêm `verifyPaymentSettledForOrder()`: đọc lại payment từ payments-service và yêu cầu
(1) tồn tại payment trạng thái `Paid`, (2) nếu event có `paymentId` thì payment đó phải thuộc đơn này,
(3) **số tiền đã thu phải bằng `order.totalPrice`**. Không đạt thì **không** chuyển trạng thái, chỉ log.
Trước đây handler bỏ qua `paymentId`, `transactionId`, `paidAt` và cả số tiền.

**H7. Oversell do 2 bộ đếm tồn kho không đồng bộ**
`tickets-service/src/ticket/utils/ticket.utils.ts` thêm `getAvailableStock()`,
`consumeAvailableStock()`, `returnStockToPool()`; `ticket.service.ts` dùng chúng cho cả 4 đường
reserve/release:
- `reserve(quantity)` nay **rút luôn nhãn ghế** khỏi `availableSeatLabels`, không chỉ trừ `stockAvailable`.
- `reserveSeat()` thêm **kiểm tra sàn** (`available < 1` → 409) nên `stockAvailable` không thể âm.
- `release(quantity)` mở lại đúng số ghế đang bị chiếm theo thứ tự ghế.

**H8. Rò rỉ lỗi Prisma/Database ra HTTP client ở production**
`api-gateway/.../all-exceptions.filter.ts`: với mọi response **>= 500**, message gửi client bị thay bằng
`Internal server error` khi `NODE_ENV=production`; chi tiết ghi vào log. Trước đây nhánh lỗi microservice
(`{status, message}`) khớp **trước** nhánh có guard production nên message Prisma được trả nguyên văn.
`MicroserviceExceptionFilter` ở cả 5 service cũng được siết: lỗi không phải `HttpException` **không**
còn forward `Error.message` (chỉ log nội bộ). Message 4xx vẫn giữ nguyên vì đó là message nghiệp vụ.

### 2.3 Medium

| # | Vấn đề | Cách sửa |
| --- | --- | --- |
| M1 | Reset/đổi mật khẩu không huỷ session | `resetPassword` tăng `tokenVersion` trong cùng transaction; `changePassword` tăng `tokenVersion` rồi **cấp lại token mới** để phiên hiện tại vẫn dùng được (gateway set cookie mới) |
| M2 | Refresh token không rotation | `refreshToken()` thu hồi token vừa dùng (`revokeRefreshToken()`), tách dùng chung với `logout()` |
| M3 | Token type confusion | Thêm claim `typ` (`access`/`refresh`/`password_reset`/`email_verification`); **cả 5** call site `verifyToken()` đều truyền type mong đợi |
| M4 | Email enumeration ở `resend-verification` | Luôn trả cùng một message cho mọi trường hợp (email lạ / đã verify / chưa verify) |
| M5 | Voucher race + thiếu per-user | `reserveUsage()` dùng **conditional `updateMany`** (`usedCount < usageLimit`) trong transaction → hết overshoot; thêm cột `per_user_limit` + migration, kiểm tra per-user sau khi giữ row lock; `releaseUsage()` khi huỷ đơn; gateway throttle `/vouchers/validate` 20/phút và **không** nhận `userId` từ client nữa |
| M6 | Chuyển trạng thái không CAS | `transitionStatus()` và `cancel()` dùng `updateMany({ where: { id, status } })` — 2 request đồng thời chỉ 1 thành công, chặn double refund / double release ghế |
| M7 | Thiếu chặn trên input | `quantity` ≤ 20, `ArrayMaxSize` cho `seatLabels`/`passengers`/`ticketItems`/`availableSeatLabels`, `MaxLength` cho `idempotencyKey` (64), `contactPhone` (32), `seatLabel` (16), `Max(100)` cho `limit` phân trang, `Max` cho `stockInitial/stockAvailable` |
| M8 | Lộ vé chưa publish qua `GET /tickets` | Gateway ép `status = Published` cho mọi caller không phải admin |
| M9 | Redis không TLS | `redis.module.ts` hỗ trợ `REDIS_TLS`/`REDIS_TLS_CA`/`REDIS_TLS_SERVERNAME`/`REDIS_TLS_REJECT_UNAUTHORIZED` (verify cert mặc định); tài liệu hoá trong `.env.example` |
| M10 | ValidationPipe không chạy ở 20/23 handler RMQ | Tạo `ticket-message.dto.ts` với class wrapper có `@ValidateNested`, controller dùng class thật → `whitelist` và toàn bộ rule DTO có hiệu lực trên queue |
| M11 | Payment ownership chỉ check phần tử đầu | `GET /payments/order/:orderId` fail-closed: **mọi** payment của đơn phải thuộc caller |

### 2.4 Low / phụ thuộc

- **Self-deadlock `tickets.reserve` với `seatLabel`**: tách `reserveSeatInternal()`/`releaseSeatInternal()`
  (không khoá) khỏi wrapper có khoá. Trước đây Redlock không reentrant nên route này luôn 409 sau ~5s.
- **`X-Forwarded-For`**: đã xử lý ở H2.
- **CVE**: `qs`, `multer`, `@nestjs/microservices` đã được vá bằng `npm audit fix`.
  `nodemailer` nâng `^9.0.1` → `^10.0.13` (vá toàn bộ advisory).
  Đồng thời nâng `@nestjs/core` + `@nestjs/common` lên `11.2.7` để khớp `@nestjs/microservices@11.2.7`
  (bản vá của audit fix yêu cầu helper chỉ có ở core mới hơn — nếu không khớp, test suite không chạy được).
- **Prisma CLI + `@prisma/config` + `deepmerge-ts`**: chuyển `prisma` từ `dependencies` sang
  `devDependencies` ở 4 service (notification-service vốn đã đúng). Đã xác minh `@prisma/config` chỉ
  được kéo vào bởi `prisma` CLI, còn `@prisma/client` không có dependency nào → **image production
  (`npm ci --omit=dev`) không còn chứa các package này**. `Dockerfile.migrate` vẫn dùng `npm ci` đầy đủ
  nên migration không bị ảnh hưởng.
- **CORS**: so sánh theo **scheme + host** (trước chỉ so host, nên `http://` lọt vào allow-list `https://`);
  wildcard `*` bị chặn khi bật credentials.

---

## 3. Việc bắt buộc phải làm khi deploy

1. **Đổi `JWT_SECRET`** (và toàn bộ mật khẩu DB/Redis/RabbitMQ) — sinh bằng `openssl rand -hex 32`.
   auth-service sẽ **không khởi động** nếu còn placeholder.
2. **Chạy migration mới**: `orders-service/prisma/migrations/20260902000000_add_voucher_per_user_limit`.
   Service `db-migrate` trong full Compose tự áp dụng.
3. **Không mở cổng 8080** trên Security Group.
4. Giữ `ENABLE_SWAGGER=false` ở production.
5. Bật `REDIS_TLS=true` nếu Redis không nằm trong mạng riêng.
6. **Toàn bộ người dùng phải đăng nhập lại một lần** — token cũ không có claim `typ` nên bị từ chối.

### Ảnh hưởng tới frontend (repo client cần cập nhật)

- `passengerType` chỉ nhận `ADULT | CHILD | STUDENT | SENIOR`; vé giảm giá cần gửi kèm `identityNumber`.
- Sau khi `PATCH /orders/:orderId/passengers`, tổng tiền có thể đổi và payment cũ bị huỷ → client cần
  tạo payment mới theo số tiền mới.
- Không thể sửa hành khách/ghế khi đơn đã thanh toán.
- `POST /auth/change-password` trả về cookie mới (client không cần làm gì thêm, nhưng đừng ghi đè cookie thủ công).

---

## 4. Chưa khắc phục (có lý do)

| Vấn đề | Lý do | Đề xuất |
| --- | --- | --- |
| `@nestjs/swagger` + `js-yaml` (moderate) | Bản vá yêu cầu `@nestjs/swagger@12`, mà v12 yêu cầu `@nestjs/core@^12` → phải nâng major toàn bộ Nest. Advisory chỉ liên quan việc parse YAML của OpenAPI, không phải input người dùng, và **Swagger nay đã tắt mặc định ở production**. | Gộp vào lần nâng Nest 12 |
| Prisma CLI advisories (high, dev-only) | Thuộc `prisma` CLI (`deepmerge-ts` stack exhaustion) — chỉ chạy lúc build/migrate, không reachable từ HTTP/queue. Bản vá là major bump Prisma, rủi ro ảnh hưởng migration. | Nâng Prisma ở một PR riêng có test migration |
| Queue RMQ là API đặc quyền không xác thực caller | Cần thay đổi kiến trúc: gateway phải forward danh tính + role, các service phải enforce. Việc này ảnh hưởng mọi luồng nội bộ (orders-service gọi tickets-service với tư cách "user") nên cần thiết kế riêng. Hiện được giảm thiểu bằng network isolation + mật khẩu broker (prod compose không expose port). | Thiết kế "service auth" riêng: JWT nội bộ ngắn hạn hoặc mTLS |
| Redlock chỉ cấu hình 1 node Redis | Là lựa chọn thiết kế đã ghi rõ trong code: `SELECT ... FOR UPDATE` mới là correctness guarantee, Redlock chỉ giảm tải. Không gây double-booking. | Nếu cần đúng nghĩa Redlock HA thì truyền đủ N master độc lập |
| Vé chưa verify email vẫn đăng nhập/đặt được | Là quyết định sản phẩm (có thể cố ý cho demo). | Thêm cờ `REQUIRE_EMAIL_VERIFIED` nếu muốn bật |
| `QR payload` chưa ký (HMAC) | Cần thống nhất với luồng check-in (chưa có consumer). | Ký QR khi làm module soát vé |

---

## 5. Kiểm chứng

```
api-gateway           build OK   tests 19/19
auth-service          build OK   tests 23/23
tickets-service       build OK   tests 21/21
orders-service        build OK   tests 18/18
payments-service      build OK   tests  9/9
notification-service  build OK   tests  3/3
                                        ------
                                          93
```

- `docker compose --env-file infra/docker/.env.docker.example -f infra/docker/docker-compose.yml config` → hợp lệ;
  gateway render ra `host_ip: 127.0.0.1`, `ENABLE_SWAGGER: "false"`, `TRUST_PROXY: "1"`, và **không còn** `JWT_SECRET`.
- `npx prisma validate` (orders-service) → schema hợp lệ.
- `npm ls --depth=0` → không có UNMET/invalid peer dependency.

### Test hồi quy đã thêm

- auth-service: refresh token phải bị thu hồi khi rotation; `resend-verification` trả cùng response cho
  email đã verify và email không tồn tại.
- orders-service: vé giảm giá **không** có `identityNumber` phải tính giá người lớn;
  `handlePaymentPaidEvent` từ chối khi payment thiếu/không khớp số tiền; `quantity` vượt ngưỡng bị chặn.

---

## 6. Danh sách file thay đổi

53 file sửa + 3 đường dẫn mới:

- **Mới**: `auth-service/src/common/utils/secret-strength.utils.ts`,
  `orders-service/prisma/migrations/20260902000000_add_voucher_per_user_limit/migration.sql`,
  `tickets-service/src/ticket/dto/ticket-message.dto.ts`
- **Hạ tầng/CD**: `infra/docker/docker-compose.yml`, `infra/docker/.env.docker.example`,
  `.github/workflows/ci.yml`, `docs/AWS_EC2_DEPLOYMENT_GUIDE.md`, `README.md`
- **api-gateway**: `main.ts`, `config/runtime-config.ts`, `common/filters/all-exceptions.filter.ts`,
  `auth/auth.controller.ts`, `auth/auth.service.ts`, `order/order.dto.ts`, `payment/payment.controller.ts`,
  `payment/payment.dto.ts`, `ticket/ticket.controller.ts`, `user/user.dto.ts`,
  `voucher/voucher.controller.ts`, `voucher/voucher.dto.ts`, `notification/notification.dto.ts`
- **auth-service**: `auth/auth.module.ts`, `auth/auth.service.ts`, `auth/auth.service.spec.ts`,
  `auth/utils/generate-token.utils.ts`, `common/filters/microservice-exception.filter.ts`
- **orders-service**: `order/order.service.ts`, `order/order.service.spec.ts`, `order/voucher.service.ts`,
  `order/dto/order.dto.ts`, `order/dto/order.contracts.ts`, `order/dto/voucher.dto.ts`,
  `prisma/schema.prisma`, `common/filters/microservice-exception.filter.ts`
- **tickets-service**: `ticket/ticket.service.ts`, `ticket/ticket.controller.ts`, `ticket/dto/ticket.dto.ts`,
  `ticket/utils/ticket.utils.ts`, `redis/redis.module.ts`, `.env.example`,
  `common/filters/microservice-exception.filter.ts`
- **payments-service**: `payment/utils/payment.utils.ts`, `common/filters/microservice-exception.filter.ts`
- **notification-service**: `common/filters/microservice-exception.filter.ts`, `package.json` (nodemailer 10)
- **package.json/package-lock.json**: cả 6 service (Nest 11.2.7, CVE fixes, prisma → devDependencies)
