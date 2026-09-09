# Direction B — Component Inventory & Migration Plan

> **Status:** Pre-design-system decision document (answers the 5 questions before the full design system is produced).
> **Decisions locked:** Direction B ("Transit Precision") is the foundation for booking, payment, ticket management, seat map, and admin surfaces. Limited Direction A elements are permitted on marketing/landing/hero sections **only** (home hero, featured trip, e-ticket presentation) provided they never reduce clarity or timetable readability.
> **Sources:** verified against `client/components/**`, `client/app/**`, `client/hooks/*`, `client/lib/**`, `api-gateway/src/order/order.dto.ts`, `client/next.config.ts`, `orders-service` logic (from the backend inventory in `docs/design/ux-requirements-and-visual-directions.md`).

---

## 0. Guiding principle

Two-layer system, mirroring the current codebase split (primitives vs. patterns vs. marketing):

- **Data layer** (search results, wizard, seat map, payment, e-ticket, admin) → strict Direction B: ink + teal, mono data language, hairline borders, minimal radius, no serif, no decorative motion.
- **Brand layer** (home hero, featured trip, route-map, empty states, e-ticket presentation moments) → limited Direction A elements: Fraunces display headlines, iso hero visual, ticket-notch motif, count-up stats — never inside data-dense or time-critical surfaces.

Everything below is **component-level**; the migration is incremental and the app stays runnable at every phase.

---

## 1. Which existing components are KEPT (as-is or re-token only)

Kept means: no structural/JSX redesign; they change only via CSS tokens or minor props. Rationale: these are direction-agnostic primitives or infrastructure.

| Component | Why kept | Notes |
|---|---|---|
| `components/ui/button.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `card.tsx`, `dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `tabs.tsx`, `tooltip.tsx`, `avatar.tsx`, `skeleton.tsx`, `sonner.tsx`, `pagination.tsx`, `pagination-bar.tsx`, `form-field.tsx`, `notice-box.tsx`, `empty-state.tsx`, `detail-block.tsx`, `meta-grid.tsx`, `section-heading.tsx`, `stat-card.tsx`, `inline-code.tsx`, `surface-link.tsx`, `panel.tsx` | Radix-backed primitives; Direction B restyle is achieved via tokens (radius, borders, type scale), not rewrites | `badge` and `table` are the exceptions — see §2 (status system + density) |
| `components/ui/railway-ui.tsx` | Deprecated re-export barrel; all 27 import sites work | Retire gradually at the end of migration (§4, Phase 6) |
| `components/a11y/a11y-announcer.tsx`, `components/a11y/loading-state.tsx` | A11y infrastructure; `aria-busy`/`aria-live` loading pattern | Keep verbatim |
| `components/shell/app-shell.tsx`, `public-shell.tsx`, `admin-shell.tsx`, `auth-shell.tsx`, `nav-config.ts`, `panel.tsx` | Shell structure is correct (pathname dispatch, public header+footer, admin sidebar, auth split) | Styling-only changes; `nav-config` labels are Vietnamese already |
| `components/branding/brand-logo.tsx` | Brand asset | Re-token only |
| `components/route/route-line.tsx` | Compact route indicator used in order detail | Re-token to schematic (dot + hairline) |
| `components/motion/use-reduced-motion.ts`, `lib/motion/*`, `lib/formatters/currency.ts`/`date.ts`/`id.ts`, `lib/validation.ts`, `lib/http.ts`, `lib/utils.ts`, `lib/stores/*`, `hooks/*` | Infrastructure (TanStack Query, Zustand, axios, zod, formatters) | `lib/formatters/status.ts` is the exception (§2); hooks may gain options (e.g. `refetchInterval`) but keep their API surface |
| `app/providers.tsx`, `app/layout.tsx`, `app/global-error.tsx`, `app/not-found.tsx` | App shell infra | Font loading: Fraunces becomes **marketing-only** usage; Space Grotesk + IBM Plex Mono stay global |

**Verified-unused / dead pieces (do NOT port into the new system; delete or leave as dead code flagged in Phase 6):** `components/charts/analytics-chart.tsx`, `components/payment/manual-payment-form.tsx`, `components/motion/page-transition.tsx`, `components/patterns/seat/seat-legend.tsx` "FULL" special-seat entries (until the data model supports them), `app/route-map/page.tsx` as a dev sitemap (needs a product decision — convert to a real schematic route map or remove).

---

## 2. Which existing components are MODIFIED

| Component | What changes | Direction-B / fix rationale |
|---|---|---|
| `components/ui/badge.tsx` + `lib/formatters/status.ts` | **Status system rework.** New Vietnamese status mapping (`lib/i18n/status.vi.ts`): label + tone + icon + "what happens next" for order (Chờ thanh toán / Đã thanh toán / Đã xác nhận / Đã phát hành vé / Đã huỷ / Hết hạn / Đã hoàn tiền), payment (Chờ thanh toán / Đang xử lý / Thành công / Thất bại / Đã huỷ / Hết hạn), ticket (Nháp / Đang mở bán). `StatusBadge` gets an icon slot; **reason-aware mapping**: `Cancelled` + cancelReason containing "expired" renders as "Hết hạn thanh toán" (distinct tone/icon). English labels removed. | HP-1, HP-6; R6 |
| `components/ui/table.tsx` | Add `density` prop ("comfortable" | "dense"), sticky header option, sortable-header affordance | R8 (admin density) |
| `components/ticket/qr-code.tsx` + `next.config.ts` | **Rewrite to local QR generation** (add `qrcode` dep; generate SVG client-side). Remove `api.qrserver.com` remotePattern. | R9 — offline at the gate, privacy, availability |
| `components/ticket/ticket-card.tsx` | Restyle to a clean stub: hairline border, mono data (times, seat, codes), no notch on data surfaces; `variant="premium"` reserved for e-ticket marketing presentation | B data layer; limited A on e-ticket moment only |
| `components/ticket/ticket-notch.tsx` | Marketing-only decor (home featured trip, e-ticket presentation); not used in search rows/wizard | Limited A |
| `components/patterns/trip/trip-card.tsx`, `trip-row.tsx` | **Row becomes the default** in search results (tabular columns: train · from → to · duration · class · availability · price · CTA); card variant retained for home featured trip only | R1, timetable readability |
| `components/patterns/search/search-form.tsx`, `filter-bar.tsx` | Compact B layout; **station typeahead** (combobox wired to `useStationSuggestions`) replaces plain `<select>` in hero/search; keep swap + date stepper | J1, R1 |
| `components/patterns/seat/seat-map-2d.tsx` | **Becomes the primary seat map**: square cells, crisp 4-state styling (color+texture+label), aisle + "Đầu tàu", per-seat price, selection count vs. limit, keyboard grid nav, auto-assign CTA hook, **availability auto-refresh + conflict props** (see §5 HP-5) | R2; HP-5 |
| `components/patterns/seat/seat-map.tsx` (isometric) | Optional "3D" toggle only (persisted), B palette, reduced GSAP; never the default | R2 clarity baseline |
| `components/patterns/seat/seat-legend.tsx` | Render exactly the states present in data; remove dead female/accessible/premium entries (or "coming soon" badge) until the model supports them | R2 honesty |
| `components/patterns/seat/carriage-navigator.tsx` | **Wire into the booking flow** (multi-coach switching on the seat step) — currently unused dead code | R2, multi-coach |
| `components/patterns/seat/seat-cloud.tsx` | Keep (order-detail seat chips), B restyle | R1 mono |
| `components/patterns/booking/booking-progress.tsx` | Restyle stepper; support true step navigation for the restructured wizard | R7 |
| `components/ticket/tabs/booking-tab.tsx` | **Restructure into 4 explicit steps** (Chọn chuyến → Chọn ghế → Thông tin → Thanh toán) driven by the stepper; **send contact info in the checkout payload** (fix); 409/503 handling UI; expiry handling; mobile sticky checkout bar | R7; HP-3, HP-5, HP-6 |
| `components/patterns/payment/price-breakdown.tsx` | Precise cost table (base × qty per passenger, discount lines, VAT note, total), mono tabular, `sidebar` + `compact` (mobile bar) variants | R3 |
| `components/route/route-map.tsx` | B schematic styling (station dots + line) for journey overview | R1 |
| `components/motion/countdown-timer.tsx` | B restyle (tabular, color-shift), **reason-aware expired copy** ("Đơn hết hạn thanh toán lúc … ghế đã hoàn lại") | R4, HP-6 |
| `components/motion/animated-section.tsx`, `count-up.tsx`, `components/iso/*` | Retained **only for the brand layer** (home hero, featured trip); excluded from data surfaces | Limited A |
| `components/illustrations/*` | Restyle to schematic/flat; keep for empty states on data pages (minimal, functional) | R9 |
| `components/admin/admin-ticket-manager.tsx`, `admin-order-manager.tsx`, `admin-payment-manager.tsx`, `admin-user-manager.tsx`, `admin-stats-overview.tsx`, `admin-system-health.tsx` | Density pass, **confirmation dialogs on every destructive action**, Vietnamese statuses, **role editor UI** (users), read-only audit context; stats → compact B cards | R8, HP-4 |
| `app/orders/[id]/page.tsx` | **Gate the "Điều chỉnh đơn" panel** (see §5 HP-4); add **order status timeline**; expiry clarity; contact display; Vietnamese statuses; cancel button only when order is mutable, with confirm dialog and reason picker | HP-2, HP-3, HP-4, HP-6, R5/R6 |
| `app/payments/vnpay/success/page.tsx`, `failed/page.tsx` | **Refresh order/payment state on mount** (currently trusts query params only); B restyle; async-issuance state ("Đang phát hành vé điện tử…") | R5 |
| `app/payments/[id]/page.tsx`, `app/search/page.tsx`, `app/tickets/*`, `app/profile/*`, auth pages | B restyle + i18n labels; search page: **server-side sort/filter or honest client-side labeling** (currently filters only the fetched page, and "Cập nhật theo thời gian thực" is static text) | R1, R9, HP-1 |
| `app/page.tsx` (home) | Keeps **limited A elements** (Fraunces headline, iso hero, count-up, notch featured card) but the search card + stat tiles stay B-crisp; clarity preserved | Approved direction |
| `lib/i18n/vi.ts` | Become the **wired** single source of truth (add runtime `t()`); migrate hardcoded strings incrementally, status labels first | HP-1 |

---

## 3. Which components are MISSING and must be CREATED

| New component / module | Purpose | Ref | Depends on |
|---|---|---|---|
| `lib/i18n/status.vi.ts` | Single source for Vietnamese status labels + tones + icons + next-step copy + reason-aware rules | HP-1, HP-2, HP-6, R6 | — |
| `components/status/status-badge.tsx` | Icon + color + text status badge (replaces `StatusBadge` usage app-wide); optional "what happens next" tooltip | HP-1, R6 | status.vi.ts |
| `components/status/order-timeline.tsx` | Order state timeline: Thanh toán nhận được → Xác nhận → Phát hành vé → Email; shows where the order is and what's next | HP-6, R5, R6 | status.vi.ts |
| `components/status/expiry-reason-banner.tsx` | Explains a TTL-cancelled order: "Đơn hết hạn thanh toán lúc … — ghế đã được hoàn lại. Đặt lại ngay." | HP-6, R4 | status.vi.ts |
| `components/patterns/seat/seat-auto-assign.tsx` | "Tự động chọn N ghế" — pick contiguous/adjacent seats; the non-visual booking path | R2, R7 | seat-map-2d |
| `components/patterns/seat/seat-conflict-dialog.tsx` | On 409 (seats held by another user): lists which seats were lost, offers re-select / auto-assign / different coach; never wipes the user's other selections | HP-5, R5 | seat-map-2d |
| `components/patterns/seat/availability-stamp.tsx` | "Cập nhật lúc HH:MM" + live refresh indicator on the seat map | HP-5, R9 | — |
| `hooks/use-seat-map-refresh.ts` | Polls seat-map/availability (15–20 s) while on the seat step; non-destructive merge preserving user selections | HP-5 | ticket.hook |
| `components/patterns/booking/step-layout.tsx` | True 4-step wizard shell (progress, back/next, validation gates, state persistence) wrapping the existing booking form | R7 | booking-progress |
| `components/patterns/booking/mobile-checkout-bar.tsx` | Sticky bottom bar on mobile: selected-seat summary + running total + "Thanh toán {amount}" CTA | R3, R7 | price-breakdown |
| `components/patterns/order/contact-summary.tsx` | Displays persisted contact email/phone on order detail (visible only after HP-3 backend work) | HP-3 | order types |
| `components/ui/combobox.tsx` | Station typeahead (searchable select) wired to `/search/suggest-stations` | J1, R1 | radix |
| `components/ui/confirm-dialog.tsx` | Wrapper for destructive confirmations (radix AlertDialog) with consequence copy | R8, HP-4 | radix |
| `components/ui/data-table.tsx` (or dense `table` extension) | Dense, sortable, filterable admin table with sticky header | R8 | table |
| `components/admin/admin-role-editor.tsx` | Role editing on the admin users page (backend `PATCH /users/:userId` already supports role) | HP-4 | admin-user-manager |
| `lib/qr.ts` | Local QR generation (SVG) — replaces the CDN | R9 | `qrcode` dep |
| `lib/api-types/order.ts` + `hooks/order.hook.ts` additions | `contactEmail` / `contactPhone` on `CheckoutOrderRequest` payload + `OrderResponse`; sent from booking-tab | HP-3 | backend DTO (§5) |
| `components/route/route-schematic.tsx` *(optional)* | Real geographic route overview if `/route-map` is converted instead of removed | R1 | — |

**Backend contract changes these need (design-system workstream must coordinate):** contact fields on `CheckoutOrderRequest` and `Order` (see §5 HP-3); optional server-side sort param for `/search/trips` (HP/§5 search honesty); `refund` enhancement to also flip the payment + notify (HP-2).

---

## 4. Migration plan (current system → Direction B)

Principles: **app stays runnable at every phase**; CSS-token-first (most surfaces restyle without JSX changes); components migrate surface-by-surface; each phase ends with lint + typecheck + build + a smoke journey.

| Phase | Scope | Key work | Verify |
|---|---|---|---|
| **P0 — Correctness & security fixes** (gate everything; mostly direction-independent) | HP-1…HP-6 from §5 + local QR + confirm dialogs + gating | Contact persistence (backend+client), permission gating, status i18n, seat conflict handling, expiry clarity, QR local | J2–J6 smoke; security review of gating |
| **P1 — Token foundation** | `app/globals.css` | Introduce B token namespaces (`--data-*` ink/teal/status, radius 2–6px, hairline borders, elevation for overlays only, motion 150ms base) alongside retained A tokens (`--brand-*` for marketing); type scale (11–28) with tabular numerals; dark-mode parity | Every route renders; no broken tokens |
| **P2 — Status system + i18n** | status.vi.ts, status-badge, formatters, vi.ts wiring | Replace all English status labels; StatusBadge app-wide; statuses on orders/payments/tickets/admin | No English status strings remain |
| **P3 — Data layer** | search, trip rows, seat map 2D (+iso toggle), wizard restructure, price breakdown, countdown, order timeline, e-ticket stub, contact summary, availability refresh + conflict dialog, auto-assign | R1–R7 components land here; seat map 2D default; multi-coach switching wired | J1, J2, J3 flows; mobile pass |
| **P4 — Admin surfaces** | admin managers, data-table dense, confirm-dialog, role editor, system health | Density, confirmations, role UI, audit context | Admin J4–J5 flows; permission tests |
| **P5 — Brand layer (limited A)** | home, featured trip, illustrations, iso hero, e-ticket presentation | Apply retained A elements; confirm no clarity/timetable regression | Home + e-ticket visual QA |
| **P6 — Hardening & cleanup** | a11y audit (WCAG AA), reduced motion, dark mode, perf (bundle/images), dead-code removal (`analytics-chart`, `manual-payment-form`, `page-transition`, unused `seat-legend` entries), retire `railway-ui.tsx` barrel, `/route-map` decision | Contrast fixes, touch targets ≥44px, focus management, bundle check | Full a11y pass; lint/build/typecheck green; J1–J6 smoke |

**Rollback safety:** each phase is a separate commit; token-first design means P1 is reversible in one revert; no database migration beyond P0's contact columns (additive).

---

## 5. UX/security issues to fix BEFORE or DURING migration (incl. the 6 high-priority items)

### HP-1 — Vietnamese status labels
- **Where:** `client/lib/formatters/status.ts` (English today), `components/ui/railway-ui.tsx` (StatusBadge), every order/payment/ticket list & detail page, admin managers; `lib/i18n/vi.ts` unwired.
- **Fix:** create `lib/i18n/status.vi.ts` + `components/status/status-badge.tsx`; replace all `formatOrderStatus`/`formatPaymentStatus`/`formatTicketStatus` usages; wire `vi.ts` `t()`; migrate hardcoded copy incrementally (statuses first).
- **Acceptance:** zero English status strings; labels match §2 list; dark mode parity.

### HP-2 — Refund / change status consistency
- **Facts:** UI advertises "Đổi vé miễn phí trước 24h" and "Hoàn trả vé thu phí 10–20%" (`booking-tab.tsx`), but **no change/refund endpoints exist**; refund is an admin status flip only (no VNPay refund, no seat release, no email); home says "Hoàn vé trong 24h".
- **Fix (design-system workstream):** reconcile copy with capability — either (a) ship real change/refund endpoints (backend work, out of design scope but flagged) or (b) reword copy honestly and add a "Liên hệ hỗ trợ" path; admin refund action gets a **confirm dialog stating the exact effect** ("chỉ cập nhật trạng thái đơn — không tự động hoàn tiền/chưa giải phóng ghế"); recommended backend enhancement: refund → mark payment `Refunded` + `notification.refunded` + release seats; refunded/cancelled orders show consistent Vietnamese status + timeline entry.
- **Acceptance:** no UI claim the product cannot perform; admin knows what refund does; refunded orders display correct payment status.

### HP-3 — Contact info persistence
- **Facts:** `booking-tab.tsx` collects "Thông tin nhận vé điện tử" (email + phone) into the store, **but the checkout payload has no contact fields** (`CreateOrderPayload` in `hooks/order.hook.ts`; `CheckoutOrderRequest` in `api-gateway/src/order/order.dto.ts` has no contact fields) — the e-ticket email promise cannot be delivered.
- **Fix:** add `contactEmail` / `contactPhone` (optional, validated) to `CheckoutOrderRequest` and `Order` (orders-service Prisma schema + additive migration, `order.service.ts` checkout persistence); client sends `contactInfo`; order detail displays via `components/patterns/order/contact-summary.tsx`; notification service uses stored contact (fallback: account email).
- **Acceptance:** contact saved at checkout, returned in `OrderResponse`, visible on order detail, used by `order_created`/`payment_paid` emails.

### HP-4 — Admin permission gating
- **Facts:** the "Điều chỉnh đơn" panel (`app/orders/[id]/page.tsx` lines ~453–522) renders for **any viewer** — a customer can overwrite their order's whole passenger list (single ADULT) and seat labels; admin users page has **no role editor** despite copy promising it; no confirm dialogs on destructive actions anywhere.
- **Fix:** (1) gate the adjust panel: **admin** → full edit with confirm dialogs; **owner** → self-service edits only while the order is mutable (status ∈ {Draft, PendingPayment, Paid, Confirmed}) with a normal form UI (not raw CSV), hidden/read-only after issuance/cancel/expire/refund — backend already rejects closed orders (`ensureMutable` 409), so this closes the UI-side hole; (2) add `admin-role-editor.tsx` (backend `PATCH /users/:userId` role already exists); (3) `confirm-dialog.tsx` on every destructive admin action (Xoá vé, Xoá đơn, Hoàn tiền, Huỷ đơn, Xoá hạng ghế).
- **Acceptance:** non-admins never see raw CSV passenger/seat editors post-issuance; destructive actions always confirm; roles editable by admins.

### HP-5 — Seat-held / availability conflict handling
- **Facts:** availability/seat-map responses are cached **15 s**; a seat can look free but be taken at checkout (409 "One or more selected seats are currently being held by another user…"); the seat map never refreshes; there is no auto-assign.
- **Fix:** `hooks/use-seat-map-refresh.ts` (poll 15–20 s while on the seat step) with **non-destructive merge** (never clears the user's selection); `seat-conflict-dialog.tsx` on 409 listing lost seats with re-select / auto-assign / different-coach actions; `availability-stamp.tsx` ("Cập nhật lúc HH:MM"); friendly copy for 429/503 ("hệ thống đang quá tải — thử lại") preserving selections; auto-assign CTA.
- **Acceptance:** a taken-at-checkout seat never silently removes other selections; user always has a clear next action; availability freshness is visible.

### HP-6 — Order TTL / cancelled status clarity
- **Facts:** TTL expiry (10 min) sets the order to **Cancelled(5)** with reason "Unpaid order expired…" — *not* `Expired(6)` (admin-only); the UI shows a generic "Cancelled"; the client hold countdown starts at seat selection while the server TTL runs from order creation; user cancel button is unconditional with hardcoded English reason `"Cancelled from UI"`.
- **Fix:** reason-aware status mapping (HP-1): Cancelled + expired reason → **"Hết hạn thanh toán"** (distinct tone/icon + `expiry-reason-banner.tsx` + order timeline entry "ghế đã hoàn lại"); countdown copy aligned to server semantics (explain that the 10-minute window starts at checkout); cancel button only when mutable, with confirm dialog + **Vietnamese reason picker**; order detail shows "Đã hết hạn thanh toán lúc …".
- **Acceptance:** users can always distinguish "tôi đã huỷ" from "hết hạn thanh toán"; no generic English "Cancelled".

### Other fixes folded into the migration
- **Local QR** (CDN dependency + offline-at-the-gate): rewrite `qr-code.tsx` with `lib/qr.ts`; remove `api.qrserver.com` from `next.config.ts`. *(P0)*
- **Search honesty:** client-side filter/sort only covers the fetched page; "Cập nhật theo thời gian thực" is static. Either move filter/sort server-side (add sort param to `/search/trips`) or relabel honestly. *(P3)*
- **VNPay return pages** trust query params and never refresh order/payment state → refetch on mount + async-issuance state. *(P3)*
- **Mobile overflow** (wide tables, 2D seat grid): horizontal containment + mobile filter drawer (`mobileFilterDrawerOpen` already exists in `ui.store`) + sticky checkout bar. *(P3)*
- **Dead code:** `manual-payment-form.tsx`, `analytics-chart.tsx`, `page-transition.tsx`, unused seat-legend entries, `/route-map` dev sitemap — decide keep/remove in P6.

---

## 6. Decisions — LOCKED (approved)

| # | Decision | Outcome |
|---|---|---|
| 1 | **Change/refund policy** | **Ship real change/refund endpoints.** Scope grows: backend workstream for change/refund flows (payment refund call, seat release, notification events, DTOs + migration) coordinated with the design-system workstream; UI promises become enforceable. |
| 2 | **`/route-map`** | **Convert to a schematic route overview** (Direction B: station dots + lines) for the brand layer. |
| 3 | **Self-service passenger/seat editing** | **Owner edits while mutable** (status ∈ {Draft, PendingPayment, Paid, Confirmed}) via a normal form UI; admin gets full edit + audit; hidden/read-only after issuance/cancel/expire/refund. |
| 4 | **QR library** | **Add `qrcode` dependency**; local SVG generation; remove `api.qrserver.com` from `next.config.ts`. |
| 5 | **Search sort/filter** | **Server-side sort/filter** on `/search/trips` so results, pagination and totals are honest end-to-end. |

With these locked, the full Direction B design system is produced in `docs/design/direction-b-design-system.md` (§4 phase scopes in this document now refer to that spec; HP-2 scope includes the change/refund backend workstream).

---

## 7. Implementation status (updated as work lands)

| Item | Status | Evidence |
|---|---|---|
| **P2/HP-1 — Vietnamese status system** | ✅ Done | `client/lib/i18n/status.vi.ts` (labels/tones/next-step), `client/components/status/status-badge.tsx` (icon+text), `client/lib/formatters/status.ts` (Vietnamese, reason-aware), `railway-ui` StatusBadge wrapper forwards new props; app-wide via formatters |
| **HP-6 — TTL/cancelled clarity** | ✅ Done (frontend + persistence) | `cancelReason` persisted (`orders-service` schema + migration `20260815000000_add_order_contact` + `cancel()` + `toOrderResponse`); reason-aware badge; `components/status/expiry-reason-banner.tsx`; `components/status/order-timeline.tsx`; orders detail shows timeline + expiry banner |
| **P1 — Direction B tokens** | ✅ Done | `--ds-*` data-layer tokens (light+dark) in `client/app/globals.css` |
| **HP-3 — Contact persistence** | ✅ Done (end-to-end) | orders-service schema/migration/DTO/service + api-gateway DTO + client api-types/hook/booking-tab sends `contactEmail`/`contactPhone`; notifications prefer order contact |
| **HP-4 — Gating + cancel** | ✅ Done (orders detail) | "Điều chỉnh đơn" panel gated (`isAdminView \|\| isOrderMutable`); owner edits only while mutable; cancel button only when mutable + `ConfirmDialog` with Vietnamese reason picker; admin lifecycle actions routed through confirmations |
| **P4 — ConfirmDialog** | ✅ Done (core) | `client/components/ui/confirm-dialog.tsx` (radix AlertDialog, requireAck); wired into `admin-order-manager` (refund/cancel), `admin-payment-manager` (cancel), `orders/[id]` (user cancel + admin refund/cancel/expire/remove) |
| **R9 — Local QR** | ✅ Done | `qrcode` dep added; `client/lib/qr.ts` + rewritten `client/components/ticket/qr-code.tsx`; `api.qrserver.com` remotePattern removed from `next.config.ts` |
| **HP-5 — Seat availability refresh + conflict + auto-assign** | ✅ Done (MVP) | `useTicketAvailability`/`useSeatMap` accept `refetchInterval`; booking tab polls 20 s, marks selected-but-now-occupied seats **conflict** (new state in `seat-map-2d.tsx` + legend), conflict banner with "Chọn ghế thay thế" / "Bỏ ghế xung đột", "Chọn ghế tự động" button; iso view maps conflict→taken |
| **R5 — VNPay return honesty** | ✅ Done (success page) | `payments/vnpay/success` refetches the order, shows async issuance state + OrderTimeline |
| **P3 — Search TripRow (desktop)** | ✅ Done | `/search` renders Direction B tabular rows (Tàu · Hành trình · Giờ · Thời gian · Giá từ · Còn chỗ · Hạng ghế · Chọn) on lg+; notched cards kept for mobile; "Cập nhật theo thời gian thực" claim replaced with honest total/sort note |
| **P4 — Admin role editor** | ✅ Done | `admin-user-manager` role `<select>` per row via `useUpdateUser` (USER=0 / ADMIN=1) |
| **P6 — profile/tickets raw payload** | ✅ Done | Raw `qrPayload` JSON replaced with a real local QR render + "Quét tại cổng ga" |
| **HP-2 — Refund workflow (partial)** | ✅ Done (safe parts) | `orders-service.refund()` now: cancels leftover pending payments, **releases held seats**, and emits **`notification.order_refunded`** (new handler in notification-service); VNPay money-refund API call still outstanding (merchant-side, see §11) |
| **P3 — Booking wizard 4-step** | ✅ Done | `booking-tab` restructured: seat → info → payment steps (all sections stay mounted so RHF validation is intact); step nav with back/next + validation gates (`form.trigger`); Enter-key guard advances steps, never checkouts early; stepper navigation clickable for completed steps |
| **P4 — Dense admin data table** | ✅ Done | `table.tsx` gained `density` ("comfortable" | "dense") via context; applied to orders/payments/users admin managers |
| **P6 — Dead code removed** | ✅ Done | Deleted unreferenced `page-transition.tsx`, `analytics-chart.tsx`, `manual-payment-form.tsx` (verified zero imports) |
| **P5 — Brand layer** | ✅ Verified | Home already carries the limited Direction A elements (Fraunces headline, iso hero via `public-shell`, count-up stats, ticket-notch featured card, warm paper); guardrails hold — data stays mono, no serif in search/wizard |
| **Search sort/filter (locked decision)** | ✅ Done (server-side sort) | `sort` param (`recommended`/`price`/`departure`) added to tickets-service `searchTrips` (full-set in-memory sort then paginate), gateway DTO (IsIn) + passthrough, client hook + search page (client-side re-sort removed); time-of-day/seat-class filters remain client-side |
| **HP-2 — copy honesty** | ✅ Done | Home trust item "Hoàn vé trong 24h" → "Hỗ trợ đổi trả vé" (no unenforceable claim); booking card policy note flagged for the change/refund workstream |
| **P3/P4/P6 — remaining surfaces** | ⏳ Next | Mobile sticky checkout bar done (see below); remaining: price-breakdown/e-ticket polish, full a11y audit, VNPay money refund, change/refund endpoints |
| **P3/R7 — Mobile sticky checkout bar** | ✅ Done | `booking-tab` shows a fixed bottom bar on <lg when seats are selected (seat count + running total + validation-gated "Tiếp tục"/"Tiếp theo: Thanh toán"); hidden on the payment step where the primary CTA lives |
| **P6 — Form a11y wiring** | ✅ Done | `FormField` auto-wires `aria-describedby` (hint + error) and `aria-invalid` onto child controls via `useId` + cloning — screen readers announce validation state without call-site work |
| **HP-2 — Payment Refunded status (end-to-end)** | ✅ Done | New payment status **Refunded=6** across payments-service (enum + `payments.markRefunded` command), orders-service `refund()` now marks settled payments Refunded (in addition to cancel-pending + seat release + `order_refunded` email), gateway `POST /payments/mark-refunded` (ADMIN) + DTO, client enum + Vietnamese label "Đã hoàn tiền" + icon. Actual VNPay money transfer still requires merchant credentials (see §11) |
| **Search sort/filter (locked decision)** | ✅ Done | `sort` + **`timeOfDay` + `seatClass` server-side filters** (mirror of former client logic, in `search.utils.ts`), honest filtered totals; client no longer filters locally — search page summary shows server-filtered total |
| **P0 — confirm dialogs, ticket surfaces** | ✅ Done | `OperationsTab` "Xoá vé" and the ticket-item "Danger zone" delete now use `ConfirmDialog` with acknowledgment; admin payment detail adds a **"Hoàn tiền"** action (only for Paid payments) via the new `payments.mark-refunded` endpoint |

**Verification:** `tsc --noEmit` + `eslint` green on all changed files; `next build` green (full route map generated); orders-service `typecheck:tsc` + `build` green; api-gateway `tsc --noEmit` green. Note: the new orders-service migration must be applied to running databases (`scripts/migrate-databases.ps1`).
