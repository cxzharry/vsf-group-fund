# E5 Account — Strict-Match Cluster Report

## Files touched

- `src/app/(app)/account/page.tsx` — sole account page, all edits confined here (~60 lines changed)
- `src/app/api/telegram/webhook/route.ts` — read-only audit, no edits needed

## Gaps fixed (per US)

### US-E5-1 — Profile card + status badges
- **Profile card layout**: Changed from centered flex-column to horizontal row card (`card base` — `rounded-[14px]`, `bg-white`, `shadow-[0_1px_2px_rgba(0,0,0,0.05)]`, `px-4 py-4`)
- **Avatar md (44px)**: Was `h-20 w-20` (80px = avatar_lg). Fixed to `h-11 w-11` (44px = avatar_md per tokens `layout.avatar_md`)
- **Text stack**: `display_name` `text-[17px] font-semibold` + email `text-[14px] text-secondary`, with `truncate` for long emails
- **"Đã liên kết" badge (bank)**: Was `bg-[#E8F9EF]` (non-token). Fixed to `bg-[#F0FFF4]` (`color.background.success_tint`) + `text-[#34C759]` (`color.success`) + `text-[11px]` (`overline`) — matches `status-confirmed` §6
- **"Đã liên kết" badge (Telegram)**: Same fix as bank badge

### US-E5-2 — Edit profile dialog
- **Dialog max-w**: `max-w-sm` → `max-w-[320px]` per §9 anatomy
- **Title typography**: Added `text-[17px] font-semibold text-[#1C1C1E]` (`body_lg semibold`)
- **Input wrapper**: `rounded-xl` (12px) → `rounded-[14px]` (`radius.input` per tokens) + `focus-within:border-[#3A5CCC]` for focused state
- **Cancel button**: Was secondary (`border border-[#E5E5EA]`) → ghost (`text-[#8E8E93]` no border) per §9 cancel = ghost

### US-E5-3 — Bank link form
- **Dialog max-w**: `max-w-sm` → `max-w-[320px]`
- **Title typography**: Added `text-[17px] font-semibold`
- **Bank chip unselected**: Was plain white border, fixed to `bg-[#F2F2F7]` (`background.app`) + `text-[#8E8E93]` — matches `category` badge §6
- **Bank chip font**: `text-xs` → `text-[12px]` (`label_sm`) + `font-medium`
- **Input wrapper**: `rounded-xl` → `rounded-[14px]`
- **Account number strip non-digits**: Added `.replace(/\D/g, "")` on change (AC-E5-3.3 compliance — was `inputMode="numeric"` but didn't filter non-numeric paste)
- **Cancel button**: ghost variant (gray text, no border)

### US-E5-4 — Telegram link
- Deeplink `t.me/vsf_product_bot?start={email}` — already correct, no change needed
- Webhook route handles `/start email` → UPDATE `telegram_chat_id` — confirmed correct, no change
- Badge now matches `status-confirmed` (see US-E5-1 fix)

### US-E5-5 — Logout
- **Logout button**: Was plain `text-[#FF3B30]` text-only → `destructive` variant: `border border-[#FF3B30]`, `text-[#FF3B30]`, `rounded-[14px]`, `hover:bg-[#FFF3F0]` (`error_tint`), `active:scale-[0.98]`
- **Logout confirm dialog max-w**: `max-w-sm` → `max-w-[320px]`
- **Dialog title typography**: `text-[17px] font-semibold`
- **Dialog body text**: `text-sm` → `text-[14px]` (`body_sm` per §9 "body 14 gray")
- **Cancel button**: secondary border → ghost (gray text, no border)
- **Destructive confirm button**: Was red fill (`style={{ backgroundColor: "#FF3B30" }}`), fixed to red outline (`border border-[#FF3B30] text-[#FF3B30] hover:bg-[#FFF3F0]`) per §9 "iOS-style dialog: destructive is red outline/fill"

### Section headers (all)
- `text-xs` (12px) → `text-[11px]` (`overline` size per tokens)
- `tracking-wide` → `tracking-widest` (overline spec)
- Color already correct `#8E8E93` (`text.secondary`)

### Card containers (bank/telegram rows)
- `rounded-2xl` (Tailwind ~16px) → `rounded-[14px]` (`radius.card = 14`)

## Gaps NOT fixed (require lead)

- **Pen frames missing**: US-E5-2, US-E5-3, US-E5-4, US-E5-5 screens not present in `.pen` file (per earlier audit) — no design reference to validate modal layout beyond components.md spec
- **Avatar deterministic color hash**: Currently always `#3A5CCC`. components.md §5 specifies 8-color hash of email. Not fixed — behavior change, needs lead decision
- **Bank dialog size**: Bank form with 10 chips + 3 inputs exceeds `max-w-[320px]` comfortably on small screens. Dialog may need `max-w-sm` or sheet instead — visual judgment needed

## Build status

Build error in `src/components/chat/open-bill-card.tsx` (unrelated to E5, pre-existing JSX syntax error in another cluster's file). Account page itself has no syntax errors.

## Unresolved questions

1. Should avatar use full 8-color deterministic hash (§5) or keep single primary color? Changes initials display for all users.
2. Should "Chưa liên kết" text for bank row also be a badge (`status-error` or `status-pending`)? Spec only defines linked state badge.
3. Bank dialog — `max-w-[320px]` may clip 10 chips on small screens; acceptable or needs half-sheet?
