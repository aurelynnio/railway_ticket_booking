# Vietrail Way — UX Requirements & Visual Direction Proposals

> **Status:** Analysis draft — *no final visual style chosen yet.*
> **Scope:** Railway ticket booking product (Vietnamese market, web-first).
> **Inputs reviewed:** `README.md`, `docs/architecture-diagrams.md`, Prisma schemas of all 5 services, `client/lib/api-types/*`, every `client/app/**` route, `client/components/**` (patterns, ticket, payment, seat, shell, ui, motion, iso, a11y), `client/lib` (stores, formatters, i18n, validation, motion), `client/hooks/*`, and the full HTTP surface in `api-gateway/src/**` (controllers, guards, VNPay service, error filter) plus service business logic (`tickets-service`, `orders-service`, `payments-service`, `auth-service`, `notification-service`).
> **Output:** feature inventory + UX requirement document + three visual direction proposals. The full design system will only be produced **after approval**.

---

## 1. Project understanding summary

### 1.1 What the product is

**Vietrail Way** is an online railway ticket booking platform for the Vietnamese rail network ("Đặt vé tàu Bắc · Trung · Nam" — North · Central · South lines). Travelers search journeys, compare fare classes, choose seats on a visual coach map, pay via **VNPay**, and receive an **electronic ticket with a QR code** (in-app + email).

The repository is a **production-grade, event-driven system**, not a CRUD demo:

- **Client:** Next.js 16 (App Router, React 19, Tailwind CSS 4, shadcn/radix, TanStack Query, axios, react-hook-form + zod, Zustand, GSAP, lucide icons, next-themes). One app serves **public traveler UI and the admin portal** (`/admin/*`); admin pages reuse the same components, switched by `pathname.startsWith("/admin")`.
- **Backend:** NestJS API gateway (`:8080`) → 5 RabbitMQ microservices (auth, tickets+search, orders, payments, notification), PostgreSQL per service, Redis (Redlock + cache). Roles: **USER=0, ADMIN=1**; cookie JWT (access 15 min / refresh 7 d) with client-side refresh dedupe.
- **Payments:** VNPay gateway — IPN (server-to-server) is the DB source of truth, return URL is display-only; 10-minute order TTL via delayed queue; transactional outbox (`payment.paid`); saga choreography with compensation (seat release). Idempotency keys prevent duplicate orders.
- **Domain vocabulary (Vietnamese):** ga đi / ga đến (from/to station), toa (coach), ghế (seat), hạng ghế / loại chỗ (fare class / seat type), ngày đi (departure date), giữ chỗ (hold/reserve), hoàn chỗ (release), vé điện tử (e-ticket), đơn hàng (order), thanh toán (payment).

### 1.2 Current frontend state

The client **already contains a substantial, deliberately designed system** — internally labelled *"Vietrail (Premium Editorial Edition)"* in `globals.css`:

- **Typography:** Fraunces (display serif) + Space Grotesk (UI sans) + IBM Plex Mono (codes, times, prices) — all with `vietnamese` subsets.
- **Color:** deep teal `#0D7377` (primary), warm amber `#B8632A` (accent), warm off-white background, ink `#1A2332`; complete dark mode; full semantic scales for **seat status** (available/selected/occupied/female/accessible/premium — special ones token-only today), **ticket status**, **order status**, **payment status**.
- **Geometry:** "border-first, minimal shadow"; small radii (0.375–1.25rem); subtle elevation.
- **Signature elements:** 2.5D isometric SVG seat map (2D fallback toggle), isometric hero visual, ticket-notch perforation, animated route line, GSAP motion system with reduced-motion support, count-up stats, skip-link, a11y announcer, `lang="vi"`, skeletons, empty/error illustrations.
- **Booking wizard:** a single scrollable form inside the ticket detail "Đặt chỗ" tab (stepper: Chọn chuyến → Chọn ghế → Thông tin → Thanh toán) with a price-breakdown sidebar.

So the design task is not "start from a blank canvas" — it is **"validate, harden, and possibly re-express the existing direction"** against the UX-critical requirements below. Several **functional/UX gaps** (see §6) must be fixed regardless of which visual direction is chosen.

### 1.3 Domain model & business rules (verified from schema + code)

| Entity | Key fields | Notes |
|---|---|---|
| **Ticket** (chuyến) | title, trainNumber, from/to station code+name, dateStart/dateEnd, journeyNote, status (0 Draft / 1 Published) | Search exposes only Published |
| **TicketItem** (hạng/toa) | coachCode, seatClass*, seatType*, seatLabels[], availableSeatLabels[], occupiedSeatLabels (computed), stockInitial/stockAvailable/stockPrepared, priceOriginal, priceFlash, saleStartTime/saleEndTime | *free text — seed uses e.g. "Seat"/"Sleeper"/"Premium", "Lower berth"/"Recliner" |
| **Order** | user, ticket snapshot, quantity, unitPrice, totalPrice (server-computed), ticketCode `TCK-<orderId 8ch>`, qrPayload JSON `{orderId,ticketCode,ticketId,ticketItemId,userId,quantity}`, idempotencyKey, status | 0 Draft, 1 PendingPayment, 2 Paid, 3 Confirmed, 4 TicketIssued, 5 Cancelled, 6 Expired, 7 Refunded |
| **OrderSeatLabel / OrderPassenger** | selected seats; fullName, passengerType (ADULT/CHILD/STUDENT/SENIOR), identityNumber (CCCD/passport/DOB), phoneNumber | |
| **Payment** | orderId, amount, paymentMethod ("VNPAY" default), status, transactionId (unique) | 0 Pending, 1 Processing, 2 Paid, 3 Failed, 4 Cancelled, 5 Expired |
| **AuthAccount** | username, email, role, emailVerified, googleId | email verification + hashed reset tokens (reset token expiry 1 h) |
| **Notification** | userId, recipientEmail, type, subject, body, status | Email only (SMTP); no read/unread |

**Verified business rules that affect UX copy and flows:**

1. **Price semantics:** display/selling price = `priceFlash` when set (and sale window open), else `priceOriginal`; `minPrice` = min across fare classes. Checkout `unitPrice = priceFlash ?? priceOriginal`.
2. **Passenger discounts are computed server-side** at checkout when passengers are supplied: ADULT 1.0, CHILD 0.75, STUDENT 0.9, SENIOR 0.85, rounded to the nearest 1,000 VND. The client shows a **preview**; the server is authoritative for `totalPrice`.
3. **Seat availability:** `availableSeatLabels` = sellable seats; `stockAvailable` = count; `occupiedSeatLabels` = seatLabels − available. Availability/seat-map responses are cached **15 s**; ticket lists/detail **300 s** — the UI can briefly show seats as free that are already taken (server rejects with 409).
4. **Sale gating:** an item can be sold only if `stockPrepared` and `now ∈ [saleStartTime, saleEndTime]` (unset = open). Errors: 409 "Stock has not been prepared" / "Sale window is closed".
5. **Hold/TTL = 10 minutes**, enforced server-side from **order creation** (delayed queue + per-minute cron). ⚠️ **Both expiry paths set the order to `Cancelled(5)` with reason "Unpaid order expired…" — not `Expired(6)`**; `Expired` is reachable only via the admin `/expire` action. The UI must treat "Cancelled + unpaid" as "hết hạn thanh toán".
6. **Checkout:** `seatLabels.length ≤ quantity`; explicit seat labels are reserved one-by-one, and the remainder of `quantity` is reserved as stock — **seat selection is optional**. Idempotency key replays the same order on retry (no duplicates).
7. **Ticket issuance** (`issueTicket`, only from Paid/Confirmed) generates `ticketCode` + `qrPayload` once; saga auto-advances Paid → Confirmed → TicketIssued + email after `payment.paid`.
8. **Cancel (user or admin):** allowed from any status except Cancelled/Expired/Refunded; workflow cancels pending payments and releases held seats. **Refund (admin only) is a status flip Paid/Confirmed/TicketIssued → Refunded — no VNPay refund call, no seat release, no email.**
9. **Errors the UI must handle gracefully:** 409 "Seat is not available", "One or more selected seats are currently being held by another user. Please choose different seats.", "Not enough stock available", "Order is already closed"; 429 throttling (global 100 req/min; auth stricter); 503 "The system is currently experiencing high load, please try again."
10. **Notification emails:** user_registered, email_verification (24 h), password_reset (⚠️ email text says "valid for 10 minutes" but token expiry is 1 h), order_created ("pay within 10 minutes"), payment_paid ("show this code at the station"). **No emails for cancel/expire/refund.**

---

## 2. Assumptions and missing information

### 2.1 Assumptions made (to be confirmed)
1. **Web is the primary surface**; mobile is the responsive variant (mobile bottom nav exists). No separate iOS/Android apps in this repo.
2. **Vietnamese is the only UI language** for now; `lib/i18n/vi.ts` is a dictionary **not yet wired** — most strings are still hardcoded, and status labels are **English**.
3. **VND** is the only currency; integer prices; discounts rounded to 1,000 VND.
4. Discounts are **server-authoritative** at checkout (client preview may match but is not authoritative).
5. **No self-service change/refund journey exists** despite UI copy advertising "đổi vé miễn phí trước 24h" and "hoàn 10–20%". User cancel is available but refund-less; refund is an admin status flip.
6. Seat labels are free-form strings (seed: `A1…A12`, `B1…B16`); `seatClass`/`seatType` are free text; no row/berth/position modeling.
7. Female-only / accessible / premium seats exist as **CSS tokens and legend copy only** — the data model cannot express them yet.
8. The client "hold countdown" (starts at first seat toggle, 10 min) is a **local countdown to check out**; the server TTL runs from order creation. The two timers can disagree (a user can select seats, wait, and check out near the local deadline — the server then grants a fresh 10 minutes from checkout).

### 2.2 Questions that must be answered before finalizing the design system
1. **Platform scope:** Is mobile-web the target? Do we need PWA/offline? (Currently no offline support; QR generation depends on the CDN `api.qrserver.com`.)
2. **Brand:** Is there an external brand guideline beyond the in-repo tokens? Who owns the Vietrail brand assets in `public/logos/`?
3. **Passenger eligibility & legal:** Are CHILD (6–10), STUDENT, SENIOR (≥60) discount rules legally verified? Is the refund policy official, and does the product need to **enforce** it (real change/refund endpoints) or just display it?
4. **Real-time behavior:** How fresh must availability be? Auto-refresh of the seat map (currently 15 s cache, no polling)? What happens when a seat a user is holding gets taken elsewhere (409 today)?
5. **Seat taxonomy:** Standardize seatClass/seatType enumerations? Should accessible/female-only/premium attributes be added to the data model so the UI can honor them?
6. **Admin roles:** One ADMIN role today — need scoped operators (sales agent vs. inventory vs. finance)?
7. **Accessibility target:** WCAG 2.1 AA? Corporate a11y requirements?
8. **Notifications:** Email only today — SMS/push later? Read/unread for the in-app notification log?
9. **Payments:** VNPay only for travelers (manual payment form is admin dead code)? E-wallets/cards later?
10. **Scale:** Expected concurrent users / order volume — affects data-density choices for admin tables and search lists.
11. **Contact delivery:** The booking form collects email + phone for the e-ticket, but the payload does not currently send them — is persisting contact info on the order a planned fix (it must be, for the email promise to hold)?

---

## 3. Feature inventory

### 3.1 Traveler (public)
| Area | Features found in code |
|---|---|
| **Home** | Hero search form (ga đi / ga đến / ngày đi, swap), quick stats with CountUp (chuyến đang mở bán, chỗ còn lại, giá từ), 4-step journey strip, featured trip card (notch + tilt), "chuyến đang mở bán" grid, trust pills (Thanh toán bảo mật, Hoàn vé trong 24h, Hỗ trợ 24/7), task cards |
| **Search** | from/to/date (station suggestions API with 5-station fallback), swap, quick date stepper (Hôm trước / Hôm nay / Hôm sau), sort (Phù hợp nhất / Giá thấp trước / Khởi hành sớm), time-of-day pills (Sáng 00–12 / Chiều 12–18 / Tối 18–24), seat-class pills (Ngồi mềm / Giường nằm), active-filter chips, result summary (chuyến phù hợp / chỗ trống tổng / giá từ), pagination (page size 12), deferred queries, skeletons |
| **Trip results** | Notched cards: mono train number, availability badge with urgency ("Sắp hết — N chỗ" pulsing / "Còn N chỗ" / "Hết chỗ"), big mono times, duration + route line, date under times, seat-class chips, "Giá vé từ … Đã gồm thuế & bảo hiểm", CTA "Chọn vé & ghế" / disabled "Hết chỗ" |
| **Ticket catalog** | `/tickets` — FilterBar (ga đi / ga đến / date) over notched cards; min price per item = `priceFlash ?? priceOriginal` |
| **Ticket detail** | Tabs: **Hành trình** (journey + fare-class cards "Chọn hạng vé" + RouteMap), **Đặt chỗ** (full wizard), **Sơ đồ ghế** (2D + admin quick ops); sale-status line ("Đang mở bán / Tạm đóng bán") |
| **Booking wizard** | Stepper; seat selection with **2D ↔ 3D-isometric toggle** (persisted), coach/class/type header, per-seat price, legend (Còn trống / Đang chọn / Đã bán); **multi-passenger cards** (Họ và tên, CCCD/Hộ chiếu/Ngày sinh, passenger type with discount labels); **contact** (email nhận vé, SĐT — ⚠️ not sent to server today); **hold countdown** banner (urgent <2 min); **price breakdown sidebar** (per-seat lines, "Tổng ưu đãi", total incl. VAT); trust badges (VNPay bảo mật / TLS 1.3 / Hỗ trợ 24/7); refund-policy card; CTA "Thanh toán {amount}" → VNPay redirect; login gate (`/login?next=…`) |
| **Payment** | VNPay redirect (paymentUrl), success page (txnRef, amount, "Xem vé điện tử" / "Về trang chủ"), failed page, payment detail page (re-create VNPay session when not Paid/Cancelled), countdown timer (Còn lại mm:ss / Đơn hàng đã hết hạn thanh toán) |
| **Orders** | `/orders` table; `/profile/orders` card list + **CSV export**; detail (shared for public/profile/admin): route line, passengers, SeatCloud, payments, e-ticket + QR ("Quét tại cổng ga", In vé / Lưu PDF, Sao chép mã), VNPay re-pay (status 0/1), **Huỷ đơn** (⚠️ unconditional, no dialog) |
| **Issued tickets** | `/profile/tickets` — wallet of TicketIssued orders: TicketNotch cards with ticket code (⚠️ raw `qrPayload` text dumped) |
| **Notifications** | `/profile/notifications` — read-only email delivery log (Đã gửi / Thất bại), no preferences |
| **Account & auth** | Register (username/email/password → redirects to login), login (email/password, `?next=`), forgot/reset password (⚠️ dev UI shows raw token), email verification (+ resend), Google OAuth callback (⚠️ no login button; backend stubbed), profile edit, change password, revoke all sessions |
| **Route map** | `/route-map` — ⚠️ dev artifact (internal link sitemap), not a geographic map |

### 3.2 Admin (embedded portal)
| Area | Features found in code |
|---|---|
| **Dashboard** | KPI cards (tổng doanh thu, chuyến đang mở bán, đơn hàng, người dùng) + textual status breakdowns; tabs for tickets/orders/payments/users/system |
| **Tickets** | Create journey + first fare class (CSV seat labels, price gốc/ưu đãi, dates; sample SE1 pre-fill); row menu (Công khai vé / Ẩn vé / Mở bán / Đóng bán); detail → Vận hành (Công bố, Chuẩn bị chỗ, Mở/Đóng bán, Xoá vé), Chỉnh sửa, Thêm hạng, Sơ đồ ghế with quick **Giữ chỗ / Hoàn chỗ**; item detail (Giá gốc / Giá ưu đãi, sale window `datetime-local`, manual giữ/hoàn ghế, danger-zone delete) |
| **Orders** | Table with status filters → mark paid / confirm / issue ticket / refund / cancel / expire / remove; detail adds raw CSV seat-label + passenger overwrite (⚠️ this panel is visible to non-admins on `/orders/[id]`!) |
| **Payments** | Table → Đang xử lý / Xác nhận thành công / Đánh dấu thất bại / Huỷ giao dịch; detail status buttons; `ManualPaymentForm` (Chuyển khoản / Tiền mặt / Thẻ / Khác) is **dead code** |
| **Users** | Table + create-user form; ⚠️ **no role-granting UI** despite page copy promising it |
| **Notifications** | Read-only email log with type filter; no compose |
| **System** | Health pings to 6 microservices every 30 s (UP/DOWN), "Kiểm tra ngay" |

⚠️ **No confirmation dialogs anywhere** — destructive actions (Xoá vé, Xoá đơn, Xoá hạng ghế, Huỷ đơn, Hoàn tiền) fire immediately.

### 3.3 Cross-cutting
Cookie auth + refresh dedupe; TanStack Query caching; Zustand booking session (sessionStorage); dark/light theme toggle; i18n dictionary (unwired); a11y (skip link, announcer, `aria-busy`/`aria-live` loading, keyboard seat map, reduced motion); motion system (AnimatedSection, CountUp, iso hero, seat-map stagger; `PageTransition` unused); status badge system (English labels); skeletons / empty states (search-empty, train-empty, order-empty, payment-empty, error-state) / NoticeBox / sonner toasts; pagination; dialogs/sheets/dropdowns (radix).

---

## 4. User roles and jobs-to-be-done

| Role | Jobs-to-be-done |
|---|---|
| **Guest traveler** | "Quickly check if a train runs on my route/date and what it costs" → search & compare without account. "See where I'd sit and what I'd pay before committing." |
| **Registered traveler** | "Book seats for my family in one order" (multi-passenger, discounts). "Pay safely with VNPay." "Get a ticket I can show at the station" (QR + email). "Recover when payment fails or the hold expires." "Keep track of bookings; cancel if plans change." |
| **Admin / operator** | "Publish a journey and its coaches with correct stock." "Control sales: open/close, flash prices, sale windows." "Fix booking issues manually" (hold/release). "Move an order through its lifecycle" (mark paid, confirm, issue, refund, cancel). "Monitor payments, users, notifications, system health." |
| *(Future)* **Station staff / conductor** | Validate the QR at boarding (qrPayload exists; design should not preclude it). |

---

## 5. Main user journeys

### J1 — Search & compare trips
1. Home or Search: ga đi, ga đến, ngày đi (swap supported; date stepper).
2. Sort (recommended/price/departure), filter by time of day + seat class.
3. Scan cards: train number, times, duration, availability urgency, "Giá từ".
4. Choose trip → ticket detail → Hành trình → pick fare class (price, "Còn N chỗ").

**Design-critical:** timetable readability, price transparency ("Giá từ"), availability signaling, scan speed, station-picker error prevention.

### J2 — Book: seats → passengers → pay → e-ticket
1. Đặt chỗ tab: fare-class summary card + stepper.
2. Select seats on 2D (default) or isometric map; local hold countdown starts.
3. Per-seat passenger card: name, CCCD/passport/DOB, passenger type (discount preview updates live in sidebar).
4. Contact email + phone (delivery address — **must be persisted server-side for the email promise**).
5. Price breakdown + VAT note + discount total; CTA shows payable amount.
6. Login gate (guest) → checkout (idempotency) → VNPay redirect → return page (txnRef, amount).
7. Order detail: async issuance state (Paid → Confirmed → TicketIssued) + QR e-ticket + email.

**Design-critical:** seat-map clarity, hold urgency honesty, price transparency, trust at payment, async-state honesty ("đang phát hành vé…"), recovery on 409/429/503/failure/expiry.

### J3 — Manage orders & recover
- List → detail: countdown while pending; re-pay; cancel.
- TTL-expired order shows as **Cancelled** — the UI must say "hết hạn thanh toán", not generic "đã huỷ".
- Failed/expired payment → clear next action (re-pay / re-book; seats released).

### J4 — Admin: publish inventory
1. Create ticket (journey + first item; CSV seat labels; price gốc/flash).
2. Vận hành: prepare stock → set sale window → open sale; verify on seat map; add fare classes.

### J5 — Admin: operate order lifecycle
Detail → actions: mark paid → confirm → issue ticket → refund/cancel/expire/remove; edit passengers/seats; monitor payments & system health. **All destructive actions need confirmation + audit context.**

### J6 — Account lifecycle
Register → verify email → login → (forgot/reset) → profile → notifications log.

---

## 6. UX risks and opportunities

### Trust & clarity
- ✅ Good: security badges, "Đã gồm VAT", refund-policy card, status badges, home trust pills.
- ⚠️ **Contradictory policy copy:** home says "Hoàn vé trong 24h" while the booking card says refund fees 10–20%; the UI advertises free 24 h changes and refunds it **cannot perform** (no change/refund endpoints). Must be reconciled with the business before design finalization.
- ⚠️ **English status labels** ("Ticket Issued", "Pending Payment", "Published") in a Vietnamese UI; `vi.ts` dictionary unwired → copy drift risk.
- ⚠️ **"Cập nhật theo thời gian thực"** on search results is static text; availability is cached 15 s and never auto-refreshed.
- 💡 Opportunity: one **status language** (icon + color + Vietnamese label + "what happens next") across order/payment/ticket; honest async states; explicit "đã hết hạn thanh toán" semantics for TTL-cancelled orders.

### Timetable readability
- ✅ Good: mono + tabular numerals, time-first cards, duration + route line, dates under times.
- 💡 Opportunity: explicit next-day (+1) arrival indicators for overnight trips; consistent "duration" definition; column-header sort affordances in desktop lists.

### Seat map clarity (the product's signature interaction)
- ✅ Good: 2D + isometric toggle (persisted), legend, aisle + "Đầu tàu" direction, keyboard + aria, per-seat price, occupancy states, GSAP stagger with reduced-motion support.
- ⚠️ Isometric view can slow scanning on long coaches / small screens; hit polygons are invisible targets; **no multi-coach switching in booking** (`CarriageNavigator` unused); female/accessible/premium seats advertised but never rendered; `maxSeats` not enforced.
- 💡 Opportunity: "auto-assign N seats"; family/group adjacency; accessible + female-only seats once the model supports them; **auto-refresh occupied seats** (15 s) while preserving the user's selection; mobile seat-selection summary strip instead of a sidebar.

### Speed & mobile
- ✅ Good: deferred queries, skeletons, sticky filter card, mobile bottom nav, large targets in the wizard.
- ⚠️ Search filtering/sorting runs **client-side over the fetched page only** (12 items) — pagination totals and "Giá thấp trước" don't span all results.
- ⚠️ Wide admin/order tables and the 2D seat grid overflow horizontally; a mobile filter drawer state exists (`mobileFilterDrawerOpen`) but is unimplemented.
- 💡 Opportunity: prefetch ticket detail; sticky "Thanh toán {amount}" bar on mobile; server-side filter/sort or honest client-side labeling.

### Error recovery & real-time
- ✅ Strong backend: idempotency, outbox, saga, TTL, DLQ, refresh dedupe, row-lock seat reservation.
- ⚠️ UX gaps: 409 "seats being held by another user" and 503 "high load" need friendly, actionable UI (choose other seats / retry); payment-success-but-ticket-pending window lacks an explicit "Đang phát hành vé…" state; client hold timer vs server TTL can disagree; sessionStorage can resurrect stale holds after refresh.
- ⚠️ **Late-payment hazard:** `payment.paid` arriving after order expiry leaves payment Paid on a closed order — no reconciliation UI today.
- 💡 Opportunity: order state timeline ("Thanh toán nhận được → Xác nhận → Phát hành vé → Email đã gửi"); "last updated" availability stamp; non-destructive seat-map refresh.

### Admin safety & density
- ⚠️ **Un-gated operational panel:** the "Điều chỉnh đơn" seat-labels/passenger-overwrite panel on `/orders/[id]` renders for all users — a customer can rewrite an order's passengers/seats. Security fix required, not just design.
- ⚠️ No confirmation dialogs for destructive lifecycle actions; no audit trail UI; refund is a status flip (no money movement, no email) — ops must be told this or they will mislead customers.
- ⚠️ Admin reuses the airy editorial components — needs a **dense, scan-optimized variant** (tables, filters, bulk actions).

### Low bandwidth / offline / privacy
- ⚠️ QR images load from **third-party CDN** (`api.qrserver.com`) — fails offline at the gate, external dependency, privacy question; generate locally.
- ⚠️ No offline/PWA strategy; fonts self-hosted via `next/font` (good).

---

## 7. Accessibility and localization requirements

### Accessibility
- Target: **WCAG 2.1 AA** (proposed — confirm in §2.2).
- Existing strengths to keep: skip-to-content link, `:focus-visible` ring, `lang="vi"`, `prefers-reduced-motion` (global + iso + seat map), aria labels on seats (`Ghế A1 (đã bán/đang chọn)`), `role="progressbar"`, `aria-busy`/`aria-live` loading, `A11yAnnouncer`, sonner toasts, keyboard seat map (Enter/Space), `aria-invalid` on forms (add `aria-describedby` for messages).
- Required: status = color + icon + text (never color alone); contrast audit (teal `#0D7377` on white for small text, `--seat-occupied-text #94a3b8`, amber on dark, `--ink-subtle`); touch targets ≥44px on mobile; focus management in dialogs/dropdowns (radix handles); reduced-motion variants for all GSAP entrances (exists via `useReducedMotion`); seat map must offer a non-visual path (selected-seat text list + "auto-assign").
- Isometric seat hit polygons must have visible affordance (hover ring) and a 2D default for clarity.

### Localization
- **Vietnamese first**, full diacritics (all fonts include `vietnamese` subsets — excellent).
- **Wire the i18n layer:** `lib/i18n/vi.ts` exists but is unused; hardcoded Vietnamese in components + English status labels = the top language inconsistency.
- Status labels in Vietnamese: Đơn (Chờ thanh toán, Đã thanh toán, Đã xác nhận, Đã phát hành vé, Đã huỷ, Hết hạn, Đã hoàn tiền); Thanh toán (Chờ thanh toán, Đang xử lý, Thành công, Thất bại, Đã huỷ, Hết hạn); Vé (Nháp, Đang mở bán).
- Numbers/dates/currency: `vi-VN` (VND, `dd/MM/yyyy`, 24 h `HH:mm`), tabular numerals everywhere data appears.
- RTL: N/A. Future English support should not be blocked by copy bound to Vietnamese sentence structure in components.

---

## 8. Design requirements derived from features

Design-agnostic requirements any chosen direction must satisfy.

### R1 — Timetable & journey data language
- Mono + tabular numerals for times, durations, train numbers, prices, seat codes, IDs.
- Time-first hierarchy on every trip card; station names secondary; dates tertiary.
- Overnight / next-day arrival unmistakable (+1 day indicator).
- Duration + route line always visible; sort affordances mirrored in desktop list headers.
- Station identity: code chip + full name, consistent everywhere.

### R2 — Seat map clarity
- Four base states distinguishable by **color + shape/texture + text**: available, selected, taken, disabled; special classes (accessible, female-only, premium) reserved for future data.
- Legend always present; direction (Đầu tàu) and aisle marked.
- Per-seat price on selection; selection count vs. limit shown.
- Works at 320 px (scroll or compact); **2D default as clarity baseline**, isometric as optional immersive toggle.
- Keyboard accessible (arrow-grid or selectable list); `aria-pressed`/`aria-label` (present).
- Non-visual path: selected seats as text chips + "auto-assign N seats".
- Multi-coach switching must be reachable during booking (currently missing).

### R3 — Price transparency
- Every amount traceable: base × quantity per passenger, discount line(s), total incl. VAT ("Đã gồm VAT và các khoản phí").
- "Giá từ" defined as cheapest display price for that journey/date; clicking through must not surprise.
- Flash price presentation with original struck through; sale-window dates shown for limited offers.
- Client preview must agree with the server-computed total (server is authoritative).

### R4 — Hold, urgency & time pressure
- Countdown prominent, tabular, color-shift (normal → urgent <2 min → expired).
- On expiry: clear explanation + seats released + one-tap re-book; "Cancelled + unpaid" copy must read as "hết hạn thanh toán".
- Explain inline: "what happens if I don't pay in time?"
- Reconcile client hold timer with server TTL (start at a well-defined moment; survive navigation — sessionStorage persistence exists).

### R5 — Payment trust & async honesty
- Payment CTA always shows the exact payable amount.
- Trust markers at the payment moment (VNPay, TLS, support) — restrained.
- After VNPay return: txnRef + amount; **if ticket not yet issued, show an explicit "Đang phát hành vé điện tử…" state** with the order timeline; email is the confirmation of record.
- Failed/expired payment → actionable recovery (re-pay / re-book), never a dead end.
- Friendly mapping for 409 (seats held — choose others), 429, 503 (busy — retry).
- Redirect out/back restores context (order id, amount).

### R6 — Status system (single source of truth)
- One badge component for every domain status → Vietnamese label + icon + tone (see §7 list).
- Never color alone.
- Each state optionally carries "what happens next" microcopy in detail views; state timelines for orders.

### R7 — Booking wizard structure
- Stepper (Tìm chuyến → Chọn ghế → Thông tin → Thanh toán) with progress, back-nav, state persistence.
- Multi-passenger: per-seat cards, live per-passenger price updates, "apply same passenger type" convenience.
- Contact capture framed as "where your ticket goes"; **must be sent to the server**.
- Mobile: sticky summary bar with running total + primary CTA; sidebar collapses.

### R8 — Admin density & safety
- Dense tables, sortable columns, filters, pagination, bulk-ready.
- Lifecycle actions in menus with **confirmation dialogs** and explicit consequences (refund/cancel/expire especially).
- Seat-label editing validated (CSV format, uniqueness, stock consistency).
- Read-only audit context (who/when) for destructive ops.
- **Fix the un-gated "Điều chỉnh đơn" panel** (admin-only).

### R9 — System states
- Loading: skeletons matching final layout geometry.
- Empty: illustrated, action-oriented (existing illustrations).
- Error: human Vietnamese + retry; never raw codes.
- Offline/low-bandwidth: all assets local (**QR must stop using the CDN**); progressive enhancement for the wizard.

### R10 — Brand & visual consistency
- Shared tokens across public, wizard, admin, auth: color, type scale, radius, elevation, motion (150/250/400/600 ms), lucide icons, 4 px spacing grid.
- Dark-mode parity on every surface incl. seat map + status badges (tokens exist).
- Motion: entrance < 600 ms; no motion on critical data readouts; reduced-motion respected.

---

## 9. Three visual style direction proposals

> Presented for approval — **none implemented yet.** Each direction is a complete lens on the same product. They are deliberately different; §10 argues for the strongest fit.

---

### Direction A — "Modern Classic" (evolve the current Premium Editorial system)

**One-sentence concept:** A refined continuation of the current Vietrail editorial system — warm, premium, border-first, serif display — hardened into a consistent rail-booking product.

**Why it fits:** The system already exists and is coherent (teal/amber on warm paper, Fraunces display, ticket-notch motifs, isometric hero). It differentiates Vietrail from generic booking UIs and carries a "premium travel" trust signal. Continuity preserves the a11y, motion, and dark-mode work already shipped.

**Mood keywords:** refined · editorial · warm · premium · heritage · calm

**Color strategy:** Keep deep teal `#0D7377` + warm amber `#B8632A` on warm off-white `#FAFBFB`; ink `#1A2332`. Tighten contrast where AA fails; keep semantic scales; dark mode as-is (already well-tuned).

**Typography strategy:** Fraunces for marketing/hero + section titles only; Space Grotesk for UI; IBM Plex Mono for all data. Rule: **no serif inside data tables, seat maps, or the wizard's working area** — the main hardening change.

**Layout & density:** Generous whitespace on marketing surfaces; introduce a "data-dense variant" token set (row height, table padding) for admin and search lists; keep the 1240 px container.

**Shape / radius / elevation:** Small radius (0.375–1rem), border-first, extremely subtle shadows — enforce consistently (radius styles currently drift).

**Iconography & illustration:** lucide line icons (existing); keep the isometric hero + empty-state illustrations on non-task surfaces; ticket-notch motif retained as the brand signature.

**Motion style:** Existing GSAP system (staggered sections, count-up, iso float) with reduced-motion support; entrances ≤400 ms; micro-interactions for seat selection and hold-timer urgency.

**Suitability:**
- Timetable: strong (mono + tabular already); serif display on card titles adds warmth at slight scan cost — acceptable if data stays mono.
- Seat map: strong (isometric is the signature; 2D toggle exists).
- Payment: good — editorial confidence helps trust; keep the sidebar breakdown.

**Accessibility implications:** Warm off-white reduces glare; Fraunces at display sizes is legible; must fix small-contrast text (ink-subtle, occupied-seat text) and English status labels. Serif headlines can slow speed-readers — keep serif out of data.

**Possible drawbacks:** Risk of reading "lifestyle" rather than "operational"; airiness fights admin density; more effort to keep editorial consistency as surfaces grow; isometric seat map remains polarizing for quick booking.

**How key screens would look:** Home — warm hero with isometric train + search card, count-up stat tiles; Search — editorial headline, bordered filter card, mono time cards on soft paper; Wizard — serif step headings, bordered seat-map card, mono prices in the sidebar; e-Ticket — ticket-notch card with QR and a stamp-like status badge.

---

### Direction B — "Transit Precision" (functional rail standard)

**One-sentence concept:** A strict, high-contrast, data-first design in the spirit of Germany's/Japan's railway systems — ink and one signal teal, dense tabular grids, minimal decoration — where every pixel serves scan speed and operational clarity.

**Why it fits:** Railway booking is a **utility under time pressure**: timetable readability, seat-map clarity, price transparency, and admin density are the stated UX-critical requirements. This direction optimizes exactly those: timetable as a first-class grid, seat map 2D-default, admin portal purpose-built.

**Mood keywords:** precise · operational · trustworthy · calm · high-contrast · unadorned

**Color strategy:** Near-neutral ink `#111827`-family on white/`#F8FAFC`; **one signal color** (keep Vietrail teal as the single brand/action color); semantic green/amber/red reserved strictly for states; amber accent retired to "sale/flash" only; dark mode as a true night-operations theme.

**Typography strategy:** Sans-first throughout (Space Grotesk or Inter); **no serif** — the editorial voice moves into microcopy and tone; IBM Plex Mono for every datum; strict type scale (11/12/13/14/16/20/28) with tabular numerals everywhere.

**Layout & density:** Grid-true layouts; 8 px grid; search results as **rows in a data table** on desktop (train, from, to, duration, class, availability, from-price, CTA) and swipeable rows on mobile; wizard as a true 4-step stepper with a persistent order-summary rail; admin tables at 48 px rows with sort/filter affordances.

**Shape / radius / elevation:** Minimal radius (2–6 px), hairline borders, elevation only for overlays; no decorative shadows; strong focus rings.

**Iconography & illustration:** lucide outline icons only (1.5 px stroke), strictly semantic; no isometric hero; illustrations replaced by a **schematic route diagram** (station dots + line) that doubles as a functional element; ticket motif becomes a clean stubbed-ticket rectangle.

**Motion style:** Nearly motionless: 150 ms micro-transitions for selection/hover/urgency; no entrance choreography except fade-in on route change; restrained pulse for urgent states (exists today for "Sắp hết" and countdown).

**Suitability:**
- Timetable: **excellent** — this is its native form.
- Seat map: excellent — 2D grid default, iso demoted to a curiosity; crisp per-seat price and states.
- Payment: excellent — precise breakdown table, unmistakable CTA, calm security framing.

**Accessibility implications:** Highest natural contrast; color never sole carrier (icon+text); dense rows must still meet 44 px touch targets on mobile; reduced-motion trivially satisfied.

**Possible drawbacks:** Can feel austere / less branded; loses the premium "Vietrail" differentiation and the isometric identity; risks looking like every other booking utility if the teal + typography aren't pushed hard; larger design-system rewrite of current surfaces.

**How key screens would look:** Search — compact filter bar, results as an aligned timetable grid; Wizard — 4-step header, square 2D seat grid with mono seat labels, right rail with a precise cost table; e-Ticket — clean barcode-style ticket with QR, train/seat/date in mono, a "valid at" stamp; Admin — dense tables with sticky headers and inline status filters.

---

### Direction C — "Vietnam Journey" (warm cultural storytelling)

**One-sentence concept:** A contemporary, human, locally-rooted design that tells the story of the North–Central–South rail corridor — warm terracotta/rice-green palette, rounded friendly shapes, and a journey narrative — to earn trust and warmth in the Vietnamese market.

**Why it fits:** Booking a train in Vietnam is emotional and social (families, holidays, "về quê"). A design that feels local, warm, and modern speaks to travelers who distrust legacy rail sites and appreciate a human, friendly product. It gives Vietrail a distinct brand in a market of utilitarian booking UIs.

**Mood keywords:** warm · human · journey · local · friendly · vibrant

**Color strategy:** Warm rice/cream background; **terracotta `#C0563B`-family + deep green `#2F6B4F`** as the travel pair (hills/fields of the corridor), teal demoted to support; amber for offers; high-contrast ink; dark mode in deep forest tones.

**Typography strategy:** Fraunces (or a Vietnamese-friendly display serif) for headlines; a humanist sans (e.g., Be Vietnam Pro — designed for Vietnamese diacritics) for UI; mono for data where needed — still tabular.

**Layout & density:** Generous, breathing layouts; friendly card rounding; journey as a **vertical route timeline** (station by station with landmarks); wizard wrapped in a warm guided frame; admin gets a calmer, still-dense variant.

**Shape / radius / elevation:** Medium-large radius (12–20 px), soft shadows, playful accents (train-patterned borders, station stamps).

**Iconography & illustration:** Custom line + flat illustration set (trains, stations, landscapes); the isometric seat map can stay, restyled warmer; empty states become storytelling illustrations.

**Motion style:** Gentle, expressive: section reveals, soft seat "settling", route progress animation; ≤600 ms and reduced-motion compliant.

**Suitability:**
- Timetable: good if typography discipline is kept (tabular times, clear hierarchy) — the biggest risk area for this direction.
- Seat map: good — warm states, friendly labels; still needs a 2D clarity default.
- Payment: good — trust through warmth and human reassurance copy.

**Accessibility implications:** Terracotta/amber have inherent contrast risk — verify AA on all text pairings; decorative illustrations must not carry information; keep status icon+text.

**Possible drawbacks:** Higher illustration/motion maintenance cost; visual noise risk in the wizard and admin; "warm" can read as less trustworthy at financial moments; display serif with full Vietnamese diacritics must be validated.

**How key screens would look:** Home — illustrated hero of a train crossing Vietnam, warm search card; Search — friendly result cards with station-to-station timeline motifs; Wizard — warm guide header ("Chuyến đi của bạn"), soft seat map, humanized helper copy; e-Ticket — illustrated ticket with station stamps and a warm "Chúc bạn thượng lộ bình an" note.

---

## 10. Recommendation

**Recommended direction: Direction B — "Transit Precision" as the foundation, with Direction A's premium elements layered on only the marketing surfaces (home hero, featured trip, e-ticket presentation) using the existing teal/amber identity.**

Rationale (ranked by the product's own UX-critical requirements):

1. **Timetable readability & seat-map clarity are the two make-or-break flows**, and both are density problems. Direction B is the only proposal that treats them as first-class data products rather than surfaces to decorate. The isometric seat map is charming, but the 2D grid must be the clarity baseline — B guarantees that.
2. **Trust & price transparency:** payment and refund moments benefit from a precise, neutral, high-contrast frame. B's "no surprises" language matches the backend's correctness story (idempotency, saga, verified IPN, server-computed totals).
3. **Admin density & safety:** B is the only direction that makes the admin portal feel purpose-built, with dense tables and safe, explicit destructive actions — an editorial or cultural skin would work against operators.
4. **Speed & low-bandwidth:** B is the lightest (no heavy illustration/isometric hero), fitting mobile-first usage and low-bandwidth contexts.
5. **Differentiation is still achievable:** B is not generic — it keeps the Vietrail teal, the mono data language, and the brand's ticket motif (restyled as a clean stub), and can inherit Direction A's warm paper and Fraunces headlines on the home/hero layer where no data is being scanned.
6. **Accessibility:** B is the most defensible against WCAG AA with the least effort (contrast, non-color status, reduced motion).

This yields a **two-layer system**: a strict "data layer" (search results, wizard, seat map, payment, admin) and a restrained "brand layer" (home, route-map, e-ticket moments) — mirroring how the codebase is already structured (patterns vs. marketing components).

**Verdict on the others:** Direction A is the safe, low-risk continuation and would ship fastest, but it leaves the density problems (admin, timetable scanning) unsolved. Direction C is the most differentiated and emotionally strong but carries the highest contrast, maintenance, and data-clarity risks for a utility-first product — the best **brand campaign** direction, not the best **booking product** direction.

---

## 11. Next steps (after approval)

1. Approve/adjust the direction (§9/§10) and answer the open questions in §2.2.
2. Decide which of the §6 gaps get fixed in the same workstream as the design (they gate UX quality regardless of direction): wire i18n + Vietnamese status labels; persist contact info; gate the "Điều chỉnh đơn" panel to admins; local QR generation; confirmation dialogs for destructive admin actions; honest expiry/async-payment states; server-side or honest client-side search filtering.
3. Produce the full design system: tokens (color/type/spacing/radius/elevation/motion), component specs for the core library (status badge, trip row/card, seat map 2D+iso, wizard stepper, price breakdown, e-ticket, admin data table), dark mode, and WCAG AA checklists.
4. Deliver a prioritized implementation plan mapped to existing components so the UI migrates incrementally, not via rewrite.

---

## Appendix A — Verified HTTP surface (api-gateway)

Guards: Throttler (global 100 req/min) → JWT → Roles. Auth = httpOnly cookies (`accessToken` 15 min, `refreshToken` 7 d) or Bearer. "auth" = any logged-in user; "ADMIN" = role 1.

| Group | Public | Auth (user) | ADMIN |
|---|---|---|---|
| **Auth** | login, register, refresh, logout, session, forgot/reset password, verify email, resend verification, google* (501), health | change password, revoke all sessions | — |
| **Users** | health | me (GET/PATCH) | list, by-email, get, create, update (incl. role), delete |
| **Search** | trips (`from,to,date,page,limit`), suggest-stations | — | — |
| **Tickets** | list, detail, availability, seat-map, item detail, item availability | — | create/update/delete ticket + items; reserve/release; publish/unpublish; prepare-stock; open/close sale; change-price; change-sale-window; reserve/release-seat |
| **Orders** | — | checkout, list (own), detail/summary (own), update passengers/seat-labels (own, while open), cancel (own), payments of order (own) | create, list, detail, mark-pending-payment/mark-paid/confirm/issue-ticket/expire/refund, delete |
| **Payments** | — | detail (own), by order (own), by user (own) | create, list, by transaction, mark-processing/mark-paid/mark-failed/cancel/expire, delete |
| **VNPay** | return (verify-only redirect), ipn (DB source of truth) | create payment URL | — |
| **Notifications** | — | my | list |
