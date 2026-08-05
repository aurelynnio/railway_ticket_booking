# Kế hoạch: Phương án C – Full Redesign Design System (Vietrail Way)

> **Đã chốt với người dùng:**
> - Phương án: **C – Full redesign** (đắt, 3-4 tuần effort)
> - Primary color: **JD Red `#C8161D`**
> - Logo: **SVG component 2 variant (light + dark)**
> - Ngôn ngữ: **Tiếng Việt** trong toàn bộ UI
> - Phong cách: **Professional, clean, border-over-shadow, không gradient, không icon trẻ con**

---

## 1. Tóm tắt

Redesign toàn bộ frontend của dự án `railway_ticket_booking/client` theo hệ thống design system mới, brand-focused với JD Red, motion design với GSAP, illustrations tùy chỉnh cho empty states, full a11y pass và i18n-ready.

**Kết quả cuối cùng:**
- Brand identity mạnh (JD Red + đen + cream nhạt)
- Component library mở rộng (Tabs, Dropdown, Tooltip, Avatar, Pagination, DataTable, Skeleton, CommandPalette)
- Motion design system với GSAP (entrance, micro-interaction, page transition, seat map realtime)
- Illustrations cho empty states (SVG tùy chỉnh)
- Dark mode polish 100% component
- A11y đạt WCAG AA
- Lighthouse 95+
- Storybook/Ladle cho design system docs

---

## 2. Tổng quan thay đổi

### 2.1 Token mới

**File: `app/globals.css`**

```css
@theme inline {
  /* Brand */
  --color-brand: #C8161D;          /* JD Red - primary CTA */
  --color-brand-hover: #A61118;
  --color-brand-soft: #FFF5F5;     /* red-50 - hover background */
  --color-ink: #1A1A1A;            /* gần đen - heading */
  --color-ink-muted: #5C5C5C;      /* text phụ */
  
  /* Surface */
  --color-background: #FAFAF7;     /* cream ấm nhạt hơn hiện tại */
  --color-surface-1: #FFFFFF;       /* card chính */
  --color-surface-2: #F4F4F0;       /* card phụ / quiet */
  --color-surface-3: #ECECE6;       /* divider / hover bg */
  
  /* Border - đạt WCAG AA 3:1 */
  --color-border: #D4D4D0;
  --color-border-strong: #A8A8A2;
  --color-ring: #C8161D;
  --color-input: #E5E5DF;
  
  /* Status */
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-destructive: #DC2626;
  --color-info: #2563EB;
  
  /* Layout */
  --radius: 0.625rem;
  --radius-sm: 0.375rem;
  --radius-lg: 0.875rem;
  
  /* Font */
  --font-sans: 'Be Vietnam Pro', 'Inter', system-ui;
  --font-heading: 'Be Vietnam Pro', 'Inter', system-ui;
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono';
}

.dark {
  --color-background: #0A0A0A;
  --color-surface-1: #141414;
  --color-surface-2: #1F1F1F;
  --color-surface-3: #2A2A2A;
  --color-ink: #F5F5F5;
  --color-ink-muted: #A1A1A1;
  --color-brand: #EF4444;            /* red sáng hơn cho dark */
  --color-brand-hover: #F87171;
  --color-brand-soft: #2A0F0F;
  --color-border: #2A2A2A;
  --color-border-strong: #404040;
}
```

### 2.2 Font

**File: `app/layout.tsx`**

Load `Be Vietnam Pro` từ `next/font/google` (hỗ trợ đầy đủ dấu tiếng Việt, weights 300-700), fallback `Inter`:
```ts
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
const bodyFont = Be_Vietnam_Pro({ subsets: ["latin", "vietnamese"], variable: "--font-sans", weight: ["300","400","500","600","700"] });
const monoFont = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
```

### 2.3 Logo SVG

**Files mới:**
- `public/logos/logo-light.svg` – logo đỏ trên nền sáng
- `public/logos/logo-dark.svg` – logo trắng/đỏ trên nền tối
- `public/logos/mark-light.svg` – chỉ icon
- `public/logos/mark-dark.svg` – chỉ icon

**Component: `components/brand-logo.tsx`**
- Dùng `next/image` với 2 src
- Size mặc định: icon 44px, full logo 144×36
- Props: `size` ('sm' | 'md' | 'lg'), `variant` ('auto' | 'mark' | 'full'), `tone` ('auto' | 'light' | 'dark')
- Sublabel dành cho admin: "Vietrail Way · Admin"

---

## 3. Roadmap triển khai (12 phases)

Mỗi phase là 1 commit riêng, dễ review, dễ rollback.

### Phase 1 — Token foundation (½ ngày)
**Files:** `app/globals.css`, `tailwind.config` (nếu cần), `app/layout.tsx`
- Cập nhật `@theme inline` với token JD Red mới
- Thêm font Be Vietnam Pro
- Bỏ `.soft-wash` gradient
- Bỏ `text-rose-700` raw trong FormField (sẽ làm ở Phase 5)
- Test: refresh, đảm bảo không vỡ layout hiện tại

### Phase 2 — Logo SVG + Brand component (½ ngày)
**Files:** `public/logos/*.svg`, `components/brand-logo.tsx`, các nơi dùng logo
- Tạo 4 file SVG (light/dark × mark/full)
- Refactor `BrandLogo` component dùng SVG
- Sửa tất cả nơi dùng `vietrail-mark.png` → dùng SVG
- Bỏ `dark:invert` hack

### Phase 3 — Thêm shadcn primitives (1 ngày)
**Command:** `npx shadcn@latest add tabs dropdown-menu tooltip avatar pagination command skeleton sheet`
- Tabs, DropdownMenu, Tooltip, Avatar, Pagination (đầy đủ), Command (palette), Skeleton (chuẩn), Sheet
- Verify shadcn gen ra component dùng token mới (chỉnh nếu cần)

### Phase 4 — Card consolidation (½ ngày)
**Files:** `components/ui/card.tsx`, `components/railway-ui.tsx`, các nơi dùng `surface-panel*` / `quiet-panel`
- Refactor `<Card>` shadcn thành API mới:
  ```tsx
  <Card variant="outlined|elevated|flat" padding="sm|md|lg" interactive>
  ```
- Xóa class `.surface-panel`, `.surface-panel-strong`, `.quiet-panel` trong `globals.css`
- Thay tất cả `surface-panel` → `<Card>`, dùng find-and-replace
- Verify từng page sau khi thay

### Phase 5 — FormField a11y + token (½ ngày)
**Files:** `components/form-field.tsx`, `app/login/page.tsx`, `app/register/page.tsx`, các form admin
- Sửa `text-rose-700` → `text-destructive`
- Thêm `aria-invalid` propagation
- Thêm `aria-describedby` cho hint + error
- Thêm `<RequiredMarker>` cho label bắt buộc
- Verify ở `/login` `/register` `/forgot-password` `/admin` (5 form)

### Phase 6 — Shell split (1 ngày)
**Files mới:**
- `components/shell/public-shell.tsx`
- `components/shell/admin-shell.tsx`
- `components/shell/auth-shell.tsx`
- `components/shell/footer.tsx`
- `components/shell/public-nav.tsx`
- `components/shell/admin-nav.tsx`

**Xóa logic `if (isAdmin)`** trong `app-shell.tsx` hiện tại. Mỗi shell độc lập, dễ test. PublicShell dùng header 2 tầng (logo + nav), AdminShell sidebar fixed collapsible, AuthShell giữ 2 cột nhưng polish.

### Phase 7 — Motion design với GSAP (2 ngày)
**Dependencies:** `npm install gsap @gsap/react`

**Files mới:**
- `lib/motion/gsap-config.ts` – cấu hình GSAP
- `lib/motion/variants.ts` – variants chuẩn (fade-up, stagger, scale-in)
- `lib/motion/scroll-trigger.ts` – hook cho scroll-trigger
- `components/motion/animated-section.tsx` – wrapper dùng GSAP
- `components/motion/page-transition.tsx` – Next.js page transition
- `components/motion/seat-map-interactive.tsx` – seat map với GSAP

**Patterns:**
- Page enter: stagger 0.05s, y-12 → 0, opacity 0 → 1, ease power2.out, duration 0.5
- Card hover: scale 1.02 + shadow lift, duration 0.2
- Stat number: count-up animation khi vào viewport
- Skeleton → content: crossfade 0.3s
- Seat map: highlight seat on hover, animate available → selected, pulse trên seat vừa book

**Không dùng GSAP cho:** hover color, focus ring, button press (để Tailwind transitions làm)

### Phase 8 — Illustrations cho empty states (1 ngày)
**Files mới:** `public/illustrations/*.svg`
- `train-empty.svg` – toa tàu line-art
- `search-empty.svg` – kính lúp + bản đồ
- `order-empty.svg` – vé tàu
- `payment-empty.svg` – thẻ tín dụng
- `error-state.svg` – cờ báo
- `success-state.svg` – checkmark trong vòng tròn

**Component:** `components/illustrations/*.tsx` – React component wrap SVG, nhận `className` cho tone (currentColor).

**Refactor `EmptyState`:** thêm prop `illustration` để chọn illustration tương ứng, kích thước 120×120.

### Phase 9 — Trang quan trọng redesign (4 ngày, chia theo trang)

**9.1 Home `/` (1 ngày)**
- Hero section: tiêu đề lớn 2-3 dòng, sub-text, 2 CTA (Tìm chuyến / Duyệt vé), hero illustration bên phải (SVG tàu Bắc-Trung-Nam abstract)
- Stats strip: 4 số liệu (chuyến mở, chỗ trống, giá thấp nhất, tỉnh thành phục vụ)
- Featured trips: card ngang có ảnh, thông tin, CTA
- Quick actions: 3 card outline với icon outline
- Footer 4 cột đầy đủ (Về chúng tôi, Hỗ trợ, Pháp lý, Liên hệ)

**9.2 Search `/search` (1 ngày)**
- Filter bar ngang (pill style) sticky top, 4 filter: Ga đi, Ga đến, Ngày, Sắp xếp
- Mobile: filter mở dưới dạng sheet
- Results: list card có ảnh tuyến, thời gian, giá, nút "Xem vé"
- Sort/pagination đầy đủ (số trang, prev/next, jump)

**9.3 Ticket detail `/tickets/[id]` (1 ngày)**
- "Ticket card" như vé tàu thật: dashed border, 2 phần (boarding info + passenger info), QR code
- Seat map interactive (nếu có API) – dùng GSAP
- Pricing breakdown rõ ràng
- Sticky purchase bar ở mobile

**9.4 Admin `/admin` (1 ngày)**
- Tabs: Tổng quan / Vé / Đơn / Thanh toán / Người dùng
- Bỏ grid 4 cột StatCard thay bằng tab overview
- Quick actions: dropdown menu thay vì nhiều nút inline
- Search bar dùng Command palette (⌘K)
- Bảng có sort/filter/empty state chuẩn

### Phase 10 — Auth pages polish (½ ngày)
**Files:** `app/login/page.tsx`, `app/register/page.tsx`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`
- Layout 2 cột giữ nguyên, tinh chỉnh typography
- Brand bên trái dùng `BrandLogo` size-lg + tagline
- Form bên phải: error state rõ ràng, success state animation
- Thêm social login button với icon Google (outline style)
- Loading state với spinner

### Phase 11 — A11y + i18n prep (1 ngày)
**Files:** `app/layout.tsx`, mọi component có text
- Skip link "Bỏ qua đến nội dung chính"
- Focus ring rõ (đã có, polish)
- aria-busy cho loading
- aria-label cho icon-only button
- Color contrast verify (≥ 4.5:1 text, ≥ 3:1 border)
- Keyboard navigation test toàn bộ flow
- Chuẩn bị i18n: tách text ra `lib/i18n/vi.ts` (cấu trúc sẵn, chưa tích hợp `next-intl`)

### Phase 12 — Build, test, verify (1 ngày)
- `npm run build` pass
- `npm run lint` pass
- Manual QA: 4 page × 3 breakpoint × 2 theme = 24 screenshot so sánh
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- Keyboard navigation thủ công
- Test responsive 375px, 768px, 1440px
- Test dark mode toàn bộ page
- Viết CHANGELOG.md nội bộ ghi lại breaking changes

---

## 4. Files tham chiếu (sẽ chỉnh sửa)

### Tạo mới (15 files)
```
public/logos/logo-light.svg
public/logos/logo-dark.svg
public/logos/mark-light.svg
public/logos/mark-dark.svg
public/illustrations/train-empty.svg
public/illustrations/search-empty.svg
public/illustrations/order-empty.svg
public/illustrations/payment-empty.svg
public/illustrations/error-state.svg
public/illustrations/success-state.svg
components/shell/public-shell.tsx
components/shell/admin-shell.tsx
components/shell/auth-shell.tsx
components/shell/footer.tsx
components/shell/public-nav.tsx
components/shell/admin-nav.tsx
components/motion/animated-section.tsx
components/motion/page-transition.tsx
components/motion/seat-map-interactive.tsx
lib/motion/gsap-config.ts
lib/motion/variants.ts
lib/motion/scroll-trigger.ts
lib/i18n/vi.ts
```

### Sửa nhiều (20 files)
```
app/globals.css                          ← token refresh
app/layout.tsx                           ← font mới + skip link
components/brand-logo.tsx                ← SVG variant
components/app-shell.tsx                 ← tách thành shell/*
components/auth-shell.tsx                ← moved to shell/
components/railway-ui.tsx                ← thêm illustration prop
components/form-field.tsx                ← token destructive
components/ui/card.tsx                   ← variant mới
components/analytics-chart.tsx           ← polish
components/theme-toggle.tsx              ← tooltip
app/page.tsx                             ← hero redesign
app/search/page.tsx                      ← horizontal filter
app/tickets/page.tsx                     ← list refactor
app/tickets/[id]/page.tsx                ← ticket card design
app/admin/page.tsx                       ← tabs thay grid
app/admin/layout.tsx                     ← dùng AdminShell
app/login/page.tsx                       ← polish
app/register/page.tsx                    ← polish
lib/utils.ts                             ← helper mới
package.json                             ← thêm gsap, @gsap/react
tailwind.config (nếu cần)                ← animation timing
```

---

## 5. Dependencies cần thêm

```json
{
  "dependencies": {
    "gsap": "^3.13.0",
    "@gsap/react": "^2.1.1",
    "class-variance-authority": "^0.7.1"  // đã có
  }
}
```

Shadcn components cần add (qua CLI, không cần package):
- tabs, dropdown-menu, tooltip, avatar, pagination, command, skeleton, sheet, separator, scroll-area, sheet

---

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| GSAP bundle nặng (~70KB) | Import per-component chứ không global, dùng `useGSAP` từ `@gsap/react` |
| Logo SVG tự thiết kế tốn effort | Dùng SVG đơn giản ban đầu (text + shape), polish sau |
| Phá vỡ tính năng hiện tại | Commit từng phase, test sau mỗi phase, có thể rollback 1 commit |
| Dark mode khó đạt 100% | Polish từng page theo thứ tự ưu tiên: home > search > ticket > admin > auth |
| Font Be Vietnam Pro load chậm | Dùng `display: swap`, subset chỉ latin + vietnamese |
| Thiếu asset illustration | Phase 8 ưu tiên 3 illustration quan trọng nhất: train-empty, search-empty, order-empty |

---

## 7. Commit strategy

Mỗi phase = 1 commit, format Conventional Commits:
- `feat(design-system): phase 1 - JD Red token foundation`
- `feat(logo): phase 2 - SVG component với light/dark variant`
- `feat(ui): phase 3 - thêm shadcn primitives (tabs, dropdown, tooltip, ...)`
- `refactor(card): phase 4 - consolidate surface-panel variants`
- `fix(form-field): phase 5 - sửa a11y + destructive token`
- `refactor(shell): phase 6 - tách public/admin/auth shell`
- `feat(motion): phase 7 - GSAP motion design system`
- `feat(illustrations): phase 8 - empty state illustrations`
- `feat(pages): phase 9.1 - home page redesign`
- `feat(pages): phase 9.2 - search page horizontal filter`
- `feat(pages): phase 9.3 - ticket detail với ticket card design`
- `feat(pages): phase 9.4 - admin tabs redesign`
- `polish(auth): phase 10 - login/register/forgot/reset polish`
- `feat(a11y): phase 11 - skip link, focus, i18n prep`
- `chore(release): phase 12 - build + lighthouse + QA`

---

## 8. Verification

Sau mỗi phase: `npm run build` phải pass. Cuối Phase 12:
- Lighthouse: Perf ≥ 90, A11y ≥ 95, BP ≥ 95, SEO ≥ 95 (4 page: /, /search, /tickets/[id], /admin)
- 24 screenshot: 4 page × 3 breakpoint (375, 768, 1440) × 2 theme (light, dark)
- Manual keyboard nav: Tab đi qua mọi focusable, focus ring hiển thị
- Test mobile: filter sheet mở/đóng, ticket card stack dọc, table horizontal scroll
- Test dark mode: từng component đọc được, contrast đủ
- Test GSAP: animation mượt, không giật, không block scroll

---

## 9. Trạng thái plan

- [x] Phase 1: Explore (đã đọc 12 file chính)
- [x] Phase 2: Clarify (user đã chọn: C + JD Red + SVG)
- [x] Phase 3: Generate plan (file này)
- [ ] Phase 4: Notify & chờ user approve

Sau khi approve, sẽ tạo todo list 12 phases và execute từng phase, mỗi phase 1 commit.
