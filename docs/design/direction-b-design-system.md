# Vietrail — Direction B Design System Specification ("Transit Precision")

> **Status:** Approved direction — design system spec. Implementation follows the migration plan in `docs/design/direction-b-inventory-and-migration-plan.md` (P1→P6). All component names reference the inventory in that document.
> **Scope:** Data layer (search, booking wizard, seat map, payment, ticket/order management, admin) = strict Direction B. Brand layer (home hero, featured trip, route-map, e-ticket presentation) = limited Direction A elements, never at the cost of clarity or timetable readability.
> **Language:** UI copy is Vietnamese; all status labels are Vietnamese (see §4).

---

## 1. Design principles

1. **Data first, decoration never.** Every pixel either carries information or is quiet space. If an element does not help a decision (book / pay / manage / operate), it is removed.
2. **Mono data language.** Times, prices, train numbers, seat codes, and IDs are always IBM Plex Mono with tabular numerals. Users scan these, not read them.
3. **One signal color.** Teal is the brand + action color. Semantic colors are reserved exclusively for status. Amber exists only for "flash sale" offers.
4. **Borders over shadows.** Definition comes from hairline borders; elevation exists only for overlays (dropdowns, dialogs, sheets).
5. **Honest states.** Loading, empty, error, conflict, expiry, and async-processing states are explicit, Vietnamese, and always carry a next action. Never color alone; never English statuses.
6. **Calm motion.** Motion communicates urgency (hold countdown, "Sắp hết") or confirms selection — nothing decorative on data surfaces. `prefers-reduced-motion` is honored globally.
7. **Trust through precision.** Payment and cancellation moments are the calmest, most legible screens in the product.

---

## 2. Tokens

### 2.1 Color — data layer (Direction B)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#F8FAFC` | Page background (cool slate — not the warm paper of Direction A) |
| `--surface-1` | `#FFFFFF` | Cards, panels |
| `--surface-2` | `#F1F5F9` | Table header, secondary fills, zebra rows |
| `--surface-3` | `#E2E8F0` | Hover fills, pressed states |
| `--ink` | `#0F172A` | Primary text (slightly deeper than current `#1A2332` for contrast headroom) |
| `--ink-2` | `#334155` | Secondary text |
| `--ink-3` | `#64748B` | Tertiary/meta text (AA on white ✓) |
| `--ink-4` | `#94A3B8` | Disabled text, placeholders (never for essential info) |
| `--border` | `#CBD5E1` | Default hairline |
| `--border-strong` | `#94A3B8` | Input borders, strong dividers |
| `--brand` | `#0D7377` | Primary actions, active states, links (AA on white ≈5.6:1 ✓) |
| `--brand-hover` | `#0A5C5F` | Hover |
| `--brand-active` | `#084A4D` | Pressed |
| `--brand-soft` | `#E6F3F3` | Selected/active backgrounds, route fills |
| `--focus-ring` | `#0D7377` | 2px focus ring + 1px offset (keep) |

**Semantic status (data layer):** use the existing token family (already dark-mode ready) with these text-contrast rules:

| State | Text | BG (soft) | Icon | Notes |
|---|---|---|---|---|
| Success | `#1E7A44` (darken from `#237347` for small text AA) | `#E8F5EE` | CheckCircle | |
| Warning | `#965A0B` | `#FEF6E7` | AlertTriangle | |
| Destructive | `#B03030` (darken from `#C53D3D` for small text AA) | `#FBEAEA` | XCircle | |
| Info | `#2B6CB0` | `#EBF4FD` | Info | |
| Neutral/muted | `#64748B` | `#F1F5F9` | Minus/Circle | Used for Draft, Expired-adjacent neutrals |

**Seat states (data layer):**

| State | Fill | Border | Text | Extra |
|---|---|---|---|---|
| Available | `#FFFFFF` | `#CBD5E1` | `#334155` | hover: brand border + soft fill |
| Selected | `#0D7377` | `#0D7377` | `#FFFFFF` | 2px ring `#0D7377` at 30% + check mark |
| Taken | `#F1F5F9` | `#E2E8F0` | `#94A3B8` | diagonal strike / ✕; cursor not-allowed |
| Disabled | `#F8FAFC` | `#E2E8F0` | `#94A3B8` | 40% opacity; not focusable |
| *(future)* Accessible | `#DC FCE7`-family (reuse `--seat-accessible*`) | | | data model support required first |
| *(future)* Female-only | `--seat-female*` | | | data model support required first |

**Brand layer (limited A) tokens — kept as-is from the current system:** `--background #FAFBFB` (warm), Fraunces display, amber `#B8632A` (large text/UI accents only; use `#964F22` for small amber text), ticket-notch motif, iso hero colors. These never appear in the data layer.

### 2.2 Typography

| Role | Font | Sizes | Weight | Usage |
|---|---|---|---|---|
| Data/mono | IBM Plex Mono (vietnamese subset) | 11/12/13/14 | 500/600 | Times, prices, train numbers, seat codes, IDs, ticket codes, durations — always `tabular-nums` |
| UI/body | Space Grotesk (vietnamese subset) | 13/14/16 | 400/500/600/700 | All interface text, labels, nav, buttons, forms |
| Display (brand layer ONLY) | Fraunces (vietnamese subset) | 28–56 clamp on home/hero; 20–24 on e-ticket presentation | 500/600 | Marketing headlines, featured trip, e-ticket title. **Never** in tables, wizard steps, seat map, payment, admin |

**Type scale (data layer):** 11 (kicker/labels, uppercase +0.12em tracking) · 12 (meta, hints) · 13 (compact body, table cells) · 14 (default body) · 16 (emphasis, card titles) · 20 (section titles) · 28 (page titles). Line-height 1.5 (data) / 1.2 (titles); letter-spacing −0.01em for headings, 0 for data.

**Rule:** every datum uses mono + tabular; every label uses Space Grotesk uppercase 11px for scanability; Fraunces appears only on the surfaces listed in §9.

### 2.3 Spacing & layout

- 4 px base grid. Scale: 4/8/12/16/20/24/32/40/48/64.
- Container: 1240 px max, gutters 16/24/32 (sm/lg/xl) — keep `.app-container`.
- **Density:** comfortable rows 48–56 px (booking, lists); dense rows 40–44 px (admin tables, search rows on desktop); cell padding 8–12 px.
- Page rhythm: 32–48 px between sections; 16–24 px inside cards.

### 2.4 Radius & elevation

| Token | Value | Usage |
|---|---|---|
| Radius sm | 2 px | Badges, chips, small controls |
| Radius md | 4 px | Buttons, inputs, cards, table containers |
| Radius lg | 6 px | Seat cells (max — keep seats square-ish), dialogs |
| (brand) Radius up to | 12 px | Marketing cards, e-ticket presentation only |
| Elevation | borders only | Default definition is 1px `--border` |
| Shadow sm/md | existing | **Overlays only**: dropdowns, dialogs, sheets, popovers, mobile bars |

### 2.5 Motion

| Token | Value | Usage |
|---|---|---|
| 150 ms standard | cubic-bezier(0.4,0,0.2,1) | Micro-interactions: seat select, hover, toggle, toast |
| 250 ms emphasized | cubic-bezier(0.2,0,0,1) | Panels, dialogs, stepper transitions, mobile bar |
| 400 ms max | — | Brand-layer entrances only (home sections) |
| Urgency | restrained pulse | Only: countdown <2 min, "Sắp hết" availability, seat auto-refresh indicator |

**Rules:** no entrance choreography on data surfaces (search results, tables, wizard steps, seat map — a single 150 ms fade for step changes is the max); data readouts never animate (prices, times, statuses); `prefers-reduced-motion` disables all of the above (existing global + `useReducedMotion`).

### 2.6 Iconography

- lucide, strokeWidth 1.5, 16/18/20 px default sizes.
- Status icons: CheckCircle / AlertTriangle / XCircle / Info / Clock / MinusCircle — paired with text (never color alone).
- Domain icons: TrainFront (trains), MapPin (stations), Armchair (seats), CalendarDays, Clock3, Wallet, Ticket, ShieldCheck, Lock (payment trust), Search, ArrowLeftRight (swap).

---

## 3. Core component specs (data layer)

### 3.1 StatusBadge (+ `lib/i18n/status.vi.ts`)
- Anatomy: `[icon] label` in a 2px-radius chip; border 1px; bg = soft tone; text = tone text. Optional chevron tooltip with "what happens next" copy.
- Status → Vietnamese mapping (§4). Reason-aware: `Cancelled` renders "Đã huỷ" normally; if `cancelReason` contains "expired"/"Unpaid order expired", renders **"Hết hạn thanh toán"** with Clock icon + warning tone, and links to `ExpiryReasonBanner`.
- Sizes: sm (12px, tables/lists), md (13px, detail headers).
- Keyboard/AT: the icon is `aria-hidden`; the label is the accessible name; tooltip text in `aria-describedby`.

### 3.2 OrderTimeline
- Horizontal (desktop) / vertical (mobile) stepper of order lifecycle: **Thanh toán nhận được → Xác nhận → Phát hành vé → Email đã gửi**.
- States per node: done (filled teal + check), active (ring + pulse only while "Đang phát hành vé…"), pending (neutral), failed/skipped (destructive X with reason).
- Used on order detail and VNPay success page when issuance is still async ("Đang phát hành vé điện tử…" active node).
- Never color alone: each node has icon + label.

### 3.3 ExpiryReasonBanner
- Shown on order detail for TTL-cancelled orders: **"Đơn hết hạn thanh toán lúc {time} — ghế đã được hoàn lại."** + primary CTA "Đặt lại chuyến" (prefills the same route/date search) + secondary "Liên hệ hỗ trợ".
- Warning tone, icon Clock, `role="status"`.

### 3.4 TripRow (search results, desktop) & TripCard (brand)
TripRow — the default in `/search`:
- Columns (aligned, sortable header): **Tàu** (mono train number) · **Hành trình** (from → to with codes) · **Khởi hành** (mono time + date) · **Đến** (mono time + date, `+1` tag for next-day) · **Thời gian** (mono duration) · **Hạng ghế** (chips) · **Còn chỗ** (availability text + tone) · **Giá từ** (mono, right-aligned) · **CTA** (Chọn chuyến / Hết chỗ disabled).
- Row height 56 px; hover = surface-3 + brand left-border accent; row is the click target.
- Next-day arrival: explicit `+1` chip beside arrival date — never ambiguous.
- Mobile: row becomes a card with stacked fields; CTA full-width bottom; keep same data order.

TripCard — brand layer only (home featured trip, e-ticket presentation): keeps the ticket-notch motif, Fraunces title, iso tilt, count-up — but the data inside (times, price) stays mono + tabular and the CTA stays B-styled.

### 3.5 Search surface
- Filter bar: compact B styling; fields — Ga đi / Ga đến (combobox typeahead, `useStationSuggestions` + 5-station fallback), Ngày đi (date, min = today), swap button, Sắp xếp (Phù hợp nhất / Giá thấp trước / Khởi hành sớm → **server-side** params), Giờ đi pills, Hạng ghế pills, Đặt lại.
- Active filter chips (existing pattern, B restyle).
- Result summary bar: "N chuyến phù hợp · M chỗ trống · Giá từ X" — honest: reflects server result set (server-side sort/filter locked decision).
- Pagination: server-driven page size 12 (keep), with "tổng cộng N chuyến" label.
- "Cập nhật theo thời gian thực" claim removed or replaced with an honest freshness note driven by refetch timing.

### 3.6 SeatMap2D (primary)
- Geometry: square cells 44 px (40 px dense), 4 columns with aisle after 2 (configurable), row numbers on the left, window indicators, coach header (Toa X · class · type · "← Hướng đầu tàu"), legend footer.
- States per §2.1; selection: fill teal + check + ring; taken: strike; disabled: faded.
- Per-seat price: shown on hover/focus (tooltip) and always in the selection summary; seat cell itself shows the mono label only.
- Keyboard: full arrow-key grid navigation; Enter/Space toggle; `aria-pressed`, `aria-label="Ghế {label}, Còn trống/Đang chọn/Đã bán"`; focus ring visible.
- Selection summary: strip above the map — "Đã chọn N/M ghế" + chips of selected labels + total; a "Tự động chọn N ghế" (`SeatAutoAssign`) button; trash per seat.
- **Availability auto-refresh** (`useSeatMapRefresh`, 15–20 s poll while on seat step): merge occupied changes non-destructively; if a *selected* seat flips to taken → mark it conflicted (amber) and surface the conflict dialog, never silently drop.
- **Conflict dialog** (409 at checkout): "Các ghế sau vừa được đặt bởi người khác: A4, B7" → actions: "Chọn ghế khác" (re-open map with conflicted seats marked), "Tự động chọn thay thế", "Đổi toa". Preserves all other selections.
- Availability stamp: "Cập nhật lúc {HH:MM}" in the coach header; pulse dot while polling.
- Empty state: "Chưa có sơ đồ ghế cho toa này." (existing copy, B restyle).

### 3.7 SeatMapIso (optional toggle)
- Retained as an explicit secondary view ("3D Isometric" toggle, persisted) for users who want the spatial view; default remains 2D.
- Same state semantics and data as 2D; reduced GSAP entrance; hit areas get visible hover affordance (not invisible polygons).
- Hidden on viewports < 640 px (2D + auto-assign are the mobile path).

### 3.8 Booking wizard (4-step)
Steps: **1 Chọn chuyến** (fare-class cards) → **2 Chọn ghế** (SeatMap2D + auto-assign + coach navigator) → **3 Thông tin** (passengers + contact) → **4 Thanh toán** (breakdown + trust + CTA).
- `StepLayout` renders: stepper header (BookingProgress), step content, footer with Quay lại / Tiếp theo; step gating rules:
  - 1→2 requires a fare class; 2→3 requires ≥1 seat; 3→4 requires all passengers valid (name ≥2 chars; passenger type set; contact email+phone valid); 4 = submit.
- State persisted in `booking.store` (sessionStorage, existing). Returning to a step preserves prior data.
- Seat hold: local countdown shown from step 2; copy explains "Giữ chỗ tạm thời — sau khi thanh toán đơn được giữ thêm 10 phút" (aligns client timer with server TTL semantics); expiry banner + reset.
- Contact fields now **sent in the checkout payload** (`contactEmail`/`contactPhone` — HP-3) and framed as "Vé và hoá đơn điện tử sẽ gửi tới email/SĐT này".
- Submit: CTA shows exact amount; on 409 → conflict dialog; on 429/503 → busy panel with retry, selections preserved; on success → VNPay redirect.
- **Mobile:** `MobileCheckoutBar` sticky bottom: seats summary + running total + "Thanh toán {amount}"; sidebar breakdown collapses behind it.
- Login gate (guest): B-styled panel with `/login?next=`.

### 3.9 PriceBreakdown (cost table)
- Rows: per passenger — `Ghế A1 · Toa 2 · Nguyễn Văn A` | `{unit} × 1` | `{discounted}` (mono, right); discount lines in success tone with −; "Tổng ưu đãi: −X" chip; footer total in mono 20px teal + "Đã gồm VAT và các khoản phí".
- Variants: `sidebar` (order detail/wizard), `compact` (mobile bar), `inline`.
- Server total is authoritative; client preview must match (same rounding to 1,000 VND).

### 3.10 E-ticket stub + local QR
- Stub: hairline card; left = route + mono data (Tàu, Ga đi/đến, giờ, Toa · Ghế, hành khách, ngày); right = local QR (from `lib/qr.ts`, `qrcode` dep) + ticket code `TCK-…` + "Quét tại cổng ga"; print/PDF + copy buttons.
- Pre-issue state: "Vé chưa được phát hành — QR sẽ xuất hiện sau khi thanh toán hoàn tất" + OrderTimeline active node.
- Brand moment: the e-ticket presentation card may use the ticket-notch motif + Fraunces title (limited A) — data inside stays mono.
- `profile/tickets` wallet: same stub, and stop dumping raw `qrPayload` text (replace with ticket code + QR).

### 3.11 Countdown & urgency
- Countdown chip: mono tabular `MM:SS`; normal = brand text on soft teal; <2 min = warning text + subtle pulse; expired = destructive + copy swap ("Đơn hết hạn thanh toán").
- "Sắp hết — N chỗ" availability: warning tone + alert icon (existing), pulse kept minimal.

### 3.12 Admin data table & actions
- `DataTable`: dense (40–44 px), sticky header, sortable headers, column visibility, filter chips, server pagination, row actions dropdown.
- Columns: Orders — Mã đơn · Khách hàng · Tuyến · Tổng · Trạng thái · Đặt lúc · Thao tác; Payments — Giao dịch · Đơn · Phương thức · Số tiền · Trạng thái · Thời gian; Tickets — Tàu · Tuyến · Giờ · Hạng · Tồn · Giá · Bán · Thao tác; Users — Tên · Email · Vai trò · Ngày tạo · Thao tác.
- **ConfirmDialog** on every destructive action: title + consequence copy + typed confirm (e.g., type "XÓA" not required; a checkbox "Tôi hiểu thao tác này không thể hoàn tác" is enough) + destructive button.
- Refund confirm copy (HP-2): "Chỉ cập nhật trạng thái đơn sang Đã hoàn tiền — [after backend work:] sẽ hoàn tiền qua VNPay và gửi email xác nhận."
- Audit context: display `updatedAt` + operator id for lifecycle actions (read-only for now).

### 3.13 Forms
- Keep `FormField` (label/error/hint) + zod; Vietnamese error copy from `lib/validation.ts` (already Vietnamese); ensure `aria-invalid` + `aria-describedby`.
- Station combobox: searchable, keyboard navigable, "không tìm thấy ga" empty state.
- Admin seat-label editor: CSV textarea with live validation (format, duplicates, stock consistency) + preview chips.

---

## 4. Status system — Vietnamese labels (single source)

| Domain | Status | Label (vi) | Tone | Icon |
|---|---|---|---|---|
| Order | 0 Draft | Nháp | neutral | FileText |
| Order | 1 PendingPayment | Chờ thanh toán | warning | Clock |
| Order | 2 Paid | Đã thanh toán | info | Wallet |
| Order | 3 Confirmed | Đã xác nhận | success | CheckCircle |
| Order | 4 TicketIssued | Đã phát hành vé | success | Ticket |
| Order | 5 Cancelled (reason ≠ expired) | Đã huỷ | destructive | XCircle |
| Order | 5 Cancelled (reason = expired) | **Hết hạn thanh toán** | warning | Clock |
| Order | 6 Expired | Hết hạn | warning | Clock |
| Order | 7 Refunded | Đã hoàn tiền | neutral | RotateCcw |
| Payment | 0 Pending | Chờ thanh toán | warning | Clock |
| Payment | 1 Processing | Đang xử lý | info | Loader |
| Payment | 2 Paid | Thành công | success | CheckCircle |
| Payment | 3 Failed | Thất bại | destructive | XCircle |
| Payment | 4 Cancelled | Đã huỷ | neutral | MinusCircle |
| Payment | 5 Expired | Hết hạn | warning | Clock |
| Ticket | 0 Draft | Nháp | neutral | FileText |
| Ticket | 1 Published | Đang mở bán | success | CheckCircle |

- Mapping + tone + icon + optional next-step copy live in `lib/i18n/status.vi.ts`; `StatusBadge` consumes it. No English status strings anywhere.
- Next-step copy examples: Chờ thanh toán → "Thanh toán trước khi hết hạn {time}"; Đã thanh toán → "Đang xác nhận đơn"; Đã xác nhận → "Vé đang được phát hành"; Hết hạn thanh toán → "Ghế đã được hoàn lại — đặt lại ngay".

---

## 5. Surface specs (key screens)

### 5.1 Search results (`/search`)
Sticky filter bar (B) → summary bar → paginated TripRows (desktop) / cards (mobile) → active-filter chips → skeleton rows while loading → EmptyState "Chưa có chuyến phù hợp" with "Đặt lại bộ lọc" CTA.

### 5.2 Ticket detail (`/tickets/[id]`)
Tabs: **Hành trình** (journey meta + fare-class cards: name, Toa, class/type, "Còn N chỗ", price with flash strike, CTA "Chọn hạng") + schematic RouteMap · **Đặt chỗ** (wizard) · **Sơ đồ ghế** (SeatMap2D + legend + availability stamp; admin quick ops gated to admin). Sale-status line: "Đang mở bán / Tạm đóng bán" (StatusBadge).

### 5.3 Order detail (`/orders/[id]` + profile + admin)
Header: StatusBadge (+ cancel/repay actions, only when mutable) → OrderTimeline (if applicable) → meta grid (mono IDs/times) → route line → seats (SeatCloud) → passengers → contact (ContactSummary, post HP-3) → payment history → e-ticket stub → **owner edit panel** (mutable only, form UI) / **admin panel** (full edit + audit, confirm dialogs) → ExpiryReasonBanner when TTL-cancelled.

### 5.4 Payment success / failed (VNPay return)
Refetch order+payment on mount; success → CheckCircle + txnRef + amount + OrderTimeline (async issuance state) + "Xem vé điện tử" / "Về trang chủ"; failed → reason message + "Thử lại thanh toán" / "Đặt lại chuyến". No "N/A" fallbacks — hide missing params gracefully.

### 5.5 Home (brand layer, limited A)
Fraunces headline, iso hero visual (retained), B-styled search card (comboboxes, mono dates), count-up stat tiles, featured TripCard (notch + iso tilt), 4-step strip, trust items, task cards. Data inside cards remains mono; no serif in the search card.

### 5.6 Route map (`/route-map` → schematic)
Station dots + connecting line (B schematic), North–Central–South corridor, key stations labelled; interactive hover shows station name/code; links to search prefilled. This replaces the dev sitemap.

### 5.7 Admin dashboard
Compact B stat cards (revenue, published trips, orders, users) + status breakdowns + system health panel (UP/DOWN badges with mono timestamps).

### 5.8 Auth pages
AuthShell split layout (unchanged structure), B restyle; login/register/forgot/reset forms with Vietnamese validation; register → prompt "Xác minh email" (auto-login optional, see open item §11).

---

## 6. Dark mode

- Keep the existing dark token set (already well-tuned) as the base; extend with the B ink scale (`#0F172A`→`#E2E8F0`-family), `--surface-*` dark equivalents, and the dark semantic/seat tokens already defined in `globals.css`.
- Contrast in dark: teal `#14A1A5` for text on dark surfaces (existing) — verify AA; status text colors use the lightened dark variants (existing `--order-*`, `--payment-*`, `--seat-*`).
- Dark mode must be pixel-parity with light for: seat states, status badges, tables, wizard, e-ticket, admin.

---

## 7. Accessibility checklist (WCAG 2.1 AA target)

- **Contrast:** verify/fix at implementation: teal `#0D7377` on white ≈5.6:1 ✓ (normal text); amber `#B8632A` on white ≈4.3:1 — **large text/UI only, or use `#964F22`**; destructive `#C53D3D` — darken to `#B03030` for small text; warning `#965A0B` ✓; `--ink-4 #94A3B8` never for essential info.
- **Non-color status:** every status = icon + text + tone (done via §3.1/§4).
- **Keyboard:** seat map arrow-key grid (new), wizard fully tabbable, combobox ARIA pattern, dialogs focus-trapped + restored.
- **Focus:** 2px visible ring on all interactive elements (keep global rule); focus never removed on selection.
- **Reduced motion:** global kill-switch (exists); seat map stagger, iso float, count-up, urgency pulse all disabled; static equivalents shown.
- **AT:** `aria-live` for countdown expiry + conflict announcements; `role="status"` on banners; seat buttons labeled; tables have captions; touch targets ≥44 px on mobile.
- **Layout:** 320 px no horizontal page scroll; horizontal scroll allowed only inside table/seat-map containers.

---

## 8. Localization standards

- All copy Vietnamese; statuses per §4; numbers `vi-VN` (VND, `dd/MM/yyyy`, 24 h `HH:mm`), tabular numerals.
- Wire `lib/i18n/vi.ts` as the single source (runtime `t()`); migrate hardcoded strings incrementally, statuses first; no new hardcoded strings in new components.
- Dates: always show full date under times (overnight trips get `+1`); durations as `XhYY`.
- Currency: "1.234.000 ₫" via existing `formatCurrency` (vi-VN, 0 decimals).

---

## 9. Brand layer rules (limited Direction A)

**Allowed (marketing/landing/hero + presentation moments only):**
- Fraunces display headlines on: home, route-map intro, e-ticket presentation title.
- Iso hero visual + iso float on home only.
- Ticket-notch motif on: home featured TripCard, e-ticket presentation stub.
- Warm paper background + amber accent on home/route-map only.
- Count-up stats + animated sections on home only.

**Forbidden (never in data layer):**
- Serif in: search rows/cards, wizard, seat map, price breakdown, tables, admin, order/payment detail data, status badges.
- Iso seat map as default; decorative shadows; entrance choreography; amber for anything other than flash-sale offers; ticket notch on search rows.

**Guardrail:** any marketing surface that displays times, prices, availability, or statuses must use the data-layer typography for those data points.

---

## 10. Mapping to migration phases

| Deliverable | Phase | Acceptance |
|---|---|---|
| B tokens (color/type/spacing/radius/elevation/motion) + dark mode | P1 | All routes render; no token regressions |
| Status system (status.vi.ts, StatusBadge, OrderTimeline, ExpiryReasonBanner) + i18n wiring | P2 | Zero English status strings; statuses consistent across surfaces |
| TripRow/TripCard, search surface (server-side sort/filter), station combobox | P3 | Honest totals & pagination; typeahead works |
| SeatMap2D primary + iso toggle + auto-assign + conflict dialog + availability refresh + coach navigator | P3 | 409/503 handled; selections preserved; keyboard grid works |
| Wizard 4-step + contact persistence + mobile bar + price breakdown | P3 | Contact persisted (HP-3); flow gating correct; mobile pass |
| E-ticket stub + local QR + VNPay return refetch + order timeline/expiry clarity | P3 | QR offline-capable; async issuance state visible |
| Admin data table + confirm dialogs + role editor + gating fix | P4 | Permission tests; no un-gated panels |
| Home/route-map/e-ticket brand layer (limited A) | P5 | No clarity regression; guardrails met |
| A11y audit, dark parity, dead-code cleanup, `/route-map` schematic | P6 | WCAG AA checklist green; lint/build/typecheck green; J1–J6 smoke |

---

## 11. Open items (backend workstreams coordinated with design)

1. **Change/refund endpoints** (locked): real change (re-route/re-date/re-class with price diff) + refund (VNPay refund, seat release, `notification.refunded`) — DTOs, orders-service + payments-service changes, migration. UI surfaces for change/refund will follow the wizard/order patterns here.
2. **Contact persistence** (HP-3): additive orders-service migration + DTO + checkout + notifications.
3. **Search sort/filter server-side** (locked): `/search/trips` sort + filter params; client sends them.
4. **Google OAuth** (stubbed today): out of scope for design; UI entry point added when backend lands.
5. **Special seats** (accessible/female-only): tokens exist; UI surfaces (legend, map states) activate when the data model supports attributes.
