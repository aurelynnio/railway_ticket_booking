# Báo cáo kiểm tra API — Railway Ticket Booking

- **Ngày tạo:** 2026-10-11T10:50:16.887Z
- **Base URL:** http://localhost:8081
- **Tổng ca kiểm tra:** 166
- **Đạt:** 166 / **Lỗi:** 0 (100%)
- **Thời gian trung bình/ca:** 114 ms

## Tóm tắt theo nhóm

| Nhóm | Tổng | Đạt | Lỗi |
| --- | --- | --- | --- |
| Auth | 31 | 31 | 0 |
| Users | 16 | 16 | 0 |
| Tickets | 38 | 38 | 0 |
| Search | 8 | 8 | 0 |
| Orders | 28 | 28 | 0 |
| Payments | 32 | 32 | 0 |
| VNPay | 7 | 7 | 0 |
| Notifications | 6 | 6 | 0 |

## Danh sách chi tiết

| # | Nhóm | Tên ca | Method | Path | Kỳ vọng | Thực tế | Thời gian (ms) | Kết quả | Lý do |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Auth | login admin | POST | `/auth/login` | 200 | 201 | 171.8 | ✅ |  |
| 2 | Auth | login user (mai-anh) | POST | `/auth/login` | 200 | 201 | 109.2 | ✅ |  |
| 3 | Auth | login user (linh-tran) | POST | `/auth/login` | 200 | 201 | 109.5 | ✅ |  |
| 4 | Auth | register fresh user | POST | `/auth/register` | 201 | 201 | 277.5 | ✅ | id=04ba938e-0c74-4ef4-95ec-b291770ad775 |
| 5 | Auth | login fresh user | POST | `/auth/login` | 200 | 201 | 271.4 | ✅ |  |
| 6 | Users | GET /users/me (admin) | GET | `/users/me` | 200 | 200 | 153 | ✅ |  |
| 7 | Tickets | POST /tickets (admin) create scratch | POST | `/tickets` | 201 | 201 | 69.7 | ✅ |  |
| 8 | Auth | GET /auth/health | GET | `/auth/health` | 200 | 200 | 50.3 | ✅ |  |
| 9 | Auth | register new user (or already exists on re-run) | POST | `/auth/register` | 201|409 | 201 | 273.6 | ✅ |  |
| 10 | Auth | register duplicate email → 409 | POST | `/auth/register` | 409 | 409 | 272.3 | ✅ |  |
| 11 | Auth | register missing email → 400 | POST | `/auth/register` | 400 | 400 | 3.3 | ✅ |  |
| 12 | Auth | register unknown field → 400 (forbidNonWhitelisted) | POST | `/auth/register` | 400 | 400 | 2.7 | ✅ |  |
| 13 | Auth | login wrong password → 401 | POST | `/auth/login` | 401 | 401 | 117 | ✅ |  |
| 14 | Auth | login non-existent email → 401 | POST | `/auth/login` | 401 | 401 | 50.5 | ✅ |  |
| 15 | Auth | GET /auth/session (authed) | GET | `/auth/session` | 200 | 200 | 49.3 | ✅ |  |
| 16 | Auth | GET /auth/session (anonymous) | GET | `/auth/session` | 200 | 200 | 1.5 | ✅ |  |
| 17 | Auth | POST /auth/refresh-token (with cookie) | POST | `/auth/refresh-token` | 200 | 201 | 106.7 | ✅ |  |
| 18 | Auth | POST /auth/refresh-token (no cookie) → 401 | POST | `/auth/refresh-token` | 401 | 401 | 1.6 | ✅ |  |
| 19 | Auth | POST /auth/forgot-password existing email | POST | `/auth/forgot-password` | 200 | 201 | 54.6 | ✅ |  |
| 20 | Auth | POST /auth/forgot-password unknown email → generic 200 | POST | `/auth/forgot-password` | 200 | 201 | 52.9 | ✅ |  |
| 21 | Auth | POST /auth/forgot-password missing email → 400 | POST | `/auth/forgot-password` | 400 | 400 | 2.8 | ✅ |  |
| 22 | Auth | POST /auth/reset-password missing fields → 400 | POST | `/auth/reset-password` | 400 | 400 | 2.6 | ✅ |  |
| 23 | Auth | POST /auth/reset-password invalid token → 401 | POST | `/auth/reset-password` | 401 | 401 | 51.2 | ✅ |  |
| 24 | Auth | POST /auth/change-password wrong old → 401 | POST | `/auth/change-password` | 401 | 401 | 155.5 | ✅ |  |
| 25 | Auth | POST /auth/change-password correct old → ok | POST | `/auth/change-password` | 200 | 201 | 395.6 | ✅ |  |
| 26 | Auth | POST /auth/verify-email missing token → 400 | POST | `/auth/verify-email` | 400 | 400 | 2 | ✅ |  |
| 27 | Auth | POST /auth/resend-verification unknown email → generic 200 | POST | `/auth/resend-verification` | 200 | 201 | 49.4 | ✅ |  |
| 28 | Auth | GET /auth/google → 501 (not implemented) | GET | `/auth/google` | 501 | 501 | 3.1 | ✅ |  |
| 29 | Auth | GET /auth/google/callback no code → 401 | GET | `/auth/google/callback` | 401 | 401 | 1.7 | ✅ |  |
| 30 | Auth | POST /auth/revoke-all-sessions → ok | POST | `/auth/revoke-all-sessions` | 200 | 201 | 103.5 | ✅ |  |
| 31 | Auth | existing access token rejected after revoke-all (tokenVersion bumped) → 401 | GET | `/users/me` | 401 | 401 | 50.4 | ✅ |  |
| 32 | Auth | re-login user after password change | POST | `/auth/login` | 200 | 201 | 272.3 | ✅ |  |
| 33 | Users | GET /users/health → 200 | GET | `/users/health` | 200 | 200 | 48 | ✅ |  |
| 34 | Users | GET /users/me (anonymous) → 401 | GET | `/users/me` | 401 | 401 | 2.6 | ✅ |  |
| 35 | Users | PATCH /users/me update username & avatar | PATCH | `/users/me` | 200 | 200 | 141.2 | ✅ |  |
| 36 | Users | GET /users ?page limit (admin) | GET | `/users` | 200 | 200 | 63.7 | ✅ |  |
| 37 | Users | GET /users (normal user) → 403 | GET | `/users` | 403 | 403 | 51.8 | ✅ |  |
| 38 | Users | GET /users ?page=0 → 400 | GET | `/users` | 400 | 400 | 50.9 | ✅ |  |
| 39 | Users | GET /users/by-email (admin) | GET | `/users/by-email` | 200 | 200 | 197.3 | ✅ |  |
| 40 | Users | GET /users/by-email (user) → 403 | GET | `/users/by-email` | 403 | 403 | 52.6 | ✅ |  |
| 41 | Users | GET /users/:id (admin) | GET | `/users/f3c7e090-e837-4d7a-85d8-c92c206f4ee1` | 200 | 200 | 95.6 | ✅ |  |
| 42 | Users | GET /users/:id (other user) → 403 | GET | `/users/f3c7e090-e837-4d7a-85d8-c92c206f4ee1` | 403 | 403 | 48.7 | ✅ |  |
| 43 | Users | GET /users/:nonexistent → 404 | GET | `/users/00000000-0000-0000-0000-000000000000` | 404 | 404 | 123.7 | ✅ |  |
| 44 | Users | POST /users (admin) create (payload wrapper) | POST | `/users` | 201 | 201 | 321.5 | ✅ |  |
| 45 | Users | POST /users (normal user) → 403 | POST | `/users` | 403 | 403 | 51.4 | ✅ |  |
| 46 | Users | PATCH /users/:id (admin) | PATCH | `/users/1a069925-2f94-44d6-88fd-ccc49d7af39d` | 200 | 200 | 159 | ✅ |  |
| 47 | Users | DELETE /users/:id (admin) | DELETE | `/users/1a069925-2f94-44d6-88fd-ccc49d7af39d` | 200 | 200 | 103.2 | ✅ |  |
| 48 | Tickets | GET /tickets/health → 200 | GET | `/tickets/health` | 200 | 200 | 40 | ✅ |  |
| 49 | Tickets | GET /tickets (public, paginated) | GET | `/tickets` | 200 | 200 | 16.4 | ✅ |  |
| 50 | Tickets | GET /tickets ?status=bogus → 400 | GET | `/tickets` | 400 | 400 | 1.7 | ✅ |  |
| 51 | Tickets | GET /tickets ?limit=0 → 400 | GET | `/tickets` | 400 | 400 | 1.8 | ✅ |  |
| 52 | Tickets | GET /tickets/:id (detail) | GET | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b` | 200 | 200 | 11.3 | ✅ |  |
| 53 | Tickets | GET /tickets/:nonexistent → 404 | GET | `/tickets/00000000-0000-0000-0000-000000000000` | 404 | 404 | 55.9 | ✅ |  |
| 54 | Tickets | GET /tickets/:id/availability | GET | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/availability` | 200 | 200 | 54.7 | ✅ |  |
| 55 | Tickets | GET /tickets/:id/seat-map | GET | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/seat-map` | 200 | 200 | 52.8 | ✅ |  |
| 56 | Tickets | POST /tickets (user) → 403 | POST | `/tickets` | 403 | 403 | 49.7 | ✅ |  |
| 57 | Tickets | POST /tickets invalid body → 400 | POST | `/tickets` | 400 | 400 | 51.2 | ✅ |  |
| 58 | Tickets | POST /tickets unknown field → 400 | POST | `/tickets` | 400 | 400 | 50.7 | ✅ |  |
| 59 | Tickets | PATCH /tickets/:id (admin) | PATCH | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b` | 200 | 200 | 108.5 | ✅ |  |
| 60 | Tickets | PATCH /tickets/:id (user) → 403 | PATCH | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b` | 403 | 403 | 50.3 | ✅ |  |
| 61 | Search | GET /search/health → 200 | GET | `/search/health` | 200 | 200 | 105 | ✅ |  |
| 62 | Search | GET /search/trips (full params) | GET | `/search/trips` | 200 | 200 | 52.4 | ✅ |  |
| 63 | Search | GET /search/trips empty query → 200 | GET | `/search/trips` | 200 | 200 | 9.6 | ✅ |  |
| 64 | Search | GET /search/trips invalid date → 400 | GET | `/search/trips` | 400 | 400 | 2.8 | ✅ |  |
| 65 | Search | GET /search/trips invalid sort → 400 | GET | `/search/trips` | 400 | 400 | 2.4 | ✅ |  |
| 66 | Search | GET /search/trips limit=100 → 400 (max 50) | GET | `/search/trips` | 400 | 400 | 2.5 | ✅ |  |
| 67 | Search | GET /search/suggest-stations ?q | GET | `/search/suggest-stations` | 200 | 200 | 50.4 | ✅ |  |
| 68 | Search | GET /search/suggest-stations (no q) → 200 | GET | `/search/suggest-stations` | 200 | 200 | 49 | ✅ |  |
| 69 | Orders | GET /orders/health → 200 | GET | `/orders/health` | 200 | 200 | 5.2 | ✅ |  |
| 70 | Orders | POST /orders/checkout (user, 2 seats) | POST | `/orders/checkout` | 200|201 | 201 | 366.1 | ✅ |  |
| 71 | Orders | POST /orders/checkout idempotent replay → same order | POST | `/orders/checkout` | 200|201 | 201 | 107.8 | ✅ | dedupe OK — replayed key returns same order |
| 72 | Orders | POST /orders/checkout 2nd order (cancel target) | POST | `/orders/checkout` | 200|201 | 201 | 291.7 | ✅ |  |
| 73 | Orders | POST /orders/checkout 3rd order (payment-flow target) | POST | `/orders/checkout` | 200|201 | 201 | 295.9 | ✅ |  |
| 74 | Orders | POST /orders/checkout 4th order (vnpay target) | POST | `/orders/checkout` | 200|201 | 201 | 282.4 | ✅ |  |
| 75 | Orders | POST /orders/checkout (anonymous) → 401 | POST | `/orders/checkout` | 401 | 401 | 2.5 | ✅ |  |
| 76 | Orders | POST /orders/checkout empty body → 400 | POST | `/orders/checkout` | 400 | 400 | 54.3 | ✅ |  |
| 77 | Orders | GET /orders (user, own list) | GET | `/orders` | 200 | 200 | 64.6 | ✅ |  |
| 78 | Orders | GET /orders (anonymous) → 401 | GET | `/orders` | 401 | 401 | 1.4 | ✅ |  |
| 79 | Orders | POST /orders (user) → 403 | POST | `/orders` | 403 | 403 | 57 | ✅ |  |
| 80 | Orders | POST /orders (admin) create | POST | `/orders` | 200|201 | 201 | 109.6 | ✅ |  |
| 81 | Orders | POST /orders unknown field → 400 | POST | `/orders` | 400 | 400 | 52 | ✅ |  |
| 82 | Orders | GET /orders/:id (owner) | GET | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3` | 200 | 200 | 146.1 | ✅ |  |
| 83 | Orders | GET /orders/:id (non-owner) → 403 | GET | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3` | 403 | 403 | 97.1 | ✅ |  |
| 84 | Orders | GET /orders/:id/summary (owner) | GET | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3/summary` | 200 | 200 | 143.4 | ✅ |  |
| 85 | Orders | GET /orders/:nonexistent → 404 | GET | `/orders/00000000-0000-0000-0000-000000000000` | 404 | 404 | 103.6 | ✅ |  |
| 86 | Orders | PATCH /orders/:id/passengers (owner) | PATCH | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3/passengers` | 200 | 200 | 158.3 | ✅ |  |
| 87 | Orders | PATCH /orders/:id/passengers no body → 400 | PATCH | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3/passengers` | 400 | 400 | 50.9 | ✅ |  |
| 88 | Orders | PATCH /orders/:id/seat-labels (owner) | PATCH | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3/seat-labels` | 200 | 200 | 154.4 | ✅ |  |
| 89 | Orders | POST /orders/:id/mark-paid (user) → 403 | POST | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3/mark-paid` | 403 | 403 | 49.4 | ✅ |  |
| 90 | Orders | POST /orders/:id/cancel (owner) | POST | `/orders/418e1a2c-b61a-4de7-ae49-4baefc64e4b1/cancel` | 200 | 201 | 316.4 | ✅ |  |
| 91 | Orders | POST /orders/:id/cancel (non-owner) → 403 | POST | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3/cancel` | 403 | 403 | 96.1 | ✅ |  |
| 92 | Orders | POST /orders/:id/mark-paid (admin) | POST | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3/mark-paid` | 200 | 201 | 107.8 | ✅ |  |
| 93 | Orders | POST /orders/:id/confirm (admin) | POST | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3/confirm` | 200 | 201 | 104.5 | ✅ |  |
| 94 | Orders | POST /orders/:id/issue-ticket (admin) | POST | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3/issue-ticket` | 200 | 201 | 63.5 | ✅ | has ticket code/QR |
| 95 | Orders | POST /orders/:id/refund (admin) | POST | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3/refund` | 200 | 201 | 3937.8 | ✅ |  |
| 96 | Orders | POST /orders/:id/mark-pending-payment (user) → 403 | POST | `/orders/cdafc7f5-708b-4124-9aab-cfc0f23523d3/mark-pending-payment` | 403 | 403 | 49.4 | ✅ |  |
| 97 | Payments | GET /payments/health → 200 | GET | `/payments/health` | 200 | 200 | 4.7 | ✅ |  |
| 98 | Payments | GET /payments/order/:orderId (op) — verifies opId is a queryable, UUID-safe order | GET | `/payments/order/c0d22381-6616-4bb7-926e-e22229314dc4` | 200 | 200 | 98.7 | ✅ |  |
| 99 | Payments | GET /payments/:id (owner) | GET | `/payments/8ba14363-dea3-47bb-98ce-6e888f1b7ea4` | 200 | 200 | 147.4 | ✅ |  |
| 100 | Payments | GET /payments/:id (non-owner) → 403 | GET | `/payments/8ba14363-dea3-47bb-98ce-6e888f1b7ea4` | 403 | 403 | 98.1 | ✅ |  |
| 101 | Payments | GET /payments/order/:orderId (owner) | GET | `/payments/order/cdafc7f5-708b-4124-9aab-cfc0f23523d3` | 200 | 200 | 98.8 | ✅ |  |
| 102 | Payments | GET /payments/order/:orderId (non-owner) → 403 | GET | `/payments/order/cdafc7f5-708b-4124-9aab-cfc0f23523d3` | 403 | 403 | 100.4 | ✅ |  |
| 103 | Payments | GET /payments/transaction/:txn (admin) | GET | `/payments/transaction/57cbd58c95a64abfac1ff3a17ddbc3e1` | 200 | 200 | 97.8 | ✅ |  |
| 104 | Payments | GET /payments (admin) | GET | `/payments` | 200 | 200 | 60.1 | ✅ |  |
| 105 | Payments | GET /payments (user) → 403 | GET | `/payments` | 403 | 403 | 49.1 | ✅ |  |
| 106 | Payments | GET /users/me (resolve user id) | GET | `/users/me` | 200 | 200 | 97.5 | ✅ |  |
| 107 | Payments | GET /payments/user/:id (own) | GET | `/payments/user/a7b7e090-e837-4d7a-85d8-c92c206f4ee2` | 200 | 200 | 59.1 | ✅ |  |
| 108 | Payments | GET /users/me (user2) | GET | `/users/me` | 200 | 200 | 96.2 | ✅ |  |
| 109 | Payments | GET /payments/user/:id (own, user2) | GET | `/payments/user/b7b7e090-e837-4d7a-85d8-c92c206f4ee3` | 200 | 200 | 101.6 | ✅ |  |
| 110 | Payments | GET /payments/user/:id (someone else) → 403 | GET | `/payments/user/b7b7e090-e837-4d7a-85d8-c92c206f4ee3` | 403 | 403 | 50.9 | ✅ |  |
| 111 | Payments | POST /payments (admin) create with explicit UUID transactionId | POST | `/payments` | 201 | 201 | 98.2 | ✅ |  |
| 112 | Payments | POST /payments (user) → 403 | POST | `/payments` | 403 | 403 | 50.3 | ✅ |  |
| 113 | Payments | POST /payments invalid body → 400 | POST | `/payments` | 400 | 400 | 49.8 | ✅ |  |
| 114 | Payments | POST /payments/mark-processing (admin) | POST | `/payments/mark-processing` | 200 | 201 | 100.6 | ✅ |  |
| 115 | Payments | POST /payments/mark-paid (admin) | POST | `/payments/mark-paid` | 200 | 201 | 100.3 | ✅ |  |
| 116 | Payments | POST /payments/mark-refunded (admin) | POST | `/payments/mark-refunded` | 200 | 201 | 100.7 | ✅ |  |
| 117 | Payments | DELETE /payments/:id (admin) | DELETE | `/payments/02cec8d5-6c12-4bd9-a3bb-9503dd3bc926` | 200 | 200 | 102.4 | ✅ |  |
| 118 | Payments | POST /payments/mark-paid missing id → 400 | POST | `/payments/mark-paid` | 400 | 400 | 51.4 | ✅ |  |
| 119 | Payments | POST /payments (admin) create #failed | POST | `/payments` | 201 | 201 | 98.3 | ✅ |  |
| 120 | Payments | POST /payments/mark-failed (admin) | POST | `/payments/mark-failed` | 200 | 201 | 100.6 | ✅ |  |
| 121 | Payments | DELETE /payments/:id cleanup | DELETE | `/payments/ca3d6ce4-f8cb-4b79-aab2-8fca937dad4c` | 200 | 200 | 97.5 | ✅ |  |
| 122 | Payments | POST /payments (admin) create #cancel | POST | `/payments` | 201 | 201 | 97.4 | ✅ |  |
| 123 | Payments | POST /payments/cancel (admin) | POST | `/payments/cancel` | 200 | 201 | 100.4 | ✅ |  |
| 124 | Payments | DELETE /payments/:id cleanup #2 | DELETE | `/payments/cedb03d3-f330-41c7-8ca3-909967d216bf` | 200 | 200 | 98.2 | ✅ |  |
| 125 | Payments | POST /payments (admin) create #expire | POST | `/payments` | 201 | 201 | 97.8 | ✅ |  |
| 126 | Payments | POST /payments/expire (admin) | POST | `/payments/expire` | 200 | 201 | 156.3 | ✅ |  |
| 127 | Payments | DELETE /payments/:id cleanup #3 | DELETE | `/payments/852512bf-0ee7-4d67-9564-d4c77af47fbc` | 200 | 200 | 57 | ✅ |  |
| 128 | Payments | POST /payments transactionId not a UUID → 400 | POST | `/payments` | 400 | 400 | 48.2 | ✅ |  |
| 129 | VNPay | POST /payments/vnpay/create (owner, pending order) | POST | `/payments/vnpay/create` | 200 | 201 | 381.9 | ✅ |  |
| 130 | VNPay | POST /payments/vnpay/create (non-owner) → 403 | POST | `/payments/vnpay/create` | 403 | 403 | 100.9 | ✅ |  |
| 131 | VNPay | POST /payments/vnpay/create (anonymous) → 401 | POST | `/payments/vnpay/create` | 401 | 401 | 1.6 | ✅ |  |
| 132 | VNPay | POST /payments/vnpay/create empty body → 400 | POST | `/payments/vnpay/create` | 400 | 400 | 72.4 | ✅ |  |
| 133 | VNPay | POST /payments/vnpay/create closed (refunded) order → 409 | POST | `/payments/vnpay/create` | 409 | 409 | 56.7 | ✅ |  |
| 134 | VNPay | GET /payments/vnpay/return garbage → redirect (3xx) or 400 | GET | `/payments/vnpay/return` | 302|400 | 302 | 84.9 | ✅ |  |
| 135 | VNPay | GET /payments/vnpay/ipn garbage → RspCode (not 500) | GET | `/payments/vnpay/ipn` | 200 | 200 | 3 | ✅ |  |
| 136 | Tickets | POST publish → ok | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/publish` | 200 | 201 | 61.4 | ✅ |  |
| 137 | Tickets | POST unpublish → ok | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/unpublish` | 200 | 201 | 162.1 | ✅ |  |
| 138 | Tickets | POST open-sale → ok | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/open-sale` | 200 | 201 | 114.3 | ✅ |  |
| 139 | Tickets | POST close-sale → ok | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/close-sale` | 200 | 201 | 105.7 | ✅ |  |
| 140 | Tickets | POST prepare-stock → ok | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/prepare-stock` | 200 | 201 | 211.1 | ✅ |  |
| 141 | Tickets | POST prepare-stock invalid body → 400 | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/prepare-stock` | 400 | 400 | 50.5 | ✅ |  |
| 142 | Tickets | POST open-sale again after close → ok | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/open-sale` | 200 | 201 | 139.9 | ✅ |  |
| 143 | Tickets | POST /tickets/:id/ticket-items (admin) | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items` | 201 | 201 | 65.8 | ✅ |  |
| 144 | Tickets | POST ticket-items (user) → 403 | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items` | 403 | 403 | 49.8 | ✅ |  |
| 145 | Tickets | GET ticket-item detail (public) | GET | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items/24d0396e-253c-4176-ab52-bb3d5c2ef504` | 200 | 200 | 48.4 | ✅ |  |
| 146 | Tickets | GET ticket-item availability (public) | GET | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items/24d0396e-253c-4176-ab52-bb3d5c2ef504/availability` | 200 | 200 | 51.3 | ✅ |  |
| 147 | Tickets | PATCH ticket-item (admin) | PATCH | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items/24d0396e-253c-4176-ab52-bb3d5c2ef504` | 200 | 200 | 104.9 | ✅ |  |
| 148 | Tickets | PATCH ticket-item (user) → 403 | PATCH | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items/24d0396e-253c-4176-ab52-bb3d5c2ef504` | 403 | 403 | 48.4 | ✅ |  |
| 149 | Tickets | POST change-price (admin) | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items/24d0396e-253c-4176-ab52-bb3d5c2ef504/change-price` | 200 | 201 | 102.6 | ✅ |  |
| 150 | Tickets | POST change-price invalid → 400 | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items/24d0396e-253c-4176-ab52-bb3d5c2ef504/change-price` | 400 | 400 | 47.8 | ✅ |  |
| 151 | Tickets | POST change-sale-window (admin) | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items/24d0396e-253c-4176-ab52-bb3d5c2ef504/change-sale-window` | 200 | 201 | 106.6 | ✅ |  |
| 152 | Tickets | POST reserve-seat (admin) | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items/24d0396e-253c-4176-ab52-bb3d5c2ef504/reserve-seat` | 200 | 201 | 104.8 | ✅ |  |
| 153 | Tickets | POST reserve-seat missing label → 400 | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items/24d0396e-253c-4176-ab52-bb3d5c2ef504/reserve-seat` | 400 | 400 | 50.1 | ✅ |  |
| 154 | Tickets | POST release-seat (admin) | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items/24d0396e-253c-4176-ab52-bb3d5c2ef504/release-seat` | 200 | 201 | 105 | ✅ |  |
| 155 | Tickets | DELETE ticket-item (user) → 403 | DELETE | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items/24d0396e-253c-4176-ab52-bb3d5c2ef504` | 403 | 403 | 49 | ✅ |  |
| 156 | Tickets | DELETE ticket-item (admin) | DELETE | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/ticket-items/24d0396e-253c-4176-ab52-bb3d5c2ef504` | 200 | 200 | 102.7 | ✅ |  |
| 157 | Tickets | POST /tickets/:id/reserve missing ticketItemId → 400 | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/reserve` | 400 | 400 | 51.4 | ✅ |  |
| 158 | Tickets | POST /tickets/:id/reserve (admin) | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/reserve` | 200|409 | 409 | 102 | ✅ |  |
| 159 | Tickets | POST /tickets/:id/release (admin) | POST | `/tickets/16cb0ca8-03d2-48b2-ac21-6e77ce6acb0b/release` | 200 | 201 | 105.8 | ✅ |  |
| 160 | Notifications | GET /notifications/my (authed) | GET | `/notifications/my` | 200 | 200 | 124.9 | ✅ |  |
| 161 | Notifications | GET /notifications/my (anonymous) → 401 | GET | `/notifications/my` | 401 | 401 | 1.7 | ✅ |  |
| 162 | Notifications | GET /notifications (admin) page=0 → sanitized | GET | `/notifications` | 200 | 200 | 58.1 | ✅ |  |
| 163 | Notifications | GET /notifications (admin) | GET | `/notifications` | 200 | 200 | 55.9 | ✅ |  |
| 164 | Notifications | GET /notifications (user) → 403 | GET | `/notifications` | 403 | 403 | 48.6 | ✅ |  |
| 165 | Notifications | GET /notifications/my?limit=999 → capped | GET | `/notifications/my` | 200 | 200 | 54.2 | ✅ |  |
| 166 | Auth | POST /auth/logout → ok | POST | `/auth/logout` | 200 | 201 | 96.8 | ✅ |  |

## Ghi chú

- Các ca **❌** cần đội phát triển xem xét; chi tiết nằm ở cột *Lý do*.
- Response đầy đủ nằm ở file JSON tương ứng trong `scripts/test-results/`.
