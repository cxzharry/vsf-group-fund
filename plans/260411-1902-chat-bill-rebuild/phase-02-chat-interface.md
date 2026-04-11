# Phase 2: Chat Interface (Screen A)

## Priority: P1 | Status: pending | Effort: 6h
## Depends on: Phase 1

Replace current `src/app/(app)/groups/[id]/page.tsx` with chat-first UI.

## Context
- [Pencil Screen A] Group chat with bill/transfer cards inline
- Current page: static member list, invite code, "Tạo bill" button (170 lines)
- Uses: `MobileHeader`, `Card`, `Avatar`, `Badge` from shadcn

## Key Insights
- Chat messages stored in `chat_messages` table
- Bill/transfer cards are special message types rendered as cards
- Supabase Realtime subscription for live updates
- Must feel like iMessage/Zalo — fast scroll, sticky date dividers

## Requirements

### Header
- Group name + member count
- Settings icon (gear) → navigate to group settings (keep existing member list as settings page)

### Debt Banner
- Sticky below header
- Red banner: "Bạn nợ [name] [amount]" (you owe)
- Green banner: "[name] nợ bạn [amount]" (owed to you)
- Calculated from existing `debts` table where `status != 'confirmed'`
- Tap → navigate to debt detail

### Chat Body
- Scrollable message list, newest at bottom
- Date dividers (sticky): "Hôm nay", "Hôm qua", "12/04/2026"
- Message types:
  - **Text bubble**: sender avatar + name + text + time
  - **Bill card**: orange card with title, amount, split info, tap to expand
  - **Transfer card**: green card with amount, sender→receiver, status
  - **AI response**: system-styled card with parsed info or follow-up options
  - **System**: "Hai đã tạo bill 'Phở'"
- Own messages right-aligned, others left-aligned
- Auto-scroll to bottom on new message

### Input Bar
- Fixed at bottom (above bottom nav)
- Text input with placeholder "Nhắn tin..."
- 🧾 button on right → opens bill creation (old flow as fallback)
- Send button appears when text is non-empty
- On send: insert into `chat_messages`, AI processes if looks like bill intent

### Realtime
- Subscribe to `chat_messages` where `group_id` = current group
- Subscribe to `bill_checkins` for open bill live updates
- Unsubscribe on unmount

## Architecture / File Structure

```
src/app/(app)/groups/[id]/
  page.tsx               — main chat page (orchestrator, <200 lines)

src/components/chat/
  chat-message-list.tsx  — scrollable message list + date dividers
  chat-input-bar.tsx     — input field + send + 🧾 button
  chat-bubble.tsx        — text message bubble
  bill-card.tsx          — inline bill card
  transfer-card.tsx      — inline transfer card
  ai-response-card.tsx   — AI parsed/follow-up card
  debt-banner.tsx        — sticky debt summary banner
```

## Related Code Files
- **Modify**: `src/app/(app)/groups/[id]/page.tsx` — full rewrite
- **Create**: `src/components/chat/` — all new components
- **Modify**: `src/components/bottom-nav.tsx` — hide on group chat? or keep
- **Keep**: `src/components/mobile-header.tsx` — reuse with settings icon

## Implementation Steps
1. Create `src/components/chat/` directory
2. Build `debt-banner.tsx` — query debts, show net balance
3. Build `chat-bubble.tsx` — left/right alignment, avatar, time
4. Build `bill-card.tsx` — orange card, tap handler
5. Build `transfer-card.tsx` — green card
6. Build `ai-response-card.tsx` — placeholder, wired in Phase 3
7. Build `chat-message-list.tsx` — fetch messages, render by type, date dividers
8. Build `chat-input-bar.tsx` — text input, send handler, 🧾 button
9. Rewrite `groups/[id]/page.tsx` — compose all components, Realtime subscription
10. Move existing member list to `groups/[id]/settings/page.tsx`

## Success Criteria
- [ ] Group detail shows chat interface
- [ ] Can send text messages, see them in real-time
- [ ] Date dividers appear correctly
- [ ] Debt banner shows correct net balance
- [ ] Bill/transfer cards render inline (placeholder data ok)
- [ ] Input bar fixed at bottom, doesn't overlap bottom nav
- [ ] Old member list accessible via settings

## Risk
- Mobile keyboard push-up may break layout — test on real device
- Large message history needs pagination (load older on scroll up)
