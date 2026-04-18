# Splitwise & Tricount vs NoPay FreeLunch — Feature Gap Analysis

**Date:** 2026-04-12 | **Sources:** Splitwise research, Tricount research, internal gap analysis

---

## Summary

| Category | Splitwise | Tricount | NoPay FreeLunch |
|----------|-----------|----------|-----------------|
| Bill split types | 5 (equal/percent/shares/exact/multiple payers) | 4 (equal/custom/percent/parts) | 3 (equal/percent/custom) |
| Group features | Types, archive, simplify debts | 50 members, no-account guests, archive | Basic create/join/settings |
| Debt settlement | Simplify debts algo, Venmo/PayPal/Splitwise Pay | Simplify debts, bunq integration | VietQR, manual confirm |
| Categories | 20+ preset | Preset + custom | None |
| Analytics | Pro: charts, trends, export | None (removed) | None |
| Notifications | Push + email + reminders | Push + reminders | Telegram only |
| Offline | Yes | Yes (full) | No |
| OCR/Receipt | Pro: scan + itemize | Photo only | Stub (not functional) |
| Multi-currency | 100+ with conversion | Yes with auto-conversion | VND only |
| Chat/Social | Comments on expenses | None | Full in-app chat + AI parser |
| Cost | Free (limited) + Pro $3/mo | 100% free | 100% free |

---

## MISSING FEATURES — Priority Ranked

### P0 — Core Gaps (Both competitors have, we don't)

| # | Feature | Splitwise | Tricount | Effort | Impact |
|---|---------|-----------|----------|--------|--------|
| 1 | **Simplify debts algorithm** | Core feature | Core feature | HIGH | HIGH |
|   | Minimize # of transfers needed to settle. A owes B $20, B owes C $20 → A pays C $20 directly. Our app tracks individual debts without simplification. | | | | |
| 2 | **Expense categories** | 20+ preset | Preset + custom | MED | MED |
|   | Tag bills with category (food, transport, rent, etc). Enable filtering + future analytics. | | | | |
| 3 | **Edit/delete expenses** | Full edit history | Yes | MED | HIGH |
|   | Users can modify or remove bills after creation. We have no edit/delete bill UI. | | | | |
| 4 | **Offline support** | Mobile offline | Full offline | HIGH | MED |
|   | Add expenses without internet, sync when online. We require connection. | | | | |
| 5 | **Recurring expenses** | daily/weekly/monthly/yearly | Mentioned | MED | MED |
|   | Auto-generate bills on schedule (rent, utilities, subscriptions). | | | | |

### P1 — Important Gaps (One competitor has, high user value)

| # | Feature | Who has it | Effort | Impact |
|---|---------|------------|--------|--------|
| 6 | **Receipt photo upload (functional)** | Both | LOW | MED |
|   | Our "Them anh bill" and transfer receipt upload are stubs. Need actual Supabase storage upload. | | | |
| 7 | **Multi-currency support** | Both | HIGH | MED |
|   | Add expenses in USD/EUR/etc, auto-convert to VND. Critical for travel groups. | | | |
| 8 | **Data export (CSV/PDF)** | Splitwise Pro | Tricount (removed) | LOW | LOW |
|   | Export group expenses for accounting/tax. | | | |
| 9 | **No-account participants** | Tricount | - | MED | MED |
|   | Tricount lets people join without creating account. Our app requires full signup. | | | |
| 10 | **Group archive** | Both | LOW | LOW |
|   | Archive completed trips/groups, preserve history, disable edits. | | | |

### P2 — Nice-to-Have (Competitive advantages, lower urgency)

| # | Feature | Who has it | Effort | Impact |
|---|---------|------------|--------|--------|
| 11 | **Receipt OCR scanning** | Splitwise Pro | - | HIGH | MED |
|   | Scan receipt photo → auto-detect items + amounts. Our AI parser handles chat text, not images. | | | |
| 12 | **Itemized receipt splitting** | Splitwise Pro | - | HIGH | MED |
|   | Break receipt into line items, assign each item to specific people. | | | |
| 13 | **Analytics/charts** | Splitwise Pro | - | MED | LOW |
|   | Spending by category, trends over time, pie charts. | | | |
| 14 | **Payment integrations** | Splitwise (Venmo/PayPal) | Tricount (bunq) | HIGH | MED |
|   | We have VietQR which is good for VN market. Consider MoMo/ZaloPay integration. | | | |
| 15 | **Push notifications** | Both | MED | MED |
|   | We use Telegram only. Native push via service worker would reach more users. | | | |
| 16 | **Multiple payers** | Splitwise | - | MED | LOW |
|   | Single expense paid by multiple people (e.g., 2 people split the payment). | | | |
| 17 | **Shares-based split** | Splitwise | Tricount (parts) | LOW | LOW |
|   | Split by "shares" (e.g., 2 shares vs 1 share) rather than exact amounts. | | | |

---

## OUR UNIQUE ADVANTAGES (Competitors don't have)

| Feature | Description |
|---------|-------------|
| **In-app group chat** | Full chat feed per group. Splitwise has comments only, Tricount has none. |
| **AI chat-to-bill parser** | Type "500k an trua 6 nguoi" → auto-parse amount/description/people. Neither competitor has this. |
| **Bill mo (Open Bill)** | Check-in style bills where people join before amount is split. Unique workflow. |
| **VietQR deep integration** | QR code with bank info for instant VN bank transfers. Localized advantage. |
| **Telegram notifications** | Direct to user's Telegram — no app install needed for notifications. |
| **100% free, no ads** | No paywall, no daily limits, no ads. Splitwise limits free users to 5/day. |

---

## EXISTING BUGS TO FIX (from gap analysis)

| Priority | Issue | File |
|----------|-------|------|
| P1 | Open bill remainder +1 VND distribution missing | groups/[id]/page.tsx |
| P1 | Telegram notify missing for check-in/close-bill | groups/[id]/page.tsx + api/notify |
| P2 | QR save downloads URL string, not image blob | transfer/[debtId]/page.tsx |
| P2 | No "pending confirmation" state on debt banner | groups/[id]/page.tsx |
| P3 | Invite page QR is placeholder, not real | groups/create/page.tsx |
| P3 | Receipt upload stub on bill confirm + transfer | bill-confirm-sheet.tsx + transfer |

---

## RECOMMENDED ROADMAP

### Sprint 1 — Fix existing bugs (P1-P2)
- Fix remainder distribution in open bill close
- Wire Telegram notifications for check-in/close events
- Fix QR save to download actual image
- Add pending confirmation state to debt banner
- **Metrics:** All 19 US stories DONE (currently 12 DONE, 4 PARTIAL)

### Sprint 2 — Core missing features
- Expense categories (tag bills, filter by category)
- Edit/delete bills UI
- Functional receipt photo upload (Supabase storage)
- Shares-based split mode
- **Metrics:** Bill creation flow covers 5 split types, category usage rate

### Sprint 3 — Competitive features
- Simplify debts algorithm (minimize transfers)
- Recurring expenses
- Group archive
- Data export (CSV)
- **Metrics:** Average # of transfers reduced by simplify algo, recurring bill adoption rate

### Sprint 4 — Advanced
- Multi-currency support with conversion
- Receipt OCR scanning
- Offline support (service worker + IndexedDB)
- Push notifications (web push)
- **Metrics:** Load time, offline capability, notification delivery rate

---

## Unresolved Questions

1. Should we implement Splitwise's "simplify debts" algorithm? It's their #1 differentiator but adds complexity to our simple per-bill debt model.
2. Should we support no-account participants like Tricount? Would require guest token system.
3. Are the EXTRA pages (/bills, /debts list, /activity, /summary) intentional or scaffolding to remove?
4. Should "Nhac no" button trigger actual Telegram reminder? Currently just navigates.
5. Priority of MoMo/ZaloPay integration vs expanding VietQR coverage?
6. Should we add expense comments/reactions or rely on chat messages within groups?
