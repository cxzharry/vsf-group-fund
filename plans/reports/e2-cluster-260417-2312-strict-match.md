# E2 Groups — Strict-Match Cluster Report

## Files touched

- `src/app/(app)/page.tsx` (+2 / -2 lines — radius + pill bg-color fix)
- `src/app/(app)/groups/create/page.tsx` (+4 / -4 lines — button height/font, card radii)
- `src/app/(app)/groups/[id]/page.tsx` (+8 / -8 lines — icon size, button radius, nav title, delete dialog)
- `src/app/(app)/groups/[id]/settings/page.tsx` (+14 / -14 lines — nav title, all card radii, dialog, inputs)

---

## Gaps fixed (per US)

### US-E2-1 Home (`page.tsx`)

- [x] AC-E2-1.1: 2 tabs only — verified (no changes needed)
- [x] AC-E2-1.2: Card netDebt logic — verified correct
- [x] AC-E2-1.3: topPersonName logic — verified correct
- [x] AC-E2-1.4: Multi-debtor subtitle — verified correct
- [x] AC-E2-1.5: Action buttons — verified present
- [x] AC-E2-1.6: Empty state — verified present
- [x] AC-E2-1.7: Chip shows both owe + owed — verified correct
- [x] Empty state "Tạo nhóm mới" button: `rounded-[10px]` → `rounded-[14px]` (tokens `radius.card = 14`)
- [x] Action chip (Trả nợ / Nhắc nợ): `rounded-xl` → `rounded-full` (Badge/Pill §6 uses `radius.full`), bg `#EEF1FB` → `#EEF2FF` (matches `color.background.primary_tint`)

### US-E2-2 Create Group (`groups/create/page.tsx`)

- [x] AC-E2-2.1: Full-page (not dialog) — verified
- [x] AC-E2-2.2: → "Mời thành viên" step — verified
- [x] AC-E2-2.3: Creator is admin (via API) — verified
- [x] AC-E2-2.4: invite_code created (API) — verified
- [x] AC-E2-2.5: Copy link works — verified
- [x] AC-E2-2.6: "Tạo nhóm" disabled when name empty — verified (`disabled={!name.trim() || submitting}`)
- [x] AC-E2-2.7: Copy feedback (copied state shown) — verified
- [x] AC-E2-2.8: "Vào nhóm ngay" navigates to group detail — verified
- [x] "Tạo nhóm" button: `h-[52px] text-[16px] font-bold` → `h-[54px] text-[15px] font-semibold` (Button.lg spec: h=54, body_lg=17... Note: button uses `body` 15 per lg size table row)
- [x] "Vào nhóm ngay" button: same correction
- [x] Name card radius: `rounded-xl` → `rounded-[14px]` (`radius.card = 14`)
- [x] Emoji card radius: `rounded-xl` → `rounded-[14px]`

### US-E2-3 Join Group

- No owned files for this US (US-E2-3 join dialog handled via `/join/[code]` route — not in file ownership list)

### US-E2-4 Group Detail (`groups/[id]/page.tsx`)

- [x] AC-E2-4.1: Feed shows bills + messages — verified (ChatMessageList renders both)
- [x] AC-E2-4.2: Debt banner correct — verified logic
- [x] AC-E2-4.3: Real-time subscription active — verified (2 Supabase channels)
- [x] AC-E2-4.4: Empty state — verified present
- [x] AC-E2-4.5: Tab bar hidden — verified (this page uses own layout without bottom-nav)
- [x] NavBar title: `text-sm` (14px) → `text-[17px]` (NavBar §7.1: body_lg 17 semibold)
- [x] NavBar subtitle member count: `text-xs` → `text-[13px]` (caption 13)
- [x] Empty state icon: `width/height 48` → `64` (components §11: Empty State icon 72px recommended; 64px chosen as per epic spec "icon receipt 64px #E5E5EA")
- [x] Empty state share button: `rounded-xl` → `rounded-[14px]`
- [x] Delete dialog container: `rounded-2xl` → `rounded-[14px]`
- [x] Delete dialog title: `text-base font-bold` → `text-[17px] font-semibold`
- [x] Delete dialog body: `text-sm text-[#636366]` → `text-[14px] text-[#8E8E93]` (body_sm, text.secondary)
- [x] Delete dialog buttons: `rounded-xl` → `rounded-[14px]`

### US-E2-5 Group Settings (`groups/[id]/settings/page.tsx`)

- [x] AC-E2-5.1: Admin can rename — verified
- [x] AC-E2-5.2: Copy invite code — verified
- [x] AC-E2-5.3: Leave with confirm dialog — verified
- [x] AC-E2-5.4: Non-admin: edit button hidden — verified (`{isAdmin && ...}`)
- [x] NavBar title: `text-base` (16px) → `text-[17px]`
- [x] Group name card: `rounded-2xl` → `rounded-[14px]`
- [x] Invite code card: `rounded-2xl` → `rounded-[14px]`
- [x] Copy button: `rounded-xl` → `rounded-[14px]`
- [x] Member list card: `rounded-2xl` → `rounded-[14px]`
- [x] Leave group button row: `rounded-2xl` → `rounded-[14px]`
- [x] Leave group button: `rounded-2xl` → `rounded-[14px]`
- [x] Name edit input: `rounded-xl` → `rounded-[14px]`
- [x] Name save/cancel buttons: `rounded-xl` → `rounded-[14px]`
- [x] Leave dialog: `items-end` → `items-center` (Dialog §9: center-aligned, not bottom sheet)
- [x] Leave dialog container: `rounded-2xl max-w-sm` → `rounded-[14px] max-w-[320px]` (Dialog §9: max-w-320 mobile)
- [x] Leave dialog title: `text-base font-bold` → `text-[17px] font-semibold`
- [x] Leave dialog body: `text-sm` → `text-[14px]`
- [x] Leave dialog buttons: `rounded-2xl` → `rounded-[14px]`

---

## Gaps NOT fixed (require lead action)

### Pre-existing build error (E3-owned file)
- `src/components/chat/open-bill-card.tsx:108` — JSX comment `{/* ... */}` placed inside conditional expression causes syntax error. **File owned by E3 cluster.** Must be fixed by E3 agent. Build currently fails because of this.
  - Specific issue: line 108 `{/* Check-in CTA: ... */}` is inside `{!hasCheckedIn ? ( ... ) : (...)}` conditional — JSX comment expression not valid there

### Shared UI unchanged (per rules)
- No shared UI primitives required modification

### US-E2-3 no owned file
- `/join/[code]` route not in file ownership list — US-E2-3 AC coverage unverifiable for this cluster

---

## Unresolved questions

1. Button.lg spec in `components.md §1` says height=54 and font=`body_lg` (17px), but that conflicts with "semibold" weight vs the "bold" the old code used. I used `text-[15px] font-semibold` — please confirm if CTA in create flow should be `body` (15) or `body_lg` (17).
2. Empty state icon in US-E2-4 epic spec says "64px" but components.md §11 says "72px" — kept 64px per epic spec. Confirm which wins (design system says 72, epic says 64).
