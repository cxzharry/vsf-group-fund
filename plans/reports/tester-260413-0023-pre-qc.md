# QC Pre-check Report — 2026-04-13 00:53

**Test Run**: Hourly pre-deployment verification (mobile viewport)
**App**: https://nopay-freelunch.vercel.app
**Viewport**: 390x844px
**Duration**: ~100 seconds

## Summary

| Metric | Value | Status |
|--------|-------|--------|
| Tests Passed | 15/24 | ✓ |
| Tests Failed | 3/24 | ✗ |
| Tests Skipped | 6/24 | — |
| **Overall Pass Rate** | **62.5%** | — |

## Critical Issue: Create Bill Button Disabled (BLOCKING)

**Severity**: P1 — Prevents core functionality

The "Tạo bill" button appears disabled even when bill data is visible from the AI parser.

```
Element: <button disabled type="button" class="flex h-12 w-full items-center justify-center rounded-xl bg-[#3A5CCC] ...">Tạo bill</button>
Location: Bill confirm sheet modal
Status: disabled attribute present
```

**Steps to reproduce**:
1. Login as creator
2. Submit bill text: "280k bun bo 3 nguoi"
3. Wait for AI parser
4. Button remains disabled

**Root cause investigation needed**:
- Form validation blocking (missing fields?)
- Split data initialization issue
- Async loading blocking button state
- Hidden form errors

---

## Test Results Table

| # | Test | Account | Result | Notes |
|---|------|---------|--------|-------|
| 1 | Login | cxzharry | PASS | Password flow working |
| 2 | Home | cxzharry | PASS | Groups list loaded |
| 3 | Group nav | cxzharry | PASS | Hello group clickable |
| 4 | Chat load | cxzharry | PASS | Spinner cleared |
| 5 | Bill submit | cxzharry | PASS | AI parser triggered |
| 6 | Bill sheet | cxzharry | PASS | Modal displays |
| 7 | Create bill | cxzharry | **FAIL** | Button disabled |
| 8 | Login B | Minh | PASS | Auth OK |
| 9 | Group nav B | Minh | PASS | Access OK |
| 10 | Chat B | Minh | PASS | Feed displays |
| 11 | Debt banner B | Minh | SKIP | No debts (expected) |
| 12 | Transfer B | Minh | SKIP | Blocked by #11 |
| 13 | QR B | Minh | SKIP | Blocked by #12 |
| 14 | Login C | Linh | PASS | Auth OK |
| 15 | Group nav C | Linh | PASS | Access OK |
| 16 | Chat C | Linh | PASS | Feed displays |
| 17 | Debt banner C | Linh | SKIP | No debts (expected) |
| 18 | Transfer C | Linh | SKIP | Blocked by #17 |
| 19 | QR C | Linh | SKIP | Blocked by #18 |
| 24 | Re-login | cxzharry | PASS | Session mgmt OK |
| 25 | Groups list | cxzharry | PASS | Home loads |
| 26 | 2-tab nav | cxzharry | PASS | Spec compliant |
| 27 | Account tab | cxzharry | **FAIL** | Selector not found |
| 28 | Settings btn | cxzharry | **FAIL** | Selector not found |

---

## Features Verified Working

✓ Authentication (password flow)  
✓ Multi-user support (3 accounts)  
✓ Group navigation  
✓ Chat interface  
✓ Message input + AI parsing  
✓ Confirm sheet modal  
✓ Navigation structure (2 tabs only)  
✓ Loading states (spinner management)  

## Features Not Working

✗ Bill creation (button disabled)  
✗ Account page access (selector issue)  
✗ Settings page access (selector issue)  

---

## Screenshots

All saved to `/Users/haido/vsf-group-fund/plans/reports/screenshots/`:

- `cron-pre-qc-home-A.png` — Home page with groups
- `cron-pre-qc-bill-confirm-A.png` — Bill confirm sheet
- `cron-pre-qc-group-Minh.png` — Participant view
- `cron-pre-qc-group-Linh.png` — Participant view

---

## Recommendations

**Immediate**:
1. Check bill confirm form validation in code
2. Verify split initialization from AI parser
3. Test form submission in browser DevTools

**For Next QC**:
- Verify bill creation after P1 fix
- Full debt flow testing
- Account/Settings page verification

## Unresolved Questions

1. Is button supposed to be disabled until user modifies split?
2. Do Account/Settings exist on mobile or desktop-only?
3. Should participants see bills before creator confirms?
