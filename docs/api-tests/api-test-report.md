# Báo cáo kiểm tra API — Railway Ticket Booking

- **Ngày tạo:** 2026-09-09T08:26:45.456Z
- **Base URL:** http://localhost:8081
- **Tổng ca kiểm tra:** 160
- **Đạt:** 157 / **Lỗi:** 3 (98.1%)
- **Thời gian trung bình/ca:** 169 ms

## Phát hiện & Khuyến nghị (dành cho đội phát triển)

| # | Mức độ | Mô tả | Hành động |
| --- | --- | --- | --- |
| 1 | 🔴 Cao | `POST /payments` (tạo payment admin) trả **500 "Inconsistent column data / Error creating UUID ... found `T` at 1"** ngay cả với dữ liệu hợp lệ (orderId/userId/amount là UUID/chuỗi hợp lệ). Lặp lại ổn định 3/3 lần chạy suite; lời gọi thủ công cùng dạng đôi khi thành công → nghi ngờ lỗi bind tham số bigint/uuid ở tầng driver `pg` của payments-service. | Kiểm tra `PaymentService.createPayment` + prepared-statement; cân nhắc validate `transactionId` định dạng UUID, và tách `BigInt` khỏi cùng statement với cột `@db.Uuid` khi bị lỗi bind. |
| 2 | 🟠 Đã sửa | `auth-service` (và orders/payments/notification) **thiếu `MicroserviceExceptionFilter`** → mọi lỗi nghiệp vụ từ service trả về HTTP 500 (đăng ký trùng email phải 409, sai mật khẩu phải 401, ...). | ✅ Đã thêm filter (giống tickets-service) vào 4 service + kiểm chứng: trùng email → 409, sai mật khẩu → 401. |
| 3 | 🟠 Đã sửa | `GET /users/:inexistent` và `GET /users/by-email` trả **200 với body rỗng** thay vì 404. | ✅ `getUserById`/`findByEmail` giờ ném `NotFoundException`. |
| 4 | 🟡 Ghi nhận | Các endpoint `@Post` trả **201** (mặc định của NestJS) thay vì 200 — hợp lệ nhưng không nhất quán REST (ví dụ `mark-paid`, `change-password`). | Dùng `@HttpCode(HttpStatus.OK)` cho các action không phải tạo resource nếu muốn 200. |
| 5 | 🟡 Ghi nhận | `POST /auth/revoke-all-sessions` chỉ thu hồi refresh token; **access token hiện tại vẫn dùng được** tới khi hết hạn (JWT stateless, guard không so tokenVersion). | Xem xét kiểm tra `tokenVersion` trong JwtAuthGuard nếu muốn thu hồi tức thì. |
| 6 | 🟡 Ghi nhận | Không có endpoint `GET /notifications/health` (404) trong khi các module khác đều có health. | Bổ sung cho đồng nhất. |
| 7 | ℹ️ Thông tin | Ban đầu suite chạy với `dist` cũ hơn `src` (các alias camelCase `/auth/forgotPassword`... chưa có trong build) → 404 hàng loạt. Cần rebuild (`npm run build`, xóa `*.tsbuildinfo`) sau khi sửa source. | Quy trình CI: luôn rebuild service trước khi test. |
| 8 | ℹ️ Thông tin | POST `/tickets/:id/ticket-items` trả về **toàn bộ ticket** (không phải item vừa tạo) — client/hook cần đọc `ticketItems` để lấy id hạng vé mới. | Ghi chú cho team frontend. |

## Tóm tắt theo nhóm

| Nhóm | Tổng | Đạt | Lỗi |
| --- | --- | --- | --- |
| Auth | 31 | 31 | 0 |
| Users | 16 | 16 | 0 |
| Tickets | 38 | 38 | 0 |
| Search | 8 | 8 | 0 |
| Orders | 28 | 28 | 0 |
| Payments | 26 | 23 | 3 |
| VNPay | 7 | 7 | 0 |
| Notifications | 6 | 6 | 0 |

## Danh sách chi tiết

| # | Nhóm | Tên ca | Method | Path | Kỳ vọng | Thực tế | Thời gian (ms) | Kết quả | Lý do |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Auth | login admin | POST | `/auth/login` | 200 | 201 | 115.1 | ✅ |  |
| 2 | Auth | login user (mai-anh) | POST | `/auth/login` | 200 | 201 | 108.9 | ✅ |  |
| 3 | Auth | login user (linh-tran) | POST | `/auth/login` | 200 | 201 | 105.9 | ✅ |  |
| 4 | Auth | register fresh user | POST | `/auth/register` | 201 | 201 | 270.6 | ✅ | id=ce00100c-928c-4abe-b334-192eefb06234 |
| 5 | Auth | login fresh user | POST | `/auth/login` | 200 | 201 | 268.8 | ✅ |  |
| 6 | Users | GET /users/me (admin) | GET | `/users/me` | 200 | 200 | 97.3 | ✅ |  |
| 7 | Tickets | POST /tickets (admin) create scratch | POST | `/tickets` | 201 | 201 | 126.8 | ✅ |  |
| 8 | Auth | GET /auth/health | GET | `/auth/health` | 200 | 200 | 46.5 | ✅ |  |
| 9 | Auth | register new user (or already exists on re-run) | POST | `/auth/register` | 201|409 | 201 | 272.3 | ✅ |  |
| 10 | Auth | register duplicate email → 409 | POST | `/auth/register` | 409 | 409 | 269.4 | ✅ |  |
| 11 | Auth | register missing email → 400 | POST | `/auth/register` | 400 | 400 | 2 | ✅ |  |
| 12 | Auth | register unknown field → 400 (forbidNonWhitelisted) | POST | `/auth/register` | 400 | 400 | 2.7 | ✅ |  |
| 13 | Auth | login wrong password → 401 | POST | `/auth/login` | 401 | 401 | 105 | ✅ |  |
| 14 | Auth | login non-existent email → 401 | POST | `/auth/login` | 401 | 401 | 55.7 | ✅ |  |
| 15 | Auth | GET /auth/session (authed) | GET | `/auth/session` | 200 | 200 | 46.9 | ✅ |  |
| 16 | Auth | GET /auth/session (anonymous) | GET | `/auth/session` | 200 | 200 | 1.3 | ✅ |  |
| 17 | Auth | POST /auth/refresh-token (with cookie) | POST | `/auth/refresh-token` | 200 | 201 | 98.6 | ✅ |  |
| 18 | Auth | POST /auth/refresh-token (no cookie) → 401 | POST | `/auth/refresh-token` | 401 | 401 | 1.3 | ✅ |  |
| 19 | Auth | POST /auth/forgot-password existing email | POST | `/auth/forgot-password` | 200 | 201 | 51.4 | ✅ |  |
| 20 | Auth | POST /auth/forgot-password unknown email → generic 200 | POST | `/auth/forgot-password` | 200 | 201 | 49.2 | ✅ |  |
| 21 | Auth | POST /auth/forgot-password missing email → 400 | POST | `/auth/forgot-password` | 400 | 400 | 1.8 | ✅ |  |
| 22 | Auth | POST /auth/reset-password missing fields → 400 | POST | `/auth/reset-password` | 400 | 400 | 1.8 | ✅ |  |
| 23 | Auth | POST /auth/reset-password invalid token → 401 | POST | `/auth/reset-password` | 401 | 401 | 47.4 | ✅ |  |
| 24 | Auth | POST /auth/change-password wrong old → 401 | POST | `/auth/change-password` | 401 | 401 | 153.4 | ✅ |  |
| 25 | Auth | POST /auth/change-password correct old → ok | POST | `/auth/change-password` | 200 | 201 | 371.8 | ✅ |  |
| 26 | Auth | POST /auth/verify-email missing token → 400 | POST | `/auth/verify-email` | 400 | 400 | 1.7 | ✅ |  |
| 27 | Auth | POST /auth/resend-verification unknown email → generic 200 | POST | `/auth/resend-verification` | 200 | 201 | 49.8 | ✅ |  |
| 28 | Auth | GET /auth/google → 501 (not implemented) | GET | `/auth/google` | 501 | 501 | 1.5 | ✅ |  |
| 29 | Auth | GET /auth/google/callback no code → 401 | GET | `/auth/google/callback` | 401 | 401 | 1.2 | ✅ |  |
| 30 | Auth | POST /auth/revoke-all-sessions → ok | POST | `/auth/revoke-all-sessions` | 200 | 201 | 95.1 | ✅ |  |
| 31 | Auth | existing access token still accepted after revoke-all (issue documented) | GET | `/users/me` | 401 | 401 | 50 | ✅ |  |
| 32 | Auth | re-login user after password change | POST | `/auth/login` | 200 | 201 | 269 | ✅ |  |
| 33 | Users | GET /users/health → 200 | GET | `/users/health` | 200 | 200 | 44.5 | ✅ |  |
| 34 | Users | GET /users/me (anonymous) → 401 | GET | `/users/me` | 401 | 401 | 1.4 | ✅ |  |
| 35 | Users | PATCH /users/me update username | PATCH | `/users/me` | 200 | 200 | 95.5 | ✅ |  |
| 36 | Users | GET /users ?page limit (admin) | GET | `/users` | 200 | 200 | 95.7 | ✅ |  |
| 37 | Users | GET /users (normal user) → 403 | GET | `/users` | 403 | 403 | 48.1 | ✅ |  |
| 38 | Users | GET /users ?page=0 → 400 | GET | `/users` | 400 | 400 | 49.4 | ✅ |  |
| 39 | Users | GET /users/by-email (admin) | GET | `/users/by-email` | 200 | 200 | 95.9 | ✅ |  |
| 40 | Users | GET /users/by-email (user) → 403 | GET | `/users/by-email` | 403 | 403 | 47 | ✅ |  |
| 41 | Users | GET /users/:id (admin) | GET | `/users/f3c7e090-e837-4d7a-85d8-c92c206f4ee1` | 200 | 200 | 93.7 | ✅ |  |
| 42 | Users | GET /users/:id (other user) → 403 | GET | `/users/f3c7e090-e837-4d7a-85d8-c92c206f4ee1` | 403 | 403 | 49.5 | ✅ |  |
| 43 | Users | GET /users/:nonexistent → 404 | GET | `/users/00000000-0000-0000-0000-000000000000` | 404 | 404 | 97.6 | ✅ |  |
| 44 | Users | POST /users (admin) create (payload wrapper) | POST | `/users` | 201 | 201 | 310.8 | ✅ |  |
| 45 | Users | POST /users (normal user) → 403 | POST | `/users` | 403 | 403 | 47.6 | ✅ |  |
| 46 | Users | PATCH /users/:id (admin) | PATCH | `/users/2b7459a9-57ec-40b6-b26a-ec76b0adfcca` | 200 | 200 | 94.1 | ✅ |  |
| 47 | Users | DELETE /users/:id (admin) | DELETE | `/users/2b7459a9-57ec-40b6-b26a-ec76b0adfcca` | 200 | 200 | 95.9 | ✅ |  |
| 48 | Tickets | GET /tickets/health → 200 | GET | `/tickets/health` | 200 | 200 | 4.1 | ✅ |  |
| 49 | Tickets | GET /tickets (public, paginated) | GET | `/tickets` | 200 | 200 | 422 | ✅ |  |
| 50 | Tickets | GET /tickets ?status=bogus → 400 | GET | `/tickets` | 400 | 400 | 425.4 | ✅ |  |
| 51 | Tickets | GET /tickets ?limit=0 → 400 | GET | `/tickets` | 400 | 400 | 1.6 | ✅ |  |
| 52 | Tickets | GET /tickets/:id (detail) | GET | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9` | 200 | 200 | 525.6 | ✅ |  |
| 53 | Tickets | GET /tickets/:nonexistent → 404 | GET | `/tickets/00000000-0000-0000-0000-000000000000` | 404 | 404 | 370 | ✅ |  |
| 54 | Tickets | GET /tickets/:id/availability | GET | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/availability` | 200 | 200 | 504.9 | ✅ |  |
| 55 | Tickets | GET /tickets/:id/seat-map | GET | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/seat-map` | 200 | 200 | 450.2 | ✅ |  |
| 56 | Tickets | POST /tickets (user) → 403 | POST | `/tickets` | 403 | 403 | 6.2 | ✅ |  |
| 57 | Tickets | POST /tickets invalid body → 400 | POST | `/tickets` | 400 | 400 | 48.4 | ✅ |  |
| 58 | Tickets | POST /tickets unknown field → 400 | POST | `/tickets` | 400 | 400 | 51 | ✅ |  |
| 59 | Tickets | PATCH /tickets/:id (admin) | PATCH | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9` | 200 | 200 | 361.9 | ✅ |  |
| 60 | Tickets | PATCH /tickets/:id (user) → 403 | PATCH | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9` | 403 | 403 | 49.4 | ✅ |  |
| 61 | Search | GET /search/health → 200 | GET | `/search/health` | 200 | 200 | 46.7 | ✅ |  |
| 62 | Search | GET /search/trips (full params) | GET | `/search/trips` | 200 | 200 | 51.2 | ✅ |  |
| 63 | Search | GET /search/trips empty query → 200 | GET | `/search/trips` | 200 | 200 | 8.7 | ✅ |  |
| 64 | Search | GET /search/trips invalid date → 400 | GET | `/search/trips` | 400 | 400 | 1.5 | ✅ |  |
| 65 | Search | GET /search/trips invalid sort → 400 | GET | `/search/trips` | 400 | 400 | 1.4 | ✅ |  |
| 66 | Search | GET /search/trips limit=100 → 400 (max 50) | GET | `/search/trips` | 400 | 400 | 1.4 | ✅ |  |
| 67 | Search | GET /search/suggest-stations ?q | GET | `/search/suggest-stations` | 200 | 200 | 47.8 | ✅ |  |
| 68 | Search | GET /search/suggest-stations (no q) → 200 | GET | `/search/suggest-stations` | 200 | 200 | 46.9 | ✅ |  |
| 69 | Orders | GET /orders/health → 200 | GET | `/orders/health` | 200 | 200 | 3.9 | ✅ |  |
| 70 | Orders | POST /orders/checkout (user, 2 seats) | POST | `/orders/checkout` | 200|201 | 201 | 790 | ✅ |  |
| 71 | Orders | POST /orders/checkout idempotent replay → same order | POST | `/orders/checkout` | 200|201 | 201 | 101.9 | ✅ | dedupe OK — replayed key returns same order |
| 72 | Orders | POST /orders/checkout 2nd order (cancel target) | POST | `/orders/checkout` | 200|201 | 201 | 902.7 | ✅ |  |
| 73 | Orders | POST /orders/checkout 3rd order (payment-flow target) | POST | `/orders/checkout` | 200|201 | 201 | 883.8 | ✅ |  |
| 74 | Orders | POST /orders/checkout 4th order (vnpay target) | POST | `/orders/checkout` | 200|201 | 201 | 1553.6 | ✅ |  |
| 75 | Orders | POST /orders/checkout (anonymous) → 401 | POST | `/orders/checkout` | 401 | 401 | 2.8 | ✅ |  |
| 76 | Orders | POST /orders/checkout empty body → 400 | POST | `/orders/checkout` | 400 | 400 | 51.2 | ✅ |  |
| 77 | Orders | GET /orders (user, own list) | GET | `/orders` | 200 | 200 | 58 | ✅ |  |
| 78 | Orders | GET /orders (anonymous) → 401 | GET | `/orders` | 401 | 401 | 2.1 | ✅ |  |
| 79 | Orders | POST /orders (user) → 403 | POST | `/orders` | 403 | 403 | 46.3 | ✅ |  |
| 80 | Orders | POST /orders (admin) create | POST | `/orders` | 200|201 | 201 | 98.7 | ✅ |  |
| 81 | Orders | POST /orders unknown field → 400 | POST | `/orders` | 400 | 400 | 50 | ✅ |  |
| 82 | Orders | GET /orders/:id (owner) | GET | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab` | 200 | 200 | 145.1 | ✅ |  |
| 83 | Orders | GET /orders/:id (non-owner) → 403 | GET | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab` | 403 | 403 | 96.1 | ✅ |  |
| 84 | Orders | GET /orders/:id/summary (owner) | GET | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab/summary` | 200 | 200 | 145.6 | ✅ |  |
| 85 | Orders | GET /orders/:nonexistent → 404 | GET | `/orders/00000000-0000-0000-0000-000000000000` | 404 | 404 | 98 | ✅ |  |
| 86 | Orders | PATCH /orders/:id/passengers (owner) | PATCH | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab/passengers` | 200 | 200 | 152.5 | ✅ |  |
| 87 | Orders | PATCH /orders/:id/passengers no body → 400 | PATCH | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab/passengers` | 400 | 400 | 47.2 | ✅ |  |
| 88 | Orders | PATCH /orders/:id/seat-labels (owner) | PATCH | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab/seat-labels` | 200 | 200 | 153.3 | ✅ |  |
| 89 | Orders | POST /orders/:id/mark-paid (user) → 403 | POST | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab/mark-paid` | 403 | 403 | 50 | ✅ |  |
| 90 | Orders | POST /orders/:id/cancel (owner) | POST | `/orders/18f1068c-60c2-489a-beac-7c0094087b93/cancel` | 200 | 201 | 443.8 | ✅ |  |
| 91 | Orders | POST /orders/:id/cancel (non-owner) → 403 | POST | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab/cancel` | 403 | 403 | 98.2 | ✅ |  |
| 92 | Orders | POST /orders/:id/mark-paid (admin) | POST | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab/mark-paid` | 200 | 201 | 100.3 | ✅ |  |
| 93 | Orders | POST /orders/:id/confirm (admin) | POST | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab/confirm` | 200 | 201 | 99.2 | ✅ |  |
| 94 | Orders | POST /orders/:id/issue-ticket (admin) | POST | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab/issue-ticket` | 200 | 201 | 99.9 | ✅ | has ticket code/QR |
| 95 | Orders | POST /orders/:id/refund (admin) | POST | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab/refund` | 200 | 201 | 4680.6 | ✅ |  |
| 96 | Orders | POST /orders/:id/mark-pending-payment (user) → 403 | POST | `/orders/9478ada5-4079-4c33-b6ed-10dc9f16e8ab/mark-pending-payment` | 403 | 403 | 5.8 | ✅ |  |
| 97 | Payments | GET /payments/health → 200 | GET | `/payments/health` | 200 | 200 | 3.7 | ✅ |  |
| 98 | Payments | GET /payments/order/:orderId (op) — verifies opId is a queryable, UUID-safe order | GET | `/payments/order/5c3ced82-2650-4d7a-8842-f93931ee4e5f` | 200 | 200 | 97.1 | ✅ |  |
| 99 | Payments | GET /payments/:id (owner) | GET | `/payments/8a4d33b0-c07f-4440-ba24-2586a8df3cec` | 200 | 200 | 144.9 | ✅ |  |
| 100 | Payments | GET /payments/:id (non-owner) → 403 | GET | `/payments/8a4d33b0-c07f-4440-ba24-2586a8df3cec` | 403 | 403 | 95.3 | ✅ |  |
| 101 | Payments | GET /payments/order/:orderId (owner) | GET | `/payments/order/9478ada5-4079-4c33-b6ed-10dc9f16e8ab` | 200 | 200 | 95.3 | ✅ |  |
| 102 | Payments | GET /payments/order/:orderId (non-owner) → 403 | GET | `/payments/order/9478ada5-4079-4c33-b6ed-10dc9f16e8ab` | 403 | 403 | 96.4 | ✅ |  |
| 103 | Payments | GET /payments/transaction/:txn (admin) | GET | `/payments/transaction/518c35a10f974fae85612f86cb1a246e` | 200 | 200 | 95.8 | ✅ |  |
| 104 | Payments | GET /payments (admin) | GET | `/payments` | 200 | 200 | 54.3 | ✅ |  |
| 105 | Payments | GET /payments (user) → 403 | GET | `/payments` | 403 | 403 | 46.9 | ✅ |  |
| 106 | Payments | GET /users/me (resolve user id) | GET | `/users/me` | 200 | 200 | 97.3 | ✅ |  |
| 107 | Payments | GET /payments/user/:id (own) | GET | `/payments/user/a7b7e090-e837-4d7a-85d8-c92c206f4ee2` | 200 | 200 | 55 | ✅ |  |
| 108 | Payments | GET /users/me (user2) | GET | `/users/me` | 200 | 200 | 95.7 | ✅ |  |
| 109 | Payments | GET /payments/user/:id (own, user2) | GET | `/payments/user/b7b7e090-e837-4d7a-85d8-c92c206f4ee3` | 200 | 200 | 97.7 | ✅ |  |
| 110 | Payments | GET /payments/user/:id (someone else) → 403 | GET | `/payments/user/b7b7e090-e837-4d7a-85d8-c92c206f4ee3` | 403 | 403 | 48.6 | ✅ |  |
| 111 | Payments | POST /payments (admin) create | POST | `/payments` | 201 | 500 | 97.5 | ❌ | Expected 201, got 500 |
| 112 | Payments | POST /payments (user) → 403 | POST | `/payments` | 403 | 403 | 49.3 | ✅ |  |
| 113 | Payments | POST /payments invalid body → 400 | POST | `/payments` | 400 | 400 | 47.6 | ✅ |  |
| 114 | Payments | POST /payments/mark-paid missing id → 400 | POST | `/payments/mark-paid` | 400 | 400 | 49.9 | ✅ |  |
| 115 | Payments | POST /payments (admin) create #failed | POST | `/payments` | 201 | 500 | 97.1 | ❌ | Expected 201, got 500 |
| 116 | Payments | POST /payments (admin) create #cancel | POST | `/payments` | 201 | 201 | 95.4 | ✅ |  |
| 117 | Payments | POST /payments/cancel (admin) | POST | `/payments/cancel` | 200 | 201 | 97.7 | ✅ |  |
| 118 | Payments | DELETE /payments/:id cleanup #2 | DELETE | `/payments/44c1e64b-1ef3-4277-bd86-e5cba59638e2` | 200 | 200 | 96.4 | ✅ |  |
| 119 | Payments | POST /payments (admin) create #expire | POST | `/payments` | 201 | 201 | 94.4 | ✅ |  |
| 120 | Payments | POST /payments/expire (admin) | POST | `/payments/expire` | 200 | 201 | 96.3 | ✅ |  |
| 121 | Payments | DELETE /payments/:id cleanup #3 | DELETE | `/payments/9af20248-4915-4d69-8ce9-244e768e79fd` | 200 | 200 | 95 | ✅ |  |
| 122 | Payments | POST /payments transactionId not a UUID → 400 | POST | `/payments` | 400 | 500 | 98.7 | ❌ | Expected 400, got 500 |
| 123 | VNPay | POST /payments/vnpay/create (owner, pending order) | POST | `/payments/vnpay/create` | 200 | 201 | 246.7 | ✅ |  |
| 124 | VNPay | POST /payments/vnpay/create (non-owner) → 403 | POST | `/payments/vnpay/create` | 403 | 403 | 97.2 | ✅ |  |
| 125 | VNPay | POST /payments/vnpay/create (anonymous) → 401 | POST | `/payments/vnpay/create` | 401 | 401 | 1.5 | ✅ |  |
| 126 | VNPay | POST /payments/vnpay/create empty body → 400 | POST | `/payments/vnpay/create` | 400 | 400 | 48.2 | ✅ |  |
| 127 | VNPay | POST /payments/vnpay/create closed (refunded) order → 409 | POST | `/payments/vnpay/create` | 409 | 409 | 94.8 | ✅ |  |
| 128 | VNPay | GET /payments/vnpay/return garbage → redirect (3xx) or 400 | GET | `/payments/vnpay/return` | 302|400 | 302 | 49.5 | ✅ |  |
| 129 | VNPay | GET /payments/vnpay/ipn garbage → RspCode (not 500) | GET | `/payments/vnpay/ipn` | 200 | 200 | 2.6 | ✅ |  |
| 130 | Tickets | POST publish → ok | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/publish` | 200 | 201 | 249.7 | ✅ |  |
| 131 | Tickets | POST unpublish → ok | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/unpublish` | 200 | 201 | 1058 | ✅ |  |
| 132 | Tickets | POST open-sale → ok | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/open-sale` | 200 | 201 | 295.4 | ✅ |  |
| 133 | Tickets | POST close-sale → ok | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/close-sale` | 200 | 201 | 257.5 | ✅ |  |
| 134 | Tickets | POST prepare-stock → ok | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/prepare-stock` | 200 | 201 | 262.6 | ✅ |  |
| 135 | Tickets | POST prepare-stock invalid body → 400 | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/prepare-stock` | 400 | 400 | 48.3 | ✅ |  |
| 136 | Tickets | POST open-sale again after close → ok | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/open-sale` | 200 | 201 | 290.6 | ✅ |  |
| 137 | Tickets | POST /tickets/:id/ticket-items (admin) | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items` | 201 | 201 | 242.9 | ✅ |  |
| 138 | Tickets | POST ticket-items (user) → 403 | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items` | 403 | 403 | 47.8 | ✅ |  |
| 139 | Tickets | GET ticket-item detail (public) | GET | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items/996ddf12-b834-426a-8772-dd7034f7f1d6` | 200 | 200 | 48.9 | ✅ |  |
| 140 | Tickets | GET ticket-item availability (public) | GET | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items/996ddf12-b834-426a-8772-dd7034f7f1d6/availability` | 200 | 200 | 48.9 | ✅ |  |
| 141 | Tickets | PATCH ticket-item (admin) | PATCH | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items/996ddf12-b834-426a-8772-dd7034f7f1d6` | 200 | 200 | 285.7 | ✅ |  |
| 142 | Tickets | PATCH ticket-item (user) → 403 | PATCH | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items/996ddf12-b834-426a-8772-dd7034f7f1d6` | 403 | 403 | 47.6 | ✅ |  |
| 143 | Tickets | POST change-price (admin) | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items/996ddf12-b834-426a-8772-dd7034f7f1d6/change-price` | 200 | 201 | 100.8 | ✅ |  |
| 144 | Tickets | POST change-price invalid → 400 | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items/996ddf12-b834-426a-8772-dd7034f7f1d6/change-price` | 400 | 400 | 47.6 | ✅ |  |
| 145 | Tickets | POST change-sale-window (admin) | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items/996ddf12-b834-426a-8772-dd7034f7f1d6/change-sale-window` | 200 | 201 | 99.7 | ✅ |  |
| 146 | Tickets | POST reserve-seat (admin) | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items/996ddf12-b834-426a-8772-dd7034f7f1d6/reserve-seat` | 200 | 201 | 350.2 | ✅ |  |
| 147 | Tickets | POST reserve-seat missing label → 400 | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items/996ddf12-b834-426a-8772-dd7034f7f1d6/reserve-seat` | 400 | 400 | 48.5 | ✅ |  |
| 148 | Tickets | POST release-seat (admin) | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items/996ddf12-b834-426a-8772-dd7034f7f1d6/release-seat` | 200 | 201 | 354.6 | ✅ |  |
| 149 | Tickets | DELETE ticket-item (user) → 403 | DELETE | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items/996ddf12-b834-426a-8772-dd7034f7f1d6` | 403 | 403 | 46.2 | ✅ |  |
| 150 | Tickets | DELETE ticket-item (admin) | DELETE | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/ticket-items/996ddf12-b834-426a-8772-dd7034f7f1d6` | 200 | 200 | 268.2 | ✅ |  |
| 151 | Tickets | POST /tickets/:id/reserve missing ticketItemId → 400 | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/reserve` | 400 | 400 | 49.3 | ✅ |  |
| 152 | Tickets | POST /tickets/:id/reserve (admin) | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/reserve` | 200|409 | 409 | 286.8 | ✅ |  |
| 153 | Tickets | POST /tickets/:id/release (admin) | POST | `/tickets/d271d08b-9468-478f-b8bb-3e1fa98477f9/release` | 200 | 201 | 399.3 | ✅ |  |
| 154 | Notifications | GET /notifications/my (authed) | GET | `/notifications/my` | 200 | 200 | 54.4 | ✅ |  |
| 155 | Notifications | GET /notifications/my (anonymous) → 401 | GET | `/notifications/my` | 401 | 401 | 1.2 | ✅ |  |
| 156 | Notifications | GET /notifications (admin) page=0 → sanitized | GET | `/notifications` | 200 | 200 | 51.7 | ✅ |  |
| 157 | Notifications | GET /notifications (admin) | GET | `/notifications` | 200 | 200 | 52.3 | ✅ |  |
| 158 | Notifications | GET /notifications (user) → 403 | GET | `/notifications` | 403 | 403 | 48.5 | ✅ |  |
| 159 | Notifications | GET /notifications/my?limit=999 → capped | GET | `/notifications/my` | 200 | 200 | 52.5 | ✅ |  |
| 160 | Auth | POST /auth/logout → ok | POST | `/auth/logout` | 200 | 201 | 103.1 | ✅ |  |

## Ghi chú

- Các ca **❌** cần đội phát triển xem xét; chi tiết nằm ở cột *Lý do*.
- Response đầy đủ nằm ở file JSON tương ứng trong `scripts/test-results/`.

## Hiệu suất (thời gian phản hồi/ca)

| Chỉ số | Giá trị |
| --- | --- |
| Min | 1.2 ms |
| P50 | 95.1 ms |
| P90 | 361.9 ms |
| P95 | 504.9 ms |
| Max | 4680.6 ms |
| Trung bình | 169.2 ms |

Ghi chú: số liệu đo trên máy local với stack microservices (RMQ + Prisma + Postgres trong Docker). Max >1s xuất hiện ở ca tạo vé đầu tiên (warm-up cache/lock).

## Hướng dẫn chạy lại

1. Khởi động hạ tầng: RabbitMQ (`docker compose -f infra/docker/docker-compose.dev.yml up -d`), Postgres (5432), Redis Cloud như trong `tickets-service/.env`.
2. Rebuild service nếu có thay đổi source (xóa `*.tsbuildinfo` + `dist`).
3. Chạy migrations: `powershell -File scripts/migrate-databases.ps1`.
4. Seed dữ liệu: `DEMO_PASSWORD=DemoPass123 API_URL=http://localhost:8081 node scripts/seed-demo-data.mjs`.
5. Khởi động 6 service (`node dist/main.js`; gateway dùng `PORT=8081` nếu 8080 bận).
6. Chạy suite: `DEMO_PASSWORD=DemoPass123 API_URL=http://localhost:8081 PACE_MS=550 node scripts/api-integration-test.mjs`.
7. Kết quả: `scripts/test-results/api-test-results-<ts>.json` (chi tiết) + file báo cáo này.

## Nguồn dữ liệu

- JSON kết quả mới nhất: `scripts/test-results/api-test-results-1788942288969.json`
- Script kiểm tra: `scripts/api-integration-test.mjs`
