# Báo cáo kiểm tra API — Railway Ticket Booking

- **Ngày tạo:** 2026-10-10T14:38:37.459Z
- **Base URL:** http://localhost:8081
- **Tổng ca kiểm tra:** 166
- **Đạt:** 166 / **Lỗi:** 0 (100%)
- **Thời gian trung bình/ca:** 124 ms

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
| 1 | Auth | login admin | POST | `/auth/login` | 200 | 201 | 215.1 | ✅ |  |
| 2 | Auth | login user (mai-anh) | POST | `/auth/login` | 200 | 201 | 261.7 | ✅ |  |
| 3 | Auth | login user (linh-tran) | POST | `/auth/login` | 200 | 201 | 112.6 | ✅ |  |
| 4 | Auth | register fresh user | POST | `/auth/register` | 201 | 201 | 270 | ✅ | id=effb3dae-7bc7-4fad-8589-90ae55bc9f57 |
| 5 | Auth | login fresh user | POST | `/auth/login` | 200 | 201 | 267.5 | ✅ |  |
| 6 | Users | GET /users/me (admin) | GET | `/users/me` | 200 | 200 | 164.1 | ✅ |  |
| 7 | Tickets | POST /tickets (admin) create scratch | POST | `/tickets` | 201 | 201 | 130.2 | ✅ |  |
| 8 | Auth | GET /auth/health | GET | `/auth/health` | 200 | 200 | 52.4 | ✅ |  |
| 9 | Auth | register new user (or already exists on re-run) | POST | `/auth/register` | 201|409 | 409 | 263 | ✅ |  |
| 10 | Auth | register duplicate email → 409 | POST | `/auth/register` | 409 | 409 | 270.6 | ✅ |  |
| 11 | Auth | register missing email → 400 | POST | `/auth/register` | 400 | 400 | 3.2 | ✅ |  |
| 12 | Auth | register unknown field → 400 (forbidNonWhitelisted) | POST | `/auth/register` | 400 | 400 | 2.3 | ✅ |  |
| 13 | Auth | login wrong password → 401 | POST | `/auth/login` | 401 | 401 | 263.6 | ✅ |  |
| 14 | Auth | login non-existent email → 401 | POST | `/auth/login` | 401 | 401 | 54.4 | ✅ |  |
| 15 | Auth | GET /auth/session (authed) | GET | `/auth/session` | 200 | 200 | 54 | ✅ |  |
| 16 | Auth | GET /auth/session (anonymous) | GET | `/auth/session` | 200 | 200 | 1.5 | ✅ |  |
| 17 | Auth | POST /auth/refresh-token (with cookie) | POST | `/auth/refresh-token` | 200 | 201 | 115.2 | ✅ |  |
| 18 | Auth | POST /auth/refresh-token (no cookie) → 401 | POST | `/auth/refresh-token` | 401 | 401 | 1.6 | ✅ |  |
| 19 | Auth | POST /auth/forgot-password existing email | POST | `/auth/forgot-password` | 200 | 201 | 56.7 | ✅ |  |
| 20 | Auth | POST /auth/forgot-password unknown email → generic 200 | POST | `/auth/forgot-password` | 200 | 201 | 52.1 | ✅ |  |
| 21 | Auth | POST /auth/forgot-password missing email → 400 | POST | `/auth/forgot-password` | 400 | 400 | 1.9 | ✅ |  |
| 22 | Auth | POST /auth/reset-password missing fields → 400 | POST | `/auth/reset-password` | 400 | 400 | 2.1 | ✅ |  |
| 23 | Auth | POST /auth/reset-password invalid token → 401 | POST | `/auth/reset-password` | 401 | 401 | 50.3 | ✅ |  |
| 24 | Auth | POST /auth/change-password wrong old → 401 | POST | `/auth/change-password` | 401 | 401 | 315.5 | ✅ |  |
| 25 | Auth | POST /auth/change-password correct old → ok | POST | `/auth/change-password` | 200 | 201 | 518.2 | ✅ |  |
| 26 | Auth | POST /auth/verify-email missing token → 400 | POST | `/auth/verify-email` | 400 | 400 | 1.9 | ✅ |  |
| 27 | Auth | POST /auth/resend-verification unknown email → generic 200 | POST | `/auth/resend-verification` | 200 | 201 | 52.3 | ✅ |  |
| 28 | Auth | GET /auth/google → 501 (not implemented) | GET | `/auth/google` | 501 | 501 | 2.1 | ✅ |  |
| 29 | Auth | GET /auth/google/callback no code → 401 | GET | `/auth/google/callback` | 401 | 401 | 2 | ✅ |  |
| 30 | Auth | POST /auth/revoke-all-sessions → ok | POST | `/auth/revoke-all-sessions` | 200 | 201 | 106.8 | ✅ |  |
| 31 | Auth | existing access token rejected after revoke-all (tokenVersion bumped) → 401 | GET | `/users/me` | 401 | 401 | 54.8 | ✅ |  |
| 32 | Auth | re-login user after password change | POST | `/auth/login` | 200 | 201 | 261 | ✅ |  |
| 33 | Users | GET /users/health → 200 | GET | `/users/health` | 200 | 200 | 52.5 | ✅ |  |
| 34 | Users | GET /users/me (anonymous) → 401 | GET | `/users/me` | 401 | 401 | 1.4 | ✅ |  |
| 35 | Users | PATCH /users/me update username | PATCH | `/users/me` | 200 | 200 | 106.9 | ✅ |  |
| 36 | Users | GET /users ?page limit (admin) | GET | `/users` | 200 | 200 | 105.6 | ✅ |  |
| 37 | Users | GET /users (normal user) → 403 | GET | `/users` | 403 | 403 | 53.6 | ✅ |  |
| 38 | Users | GET /users ?page=0 → 400 | GET | `/users` | 400 | 400 | 52.7 | ✅ |  |
| 39 | Users | GET /users/by-email (admin) | GET | `/users/by-email` | 200 | 200 | 105 | ✅ |  |
| 40 | Users | GET /users/by-email (user) → 403 | GET | `/users/by-email` | 403 | 403 | 53.9 | ✅ |  |
| 41 | Users | GET /users/:id (admin) | GET | `/users/f3c7e090-e837-4d7a-85d8-c92c206f4ee1` | 200 | 200 | 105.2 | ✅ |  |
| 42 | Users | GET /users/:id (other user) → 403 | GET | `/users/f3c7e090-e837-4d7a-85d8-c92c206f4ee1` | 403 | 403 | 54.1 | ✅ |  |
| 43 | Users | GET /users/:nonexistent → 404 | GET | `/users/00000000-0000-0000-0000-000000000000` | 404 | 404 | 106.5 | ✅ |  |
| 44 | Users | POST /users (admin) create (payload wrapper) | POST | `/users` | 201 | 201 | 310 | ✅ |  |
| 45 | Users | POST /users (normal user) → 403 | POST | `/users` | 403 | 403 | 53.8 | ✅ |  |
| 46 | Users | PATCH /users/:id (admin) | PATCH | `/users/367af51b-f456-42bc-96c3-7ac7d5aff817` | 200 | 200 | 107.3 | ✅ |  |
| 47 | Users | DELETE /users/:id (admin) | DELETE | `/users/367af51b-f456-42bc-96c3-7ac7d5aff817` | 200 | 200 | 176.5 | ✅ |  |
| 48 | Tickets | GET /tickets/health → 200 | GET | `/tickets/health` | 200 | 200 | 6 | ✅ |  |
| 49 | Tickets | GET /tickets (public, paginated) | GET | `/tickets` | 200 | 200 | 22.3 | ✅ |  |
| 50 | Tickets | GET /tickets ?status=bogus → 400 | GET | `/tickets` | 400 | 400 | 1.9 | ✅ |  |
| 51 | Tickets | GET /tickets ?limit=0 → 400 | GET | `/tickets` | 400 | 400 | 1.5 | ✅ |  |
| 52 | Tickets | GET /tickets/:id (detail) | GET | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d` | 200 | 200 | 61 | ✅ |  |
| 53 | Tickets | GET /tickets/:nonexistent → 404 | GET | `/tickets/00000000-0000-0000-0000-000000000000` | 404 | 404 | 53.8 | ✅ |  |
| 54 | Tickets | GET /tickets/:id/availability | GET | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/availability` | 200 | 200 | 57.8 | ✅ |  |
| 55 | Tickets | GET /tickets/:id/seat-map | GET | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/seat-map` | 200 | 200 | 100.5 | ✅ |  |
| 56 | Tickets | POST /tickets (user) → 403 | POST | `/tickets` | 403 | 403 | 106.8 | ✅ |  |
| 57 | Tickets | POST /tickets invalid body → 400 | POST | `/tickets` | 400 | 400 | 50.1 | ✅ |  |
| 58 | Tickets | POST /tickets unknown field → 400 | POST | `/tickets` | 400 | 400 | 92.8 | ✅ |  |
| 59 | Tickets | PATCH /tickets/:id (admin) | PATCH | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d` | 200 | 200 | 116.2 | ✅ |  |
| 60 | Tickets | PATCH /tickets/:id (user) → 403 | PATCH | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d` | 403 | 403 | 96.5 | ✅ |  |
| 61 | Search | GET /search/health → 200 | GET | `/search/health` | 200 | 200 | 214.9 | ✅ |  |
| 62 | Search | GET /search/trips (full params) | GET | `/search/trips` | 200 | 200 | 44.6 | ✅ |  |
| 63 | Search | GET /search/trips empty query → 200 | GET | `/search/trips` | 200 | 200 | 51.4 | ✅ |  |
| 64 | Search | GET /search/trips invalid date → 400 | GET | `/search/trips` | 400 | 400 | 1.7 | ✅ |  |
| 65 | Search | GET /search/trips invalid sort → 400 | GET | `/search/trips` | 400 | 400 | 1.8 | ✅ |  |
| 66 | Search | GET /search/trips limit=100 → 400 (max 50) | GET | `/search/trips` | 400 | 400 | 2.7 | ✅ |  |
| 67 | Search | GET /search/suggest-stations ?q | GET | `/search/suggest-stations` | 200 | 200 | 53.3 | ✅ |  |
| 68 | Search | GET /search/suggest-stations (no q) → 200 | GET | `/search/suggest-stations` | 200 | 200 | 52.6 | ✅ |  |
| 69 | Orders | GET /orders/health → 200 | GET | `/orders/health` | 200 | 200 | 64.4 | ✅ |  |
| 70 | Orders | POST /orders/checkout (user, 2 seats) | POST | `/orders/checkout` | 200|201 | 201 | 258.4 | ✅ |  |
| 71 | Orders | POST /orders/checkout idempotent replay → same order | POST | `/orders/checkout` | 200|201 | 201 | 112.3 | ✅ | dedupe OK — replayed key returns same order |
| 72 | Orders | POST /orders/checkout 2nd order (cancel target) | POST | `/orders/checkout` | 200|201 | 201 | 276.4 | ✅ |  |
| 73 | Orders | POST /orders/checkout 3rd order (payment-flow target) | POST | `/orders/checkout` | 200|201 | 201 | 276.1 | ✅ |  |
| 74 | Orders | POST /orders/checkout 4th order (vnpay target) | POST | `/orders/checkout` | 200|201 | 201 | 279 | ✅ |  |
| 75 | Orders | POST /orders/checkout (anonymous) → 401 | POST | `/orders/checkout` | 401 | 401 | 1.6 | ✅ |  |
| 76 | Orders | POST /orders/checkout empty body → 400 | POST | `/orders/checkout` | 400 | 400 | 55 | ✅ |  |
| 77 | Orders | GET /orders (user, own list) | GET | `/orders` | 200 | 200 | 66.6 | ✅ |  |
| 78 | Orders | GET /orders (anonymous) → 401 | GET | `/orders` | 401 | 401 | 1.4 | ✅ |  |
| 79 | Orders | POST /orders (user) → 403 | POST | `/orders` | 403 | 403 | 54.4 | ✅ |  |
| 80 | Orders | POST /orders (admin) create | POST | `/orders` | 200|201 | 201 | 109.7 | ✅ |  |
| 81 | Orders | POST /orders unknown field → 400 | POST | `/orders` | 400 | 400 | 55.9 | ✅ |  |
| 82 | Orders | GET /orders/:id (owner) | GET | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7` | 200 | 200 | 158.9 | ✅ |  |
| 83 | Orders | GET /orders/:id (non-owner) → 403 | GET | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7` | 403 | 403 | 105.6 | ✅ |  |
| 84 | Orders | GET /orders/:id/summary (owner) | GET | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7/summary` | 200 | 200 | 158.6 | ✅ |  |
| 85 | Orders | GET /orders/:nonexistent → 404 | GET | `/orders/00000000-0000-0000-0000-000000000000` | 404 | 404 | 104.7 | ✅ |  |
| 86 | Orders | PATCH /orders/:id/passengers (owner) | PATCH | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7/passengers` | 200 | 200 | 165 | ✅ |  |
| 87 | Orders | PATCH /orders/:id/passengers no body → 400 | PATCH | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7/passengers` | 400 | 400 | 52.5 | ✅ |  |
| 88 | Orders | PATCH /orders/:id/seat-labels (owner) | PATCH | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7/seat-labels` | 200 | 200 | 167.8 | ✅ |  |
| 89 | Orders | POST /orders/:id/mark-paid (user) → 403 | POST | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7/mark-paid` | 403 | 403 | 53.2 | ✅ |  |
| 90 | Orders | POST /orders/:id/cancel (owner) | POST | `/orders/8b6d5c9c-d59e-4cba-b2b5-859d810773d7/cancel` | 200 | 201 | 327.4 | ✅ |  |
| 91 | Orders | POST /orders/:id/cancel (non-owner) → 403 | POST | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7/cancel` | 403 | 403 | 107.4 | ✅ |  |
| 92 | Orders | POST /orders/:id/mark-paid (admin) | POST | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7/mark-paid` | 200 | 201 | 124 | ✅ |  |
| 93 | Orders | POST /orders/:id/confirm (admin) | POST | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7/confirm` | 200 | 201 | 120.6 | ✅ |  |
| 94 | Orders | POST /orders/:id/issue-ticket (admin) | POST | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7/issue-ticket` | 200 | 201 | 65.2 | ✅ | has ticket code/QR |
| 95 | Orders | POST /orders/:id/refund (admin) | POST | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7/refund` | 200 | 201 | 4018.7 | ✅ |  |
| 96 | Orders | POST /orders/:id/mark-pending-payment (user) → 403 | POST | `/orders/638221a1-4f6a-4ba6-93eb-5e187f8863a7/mark-pending-payment` | 403 | 403 | 68.7 | ✅ |  |
| 97 | Payments | GET /payments/health → 200 | GET | `/payments/health` | 200 | 200 | 64.4 | ✅ |  |
| 98 | Payments | GET /payments/order/:orderId (op) — verifies opId is a queryable, UUID-safe order | GET | `/payments/order/10c2136f-0bc8-45ec-854b-dbbf45c112fb` | 200 | 200 | 112.3 | ✅ |  |
| 99 | Payments | GET /payments/:id (owner) | GET | `/payments/8fbd6b03-c4a4-42d0-b418-83fe98174b89` | 200 | 200 | 160.9 | ✅ |  |
| 100 | Payments | GET /payments/:id (non-owner) → 403 | GET | `/payments/8fbd6b03-c4a4-42d0-b418-83fe98174b89` | 403 | 403 | 109.1 | ✅ |  |
| 101 | Payments | GET /payments/order/:orderId (owner) | GET | `/payments/order/638221a1-4f6a-4ba6-93eb-5e187f8863a7` | 200 | 200 | 108.4 | ✅ |  |
| 102 | Payments | GET /payments/order/:orderId (non-owner) → 403 | GET | `/payments/order/638221a1-4f6a-4ba6-93eb-5e187f8863a7` | 403 | 403 | 106.3 | ✅ |  |
| 103 | Payments | GET /payments/transaction/:txn (admin) | GET | `/payments/transaction/342053ba58f84f5abaca073be7218a63` | 200 | 200 | 106.1 | ✅ |  |
| 104 | Payments | GET /payments (admin) | GET | `/payments` | 200 | 200 | 61.3 | ✅ |  |
| 105 | Payments | GET /payments (user) → 403 | GET | `/payments` | 403 | 403 | 56.7 | ✅ |  |
| 106 | Payments | GET /users/me (resolve user id) | GET | `/users/me` | 200 | 200 | 106.4 | ✅ |  |
| 107 | Payments | GET /payments/user/:id (own) | GET | `/payments/user/a7b7e090-e837-4d7a-85d8-c92c206f4ee2` | 200 | 200 | 62 | ✅ |  |
| 108 | Payments | GET /users/me (user2) | GET | `/users/me` | 200 | 200 | 106 | ✅ |  |
| 109 | Payments | GET /payments/user/:id (own, user2) | GET | `/payments/user/b7b7e090-e837-4d7a-85d8-c92c206f4ee3` | 200 | 200 | 106.1 | ✅ |  |
| 110 | Payments | GET /payments/user/:id (someone else) → 403 | GET | `/payments/user/b7b7e090-e837-4d7a-85d8-c92c206f4ee3` | 403 | 403 | 54.8 | ✅ |  |
| 111 | Payments | POST /payments (admin) create with explicit UUID transactionId | POST | `/payments` | 201 | 201 | 152.3 | ✅ |  |
| 112 | Payments | POST /payments (user) → 403 | POST | `/payments` | 403 | 403 | 54.2 | ✅ |  |
| 113 | Payments | POST /payments invalid body → 400 | POST | `/payments` | 400 | 400 | 55.4 | ✅ |  |
| 114 | Payments | POST /payments/mark-processing (admin) | POST | `/payments/mark-processing` | 200 | 201 | 112.6 | ✅ |  |
| 115 | Payments | POST /payments/mark-paid (admin) | POST | `/payments/mark-paid` | 200 | 201 | 117 | ✅ |  |
| 116 | Payments | POST /payments/mark-refunded (admin) | POST | `/payments/mark-refunded` | 200 | 201 | 106.5 | ✅ |  |
| 117 | Payments | DELETE /payments/:id (admin) | DELETE | `/payments/31046d2b-ae5c-4a92-8450-2b03ff63bb16` | 200 | 200 | 111.4 | ✅ |  |
| 118 | Payments | POST /payments/mark-paid missing id → 400 | POST | `/payments/mark-paid` | 400 | 400 | 53.6 | ✅ |  |
| 119 | Payments | POST /payments (admin) create #failed | POST | `/payments` | 201 | 201 | 106.3 | ✅ |  |
| 120 | Payments | POST /payments/mark-failed (admin) | POST | `/payments/mark-failed` | 200 | 201 | 110.1 | ✅ |  |
| 121 | Payments | DELETE /payments/:id cleanup | DELETE | `/payments/c9f68802-d036-48cf-88cb-84f95bafbe5d` | 200 | 200 | 108.5 | ✅ |  |
| 122 | Payments | POST /payments (admin) create #cancel | POST | `/payments` | 201 | 201 | 106.9 | ✅ |  |
| 123 | Payments | POST /payments/cancel (admin) | POST | `/payments/cancel` | 200 | 201 | 105.1 | ✅ |  |
| 124 | Payments | DELETE /payments/:id cleanup #2 | DELETE | `/payments/65b7ae89-6539-4a40-9a8d-5f5dcdb40a06` | 200 | 200 | 105.2 | ✅ |  |
| 125 | Payments | POST /payments (admin) create #expire | POST | `/payments` | 201 | 201 | 104.8 | ✅ |  |
| 126 | Payments | POST /payments/expire (admin) | POST | `/payments/expire` | 200 | 201 | 104.2 | ✅ |  |
| 127 | Payments | DELETE /payments/:id cleanup #3 | DELETE | `/payments/73c92ec6-854a-4ebb-a7cf-8c5957934041` | 200 | 200 | 105 | ✅ |  |
| 128 | Payments | POST /payments transactionId not a UUID → 400 | POST | `/payments` | 400 | 400 | 53.5 | ✅ |  |
| 129 | VNPay | POST /payments/vnpay/create (owner, pending order) | POST | `/payments/vnpay/create` | 200 | 201 | 283.2 | ✅ |  |
| 130 | VNPay | POST /payments/vnpay/create (non-owner) → 403 | POST | `/payments/vnpay/create` | 403 | 403 | 104.5 | ✅ |  |
| 131 | VNPay | POST /payments/vnpay/create (anonymous) → 401 | POST | `/payments/vnpay/create` | 401 | 401 | 2.1 | ✅ |  |
| 132 | VNPay | POST /payments/vnpay/create empty body → 400 | POST | `/payments/vnpay/create` | 400 | 400 | 52 | ✅ |  |
| 133 | VNPay | POST /payments/vnpay/create closed (refunded) order → 409 | POST | `/payments/vnpay/create` | 409 | 409 | 58.4 | ✅ |  |
| 134 | VNPay | GET /payments/vnpay/return garbage → redirect (3xx) or 400 | GET | `/payments/vnpay/return` | 302|400 | 302 | 54.2 | ✅ |  |
| 135 | VNPay | GET /payments/vnpay/ipn garbage → RspCode (not 500) | GET | `/payments/vnpay/ipn` | 200 | 200 | 2 | ✅ |  |
| 136 | Tickets | POST publish → ok | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/publish` | 200 | 201 | 62.8 | ✅ |  |
| 137 | Tickets | POST unpublish → ok | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/unpublish` | 200 | 201 | 108.7 | ✅ |  |
| 138 | Tickets | POST open-sale → ok | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/open-sale` | 200 | 201 | 113.1 | ✅ |  |
| 139 | Tickets | POST close-sale → ok | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/close-sale` | 200 | 201 | 112.6 | ✅ |  |
| 140 | Tickets | POST prepare-stock → ok | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/prepare-stock` | 200 | 201 | 116.3 | ✅ |  |
| 141 | Tickets | POST prepare-stock invalid body → 400 | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/prepare-stock` | 400 | 400 | 51.5 | ✅ |  |
| 142 | Tickets | POST open-sale again after close → ok | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/open-sale` | 200 | 201 | 112 | ✅ |  |
| 143 | Tickets | POST /tickets/:id/ticket-items (admin) | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items` | 201 | 201 | 64.3 | ✅ |  |
| 144 | Tickets | POST ticket-items (user) → 403 | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items` | 403 | 403 | 61.1 | ✅ |  |
| 145 | Tickets | GET ticket-item detail (public) | GET | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items/bcf4886a-e71c-4f08-b2d9-18b3f2c1bbf1` | 200 | 200 | 99.2 | ✅ |  |
| 146 | Tickets | GET ticket-item availability (public) | GET | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items/bcf4886a-e71c-4f08-b2d9-18b3f2c1bbf1/availability` | 200 | 200 | 55.6 | ✅ |  |
| 147 | Tickets | PATCH ticket-item (admin) | PATCH | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items/bcf4886a-e71c-4f08-b2d9-18b3f2c1bbf1` | 200 | 200 | 216 | ✅ |  |
| 148 | Tickets | PATCH ticket-item (user) → 403 | PATCH | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items/bcf4886a-e71c-4f08-b2d9-18b3f2c1bbf1` | 403 | 403 | 91.8 | ✅ |  |
| 149 | Tickets | POST change-price (admin) | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items/bcf4886a-e71c-4f08-b2d9-18b3f2c1bbf1/change-price` | 200 | 201 | 105.7 | ✅ |  |
| 150 | Tickets | POST change-price invalid → 400 | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items/bcf4886a-e71c-4f08-b2d9-18b3f2c1bbf1/change-price` | 400 | 400 | 54.2 | ✅ |  |
| 151 | Tickets | POST change-sale-window (admin) | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items/bcf4886a-e71c-4f08-b2d9-18b3f2c1bbf1/change-sale-window` | 200 | 201 | 64 | ✅ |  |
| 152 | Tickets | POST reserve-seat (admin) | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items/bcf4886a-e71c-4f08-b2d9-18b3f2c1bbf1/reserve-seat` | 200 | 201 | 111.5 | ✅ |  |
| 153 | Tickets | POST reserve-seat missing label → 400 | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items/bcf4886a-e71c-4f08-b2d9-18b3f2c1bbf1/reserve-seat` | 400 | 400 | 184.1 | ✅ |  |
| 154 | Tickets | POST release-seat (admin) | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items/bcf4886a-e71c-4f08-b2d9-18b3f2c1bbf1/release-seat` | 200 | 201 | 153.2 | ✅ |  |
| 155 | Tickets | DELETE ticket-item (user) → 403 | DELETE | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items/bcf4886a-e71c-4f08-b2d9-18b3f2c1bbf1` | 403 | 403 | 57.4 | ✅ |  |
| 156 | Tickets | DELETE ticket-item (admin) | DELETE | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/ticket-items/bcf4886a-e71c-4f08-b2d9-18b3f2c1bbf1` | 200 | 200 | 65.4 | ✅ |  |
| 157 | Tickets | POST /tickets/:id/reserve missing ticketItemId → 400 | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/reserve` | 400 | 400 | 76.2 | ✅ |  |
| 158 | Tickets | POST /tickets/:id/reserve (admin) | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/reserve` | 200|409 | 409 | 161.8 | ✅ |  |
| 159 | Tickets | POST /tickets/:id/release (admin) | POST | `/tickets/283c8005-d6c6-44bd-8a8a-7a8e289b6b4d/release` | 200 | 201 | 113.3 | ✅ |  |
| 160 | Notifications | GET /notifications/my (authed) | GET | `/notifications/my` | 200 | 200 | 149.2 | ✅ |  |
| 161 | Notifications | GET /notifications/my (anonymous) → 401 | GET | `/notifications/my` | 401 | 401 | 1.6 | ✅ |  |
| 162 | Notifications | GET /notifications (admin) page=0 → sanitized | GET | `/notifications` | 200 | 200 | 60.5 | ✅ |  |
| 163 | Notifications | GET /notifications (admin) | GET | `/notifications` | 200 | 200 | 57.2 | ✅ |  |
| 164 | Notifications | GET /notifications (user) → 403 | GET | `/notifications` | 403 | 403 | 51.4 | ✅ |  |
| 165 | Notifications | GET /notifications/my?limit=999 → capped | GET | `/notifications/my` | 200 | 200 | 66.4 | ✅ |  |
| 166 | Auth | POST /auth/logout → ok | POST | `/auth/logout` | 200 | 201 | 105.7 | ✅ |  |

## Ghi chú

- Các ca **❌** cần đội phát triển xem xét; chi tiết nằm ở cột *Lý do*.
- Response đầy đủ nằm ở file JSON tương ứng trong `scripts/test-results/`.
