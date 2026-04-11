# Phase 7: Integration & Polish

## Priority: P2 | Status: pending | Effort: 4h
## Depends on: All previous phases

Wire everything together, handle edge cases, polish UX.

## Requirements

### Navigation Updates
- Bottom nav "Nhóm" tab → groups list (keep existing)
- Tap group → chat interface (Phase 2, replaces old detail)
- Group settings accessible from chat header gear icon
- Remove old `/bills/new` redirect from group detail — bill creation now through chat
- Keep `/bills` list page for cross-group bill history

### Realtime Subscriptions
- Verify all Supabase Realtime channels:
  - `chat_messages` insert → append to chat
  - `bill_checkins` insert → update open bill card
  - `debts` update → refresh debt banner
- Clean up subscriptions on unmount
- Handle reconnection gracefully

### Telegram Notifications
- New bill created → notify group (existing)
- Open bill created → notify group "Bill mở: [title]"
- Someone checks in → notify bill creator
- Bill closed → notify all participants with amounts
- Transfer confirmed → notify creditor
- Update `src/lib/notifications.ts` + `/api/notify/route.ts`

### Edge Cases
- Empty group (no messages yet) → show welcome state with hint
- User not in group → redirect to groups list
- No bank info for transfer → prompt to add in account settings
- AI parse failure → fallback to manual bill creation (🧾 button)
- Network offline → queue messages locally? Probably YAGNI, just show error toast

### Polish
- Loading skeletons for chat messages
- Smooth scroll to bottom on new message
- Haptic feedback on check-in (if supported)
- Optimistic UI: show message immediately, confirm after insert
- Error toasts for all failure cases

### Cleanup
- Remove unused old bill detail page code if fully replaced
- Ensure `/bills` page still works for cross-group history
- Verify account page bank info still saves correctly
- Test full flow: create group → invite → chat → create bill → pay → confirm

## Implementation Steps
1. Update navigation: group detail → chat, add settings route
2. Wire all Realtime subscriptions with proper cleanup
3. Update notification types and handlers
4. Add loading/empty states
5. Implement optimistic message sending
6. Test full end-to-end flow on mobile viewport
7. Fix any layout issues (keyboard, safe areas, bottom nav overlap)
8. Clean up dead code from old flow

## Success Criteria
- [ ] Full flow works: group → chat → AI parse → bill → pay → confirm
- [ ] Realtime updates work for all message types
- [ ] Telegram notifications fire for all events
- [ ] No dead routes or broken navigation
- [ ] Mobile layout correct with keyboard open
- [ ] Empty/loading/error states handled

## Risk
- Realtime subscription limits on Supabase free tier (check plan)
- Mobile Safari keyboard behavior may need special handling
