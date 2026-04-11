# QC1 Happy Paths Test Report

**Date:** 2026-04-11T15:48:14.108Z
**Project:** Group Fund App
**Environment:** https://vsf-group-fund.vercel.app

## Summary

- **Total Flows:** 5
- **Passed:** 2 ✅
- **Failed:** 3 ❌
- **Pass Rate:** 40.0%

---

## Test Results

### 1. Flow 1: Authentication

**Status:** ✅ PASS

**Message:** Login, password auth, OTP send, and navigation all working

**Screenshots:**
- gf-qc1-flow1-01-login-page.png
- gf-qc1-flow1-02-otp-sent.png
- gf-qc1-flow1-03-password-mode.png
- gf-qc1-flow1-04-logged-in-home.png

### 2. Flow 2: Groups

**Status:** ❌ FAIL

**Message:** Group "QC Happy Path Group" not found in database or UI. Check group creation API

**Screenshots:**
- gf-qc1-flow2-00-groups-page.png
- gf-qc1-flow2-01-create-dialog.png
- gf-qc1-flow2-02-group-name-filled.png
- gf-qc1-flow2-03-group-created.png
- gf-qc1-flow2-04-after-reload.png

**Error Details:**
```
Error: Group "QC Happy Path Group" not found in database or UI. Check group creation API
    at testFlow2_Groups (/Users/haido/vsf-group-fund/tests/qc1-happy-paths.ts:321:13)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async runAllTests (/Users/haido/vsf-group-fund/tests/qc1-happy-paths.ts:769:5)
```

### 3. Flow 3: Bill Creation via Chat

**Status:** ❌ FAIL

**Message:** No group created in previous flow

**Error Details:**
```
Error: No group created in previous flow
    at testFlow3_BillCreation (/Users/haido/vsf-group-fund/tests/qc1-happy-paths.ts:421:32)
    at runAllTests (/Users/haido/vsf-group-fund/tests/qc1-happy-paths.ts:770:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
```

### 4. Flow 4: Account

**Status:** ✅ PASS

**Message:** Profile, bank, Telegram sections visible; edit dialogs work; logout flow confirmed

**Screenshots:**
- gf-qc1-flow4-01-account-page.png
- gf-qc1-flow4-02-edit-dialog.png
- gf-qc1-flow4-03-bank-edit-dialog.png
- gf-qc1-flow4-04-logout-confirm.png

### 5. Flow 5: Transfer/Payment

**Status:** ❌ FAIL

**Message:** Prerequisites not met (missing group or users from previous flows)

**Error Details:**
```
Error: Prerequisites not met (missing group or users from previous flows)
    at testFlow5_Transfer (/Users/haido/vsf-group-fund/tests/qc1-happy-paths.ts:626:13)
    at runAllTests (/Users/haido/vsf-group-fund/tests/qc1-happy-paths.ts:772:11)
```

## Screenshots Location
All screenshots saved to: `/tmp/gf-qc1-*.png`

## Browser Configuration
- **Type:** Chromium
- **Viewport:** 390x844 (Mobile)
- **Headless:** true

## Key Observations
⚠️ Some flows failed - see details above

---
**Report generated:** 4/11/2026, 10:48:14 PM
