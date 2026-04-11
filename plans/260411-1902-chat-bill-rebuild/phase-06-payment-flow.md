# Phase 6: Payment Flow (Screen F)

## Priority: P2 | Status: pending | Effort: 4h
## Depends on: Phase 4

Redesigned QR transfer screen matching Pencil Screen F.

## Context
- [Screen F] Full-screen transfer page with VietQR, bank info, action buttons
- Existing: `src/lib/vietqr.ts` has QR URL generation + bank deep links
- Existing: `src/app/(app)/debts/[id]/confirm/page.tsx` has payment confirmation

## Requirements

### Screen Layout (Screen F)
- **Header**: "Chuyển tiền" + back arrow
- **Amount card**: "200.000đ cho Hai" — large, prominent
- **QR code**: VietQR image (existing `generateVietQRUrl`)
- **Bank info block**:
  - Ngân hàng: bank name
  - STK: account number with 📋 copy icon LEFT of number
  - Chủ TK: account holder name
- **3 action buttons** (horizontal row):
  - 💾 Lưu QR (save QR image)
  - 📤 Zalo (share via Zalo deep link)
  - 🏦 TCB (open bank app via `generateBankDeepLink`)
- **CTA**: "Đã chuyển tiền" — orange full-width button
- **Secondary**: "📎 Upload biên lai (tuỳ chọn)" — optional receipt upload

### Navigation
- From chat: tap transfer card → this screen
- From debt list: tap debt → this screen
- From AI parsed transfer intent → this screen

### "Đã chuyển tiền" Flow
1. Update debt status to 'confirmed' or mark partial payment
2. Insert chat_message of type 'transfer_card' into group chat
3. Optional: upload receipt image
4. Navigate back to chat

### Transfer from Chat
- AI detects "chuyển cho Hai 200k" → transfer intent
- Opens this screen pre-filled with: amount, recipient's bank info
- If recipient has no bank info → show "Chưa có thông tin ngân hàng" + prompt to ask them

## Architecture / File Structure

```
src/app/(app)/transfer/[debtId]/
  page.tsx                  — Screen F: QR transfer page

src/lib/
  transfer-actions.ts       — confirm transfer, update debt, insert chat message
```

## Related Code Files
- **Create**: `src/app/(app)/transfer/[debtId]/page.tsx` — new Screen F
- **Create**: `src/lib/transfer-actions.ts`
- **Modify**: `src/app/(app)/debts/[id]/confirm/page.tsx` — redirect to new transfer page
- **Reuse**: `src/lib/vietqr.ts` — QR URL + bank deep links (no changes)

## Implementation Steps
1. Create `transfer-actions.ts`: confirmTransfer(), insertTransferMessage()
2. Build `/transfer/[debtId]/page.tsx`: fetch debt + creditor bank info, render Screen F layout
3. Implement copy-to-clipboard for STK
4. Implement save QR (download image)
5. Implement Zalo share (deep link: `https://zalo.me/share?url=...`)
6. Wire bank app button to `generateBankDeepLink`
7. Wire "Đã chuyển tiền": update debt, insert chat message, navigate back
8. Wire receipt upload (Supabase Storage)
9. Redirect old `/debts/[id]/confirm` to `/transfer/[debtId]`

## Success Criteria
- [ ] QR code displays correctly for creditor's bank
- [ ] Copy STK works
- [ ] Bank app deep link opens correct app
- [ ] "Đã chuyển tiền" updates debt status
- [ ] Transfer card appears in group chat
- [ ] Receipt upload optional and works

## Risk
- Zalo deep link may not work on all devices — fallback to Web Share API
- QR save requires canvas rendering or image download — test cross-browser
