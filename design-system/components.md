# Design System — Component Patterns

**Source of truth cho visual/interaction patterns.** Pencil `.pen` design + React code đều reference file này, KHÔNG reference PRD.

**Pair with:** `design-system/tokens.json` (raw values: color, spacing, typography, radius, shadow, motion).

**Last updated:** 2026-04-17 · **Version:** v1.0 · **Owner:** PO + Design + Dev

## Principles

1. **Mobile-first** — thiết kế từ mobile (430px max-width auth, full-width list), desktop tận dụng space nhưng không đổi component.
2. **iOS Human Interface Guidelines** — tokens palette + radius scale lấy từ iOS (blue #3A5CCC, red #FF3B30, green #34C759).
3. **Vietnamese-first copy** — typography phải support dấu (Inter handles tốt). Không dùng font không hỗ trợ dấu.
4. **KHÔNG modular hoá quá sớm** — component chỉ extract khi reuse ≥2 lần. 3 lần copy cùng pattern là signal cần extract.
5. **Accessibility baseline** — WCAG 2.1 AA contrast (4.5:1 body, 3:1 large text), keyboard nav, focus visible, prefers-reduced-motion.

---

## 1. Button

**Use token:** `color.primary` (bg), `color.text.primary` (text), `radius.card` (14), typography `body_lg` (17) or `body` (15).

### Variants

| Variant | Purpose | Fill | Text | Border |
|---|---|---|---|---|
| `primary` | Main CTA (Tạo, Hoàn tất, Đăng nhập) | `color.primary` | white | none |
| `secondary` | Alt CTA (Nhập mật khẩu) | transparent | `color.text.primary` | `color.border` |
| `tint` | Small action (Trả nợ) | `color.background.primary_tint` | `color.primary` | none |
| `destructive` | Delete/Logout | transparent | `color.error` | `color.error` |
| `ghost` | Text link (Bỏ qua, Quay lại) | transparent | `color.text.secondary` | none |

### Sizes

| Size | Height | Padding X | Font | Use |
|---|---|---|---|---|
| `lg` | 54 | 20 | `body_lg` semibold | Primary CTA full-width |
| `md` | 44 | 16 | `body` medium | Standard action |
| `sm` | 36 | 12 | `body_sm` medium | Inline / chip |

### States

- **Default:** Fill + text per variant
- **Hover** (desktop only): background darken 8% (primary) or bg fade-in (secondary)
- **Active/Pressed:** transform scale(0.98), duration `fast`
- **Disabled:** opacity 0.5, cursor not-allowed, no hover
- **Loading:** text replaced with "Đang…" prefix or spinner icon, disable interaction

### Rules

- **Full-width** khi trong form/sheet (`w-full`). Inline khi trong toolbar.
- **Icon before text** với spacing = 8. Icon size = font size of button.
- Không stack 2 primary buttons. Dùng primary + ghost (Tiếp tục / Bỏ qua).

---

## 2. Input Field

**Use token:** `color.border`, `color.text.primary`, `color.text.tertiary` (placeholder), typography `body` (15), spacing `16`.

### Variants

| Variant | Style | Use |
|---|---|---|
| `underline` | border-bottom only, transparent bg | Email, display name, invite code (minimal forms) |
| `outlined-card` | 1 border + `radius.card` | Multi-field form (password login, bank link) |
| `pill` | `radius.full` bg `color.background.app` | Search, filter |
| `otp` | Large digits, letter-spacing 0.3em, center-align | OTP 6-digit verify |

### Anatomy (outlined-card)

```
┌─ rounded-[14px] border ─┐
│ [Label small gray]      │ ← optional, uppercase overline 11
│ ┌──────────────────────┐│
│ │ Input text 15px      ││ ← y-padding 12-14
│ └──────────────────────┘│
│ [Helper/error 12px]     │ ← optional
└─────────────────────────┘
```

### States

- **Empty:** placeholder `color.text.tertiary`
- **Focused:** border `color.primary` (underline: 2px bottom; outlined: 1px all); helper hidden, error hidden
- **Filled:** text `color.text.primary`
- **Error:** border `color.error`, error message below in `color.error` `caption` (13)
- **Disabled:** bg `color.background.app`, text `color.text.secondary`

### Rules

- **Label vs placeholder:** use label when field purpose is non-obvious (bank account). Placeholder for self-evident (email, tên).
- **Numeric inputs** (amount, OTP): `inputMode="numeric"`, strip non-digits onChange
- **Auto-complete hints:** `autoComplete="email"`, `"new-password"`, `"current-password"`

---

## 3. Card

**Use token:** `color.background.card` (white), `radius.card` (14), `shadow.sm`, spacing `16` (padding).

### Variants

| Variant | Purpose |
|---|---|
| `base` | Static content (profile, section divider) |
| `interactive` | Tap action (group card, bill card) — adds `cursor-pointer` + subtle hover |
| `accent-left` | Status indicator strip on left edge (open bill warning) |

### Anatomy

```
┌─ rounded-[14px] bg-white shadow-sm ─┐
│  padding 16                          │
│  [content]                           │
└──────────────────────────────────────┘
gap 12 between cards
```

### Rules

- **Never stack shadows** — only top-level card has `shadow.sm`
- **Nested lists** inside card: use dividers `color.border` height 1, no extra padding collapse

---

## 4. Sheet (Bottom Sheet)

**Use token:** `radius.sheet_top` (20) top corners only, `shadow.sheet`, backdrop overlay 40% black.

### Variants

| Variant | Height | Use |
|---|---|---|
| `half` | max 85vh | Create bill, member picker, bill details read-only |
| `full` | 100vh - status bar | Picker with search (add people to bill mở) |
| `dialog` | `fit-content`, centered | Confirm dialogs (delete bill, logout) |

### Anatomy (half-sheet)

```
╭─ rounded-t-[20px] bg-white ─╮
│  [drag handle 36x4 gray]     │ ← center top, 8 padding
│  [Header: title + close ✕]   │
│  [Content]                    │
│  ...                          │
│  [Sticky footer CTA]          │ ← safe-area-inset-bottom
╰──────────────────────────────╯
```

### Rules

- **Backdrop tap** closes sheet — no confirm dialog unless data would be lost AND user has typed (rare — usually discard silently)
- **ESC key** closes sheet on desktop
- **Focus trap** inside sheet when open
- **Body scroll lock** when sheet open
- **Drag-to-dismiss** on mobile (touch devices only)

---

## 5. Avatar

**Use token:** `radius.full`, `layout.avatar_md` (44) or `avatar_lg` (80).

### Variants

| Size | Px | Use |
|---|---|---|
| `xs` | 22 | Inline mentions, "người trả" row |
| `sm` | 32 | List row, sender avatar in chat |
| `md` | 44 | Profile card, group card |
| `lg` | 80 | Setup, profile detail |

### Content

- **Image** (if uploaded): fill circle
- **Initial:** uppercase first letter of `display_name` or email prefix
- **Color:** deterministic hash of email → 1 of 8 palette colors (`#3A5CCC, #5E5CE6, #34C759, #FF9500, #FF2D55, #AF52DE, #00C7BE, #FF6B35`)
- **Font:** bold white, size = height * 0.35

### Group avatar (multi-user)

- 2 users: split circle diagonally
- 3+: show 2-3 avatars in stack, last one is count "+N"

---

## 6. Badge / Pill

**Use token:** `radius.full`, typography `overline` (11) or `label_sm` (12).

### Variants

| Variant | Fill | Text | Use |
|---|---|---|---|
| `status-pending` | `color.background.warning_tint` | `color.warning` | "Chờ xác nhận" |
| `status-confirmed` | `color.background.success_tint` | `color.success` | "Đã thanh toán" |
| `status-error` | `color.background.error_tint` | `color.error` | "Quá hạn" |
| `category` | `color.background.app` | `color.text.secondary` | "🍽️ Ăn uống" (emoji + label) |
| `count` | `color.background.primary_tint` | `color.primary` | "Nợ ròng · gộp 3" |
| `new` | `color.primary` | white | "Mới" |

### Anatomy

```
┌─ rounded-full px-2 py-0.5 ─┐
│ 🍽️ Label text              │ ← horizontal padding 8, vertical 2
└────────────────────────────┘
```

---

## 7. Navigation

### 7.1 Top NavBar

**Use token:** `layout.nav_bar_height` (52), `color.background.card`.

Anatomy: `[back chevron (24px)] [Title center] [action right]`

- Back chevron: `color.primary`, 24px stroke icon
- Title: `body_lg` (17) semibold center
- Action: 1-2 icons (24px) or text button

### 7.2 Bottom Tab Bar

**⚠️ App has exactly 2 tabs** (per AGENTS.md): "Nhóm" + "Tài khoản". Do NOT add more.

**Use token:** `layout.tab_bar_height` (56) + safe-area-inset.

Anatomy per tab: icon (24) + label (tiny 10)
- Active: `color.primary` icon + text
- Inactive: `color.text.tertiary` icon + text

### 7.3 Desktop Sidebar

Same 2 items, vertical layout, ≥768px breakpoint.

---

## 8. Form Field (composite)

Combines Label + Input + Helper.

```
[LABEL 11 UPPERCASE GRAY]
[Input]
[Helper/error 12 gray or red]
gap 8 between elements
```

### Rules

- Uppercase label for forms with multiple fields (bank, password)
- Inline label for single-field (login email)
- Helper text is persistent (guidance); error text replaces helper when error

---

## 9. Dialog

Similar to sheet but center-aligned (not bottom). Use for:
- Destructive confirmations (Xoá bill, Đăng xuất)
- Small text inputs (Tham gia nhóm với code)
- Info/alert

### Anatomy

```
┌─ rounded-[14px] bg-white max-w-[320px] ─┐
│  padding 20                               │
│  [Title body_lg semibold 17]              │
│  [Body body 14 gray]                      │
│  [button row: ghost + primary/destructive]│
└───────────────────────────────────────────┘
```

### Rules

- Destructive action on **right** (primary position), cancel on **left** (ghost)
- iOS-style: in action sheet pattern, destructive gets red fill. In dialog pattern, cancel is default gray ghost, destructive is red outline/fill
- Max width 320 mobile, 400 desktop

---

## 10. List / Row

Vertical list of items (groups, bills, debts, members).

### Anatomy

```
┌─ gap 12 between rows ─────┐
│ [Avatar] [Content flex1] [Action] │ ← padding 16
│                                    │
│ ──── border color.border ────      │ ← optional divider
```

- Content area: title `body` (15) semibold + subtitle `caption` (13) gray
- Action area: chevron, amount, badge, or button (sm)
- Tap target entire row (cursor-pointer) if row has action

---

## 11. Status Indicator

### Empty State

```
[Icon 72 gray]
[Title body_lg 17 bold]
[Subtitle body 14 gray center]
[CTA primary button md]
```

### Loading

- Use skeleton rectangles matching final layout (preferred over spinner)
- Spinner only for full-page initial load

### Error

- Inline: red text below field (form validation)
- Toast: top or bottom, auto-dismiss 3s
- Full-page: icon + message + retry CTA

---

## 12. Toast

**Use token:** `radius.md` (10), `shadow.md`, auto-dismiss `motion.duration_ms.slow` * 7 (2800ms).

### Variants

| Variant | Fill | Icon |
|---|---|---|
| `success` | `color.success` | ✓ |
| `error` | `color.error` | ⚠️ |
| `info` | `color.text.primary` | ℹ️ |

Position: top for desktop, bottom for mobile.

---

## 13. QR Code Display

Specific to US-E3-6 transfer.

### Anatomy

```
┌─ Card ──────────────────┐
│ Amount large 32 bold    │
│ "cho Avatar Name"       │
│                         │
│  ┌─────────────┐        │
│  │  QR 200x200 │        │ ← actual QR image
│  └─────────────┘        │
│                         │
│ Bank row + copy icon    │
│ Account row + copy icon │
│ Name row                │
└─────────────────────────┘
```

- Copy icon tap → toast "Đã sao chép"
- QR image: embed amount + account info via VietQR API

---

## 14. Chat Message Feed

Specific to US-E2-4 group detail.

### Item types

- **Text message:** sender avatar + bubble
- **Bill card:** full card inline (see Card.interactive variant)
- **Transfer pill:** compact info chip ("X đã trả Y 100.000đ")
- **System message:** center aligned small gray text
- **Date divider:** center "Hôm nay" / "Hôm qua" / absolute date

Real-time: new items append to bottom, auto-scroll if user at bottom, else show "new messages" indicator.

---

## Dev handoff

- **Tailwind config:** tokens exposed as CSS vars (generate via script from `tokens.json`)
- **React components:** shadcn/ui primitives (`Button`, `Sheet`, `Dialog`) + custom composites (BillCard, DebtBanner, GroupCard, AvatarStack)
- **Custom component location:** `src/components/<domain>/` (chat, auth, group, debt, account)
- **Shared UI primitives:** `src/components/ui/` (shadcn)
- **Icons:** `lucide-react` (default). Emoji for expense categories (flat, no custom icon).

## Pencil `.pen` convention

- Frame naming: `US-E<N>-<M> <title>` for feature screens; `<ComponentName>/<variant>` for reusable components
- Design system frame at canvas origin (x=0, y=0) containing reusable components
- Feature screens right of design system (x ≥ 500)
- Archived: prefix `[archive]` — candidates for delete

---

## Revision log

| Date | Author | Change |
|---|---|---|
| 2026-04-17 | PO + Dev | Initial v1.0 — extracted from PRD UX/UI sections (pre-strip), consolidated to single source of truth |
