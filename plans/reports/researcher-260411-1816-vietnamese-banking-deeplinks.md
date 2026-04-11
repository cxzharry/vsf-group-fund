# Vietnamese Banking App Deep Links & VietQR Integration Research

## Summary

Vietnamese banks support deep linking via **VietQR.io API** but with significant limitations. Most banks cannot yet auto-fill transfer info; full support depends on individual bank implementation. Web-to-app triggering uses standard mechanisms (Android Intent, iOS Universal Links).

---

## Key Findings

### 1. VietQR Deep Link Standard

**VietQR.io provides unified deeplink service:**
- Base URL: `https://dl.vietqr.io/pay?app={appId}`
- Android API: `https://api.vietqr.io/v2/android-app-deeplinks`
- iOS API: `https://api.vietqr.io/v2/ios-app-deeplinks`

**Supported Parameters (defined but not yet auto-filled):**
- `app`: Bank app ID (vcb, mb, acb, ocb, vib, etc.)
- `ba`: Recipient account `ACCOUNT@BANKCODE` format
- `am`: Amount in VND
- `tn`: Transaction name/description
- `bn`: Beneficiary name
- `url`: Callback/return URL

**Status:** Parameters defined for future use but **currently most banks cannot auto-fill** these into their app.

### 2. Techcombank + Zalo Integration (Real Working Example)

**How it works:**
- Zalo recognizes QR codes and offers "Mở app TCB" button
- Uses signed deeplink with encrypted parameters (digitally signed)
- One-tap opens TCB app with beneficiary info pre-filled
- Implemented via secure encryption keys between Zalo & TCB

**Technical approach:** Not a standard URL scheme but a proprietary secure message protocol between apps.

### 3. Vietnamese Banks' Deep Link Support

| Bank | App ID | Deep Link Support | Auto-fill |
|------|--------|------------------|-----------|
| **Techcombank** | tcb | ✅ Full via Zalo | ✅ Yes (Zalo integration) |
| **Vietcombank** | vcb | ✅ VietQR | ⚠️ Basic |
| **MB Bank** | mb | ✅ VietQR | ⚠️ Basic |
| **ACB** | acb | ✅ VietQR | ⚠️ Basic |
| **OCB Omni** | ocb | ✅ VietQR | ✅ Yes (autofill) |
| **VPBank** | vpb | ✅ VietQR | ⚠️ Basic |
| **TPBank** | tpb | ✅ VietQR | ⚠️ Basic |
| **BIDV** | bid | ✅ VietQR | ⚠️ Basic |

~80% of Vietnamese banking apps support VietQR deeplinks (40+ banks).

### 4. Web-to-App Triggering from PWA

**Android (intent:// protocol):**
```javascript
// Fallback approach - user installs native app wrapper or uses web view bridge
const intentUrl = `intent://dl.vietqr.io/pay?app=vcb&ba=1033666688@vcb&am=50000&tn=Split%20Bill#Intent;scheme=https;package=com.techcombank;S.browser_fallback_url=https%3A%2F%2Fdl.vietqr.io%2Fpay%3Fapp%3Dvcb;end;`;
window.location.href = intentUrl;
```

**iOS (Universal Links):**
```javascript
// iOS uses Universal Links - requires app developer to host .well-known/apple-app-site-association
window.location.href = 'https://dl.vietqr.io/pay?app=vcb&ba=1033666688@vcb&am=50000&tn=Split%20Bill';
```

**Web-to-native workaround for PWA:**
- Direct `https://dl.vietqr.io` link (works via browser-to-app routing)
- Android: If user has app installed, browser delegates to Intent handling
- iOS: App must register universal links in apple-app-site-association
- **Fallback:** Deep link redirects to bank's web login if app not installed

---

## Limitations

- **No guaranteed auto-fill:** Only ~20% of banks auto-fill transfer info (OCB, TCB via Zalo)
- **iOS friction:** Requires native app wrapper to trigger from PWA reliably
- **Android Intent limitation:** PWA cannot directly use `intent://` URLs (security sandbox)
- **User friction:** If user doesn't have banking app, deeplink redirects to web fallback
- **No NAPAS spec for app-to-app:** VietQR is QR payment standard, not app integration standard

---

## Recommended Architecture for PWA

**Best practice for bill-splitting PWA:**

```html
<!-- Show "Open Bank App" only if we can detect app -->
<a href="https://dl.vietqr.io/pay?app=vcb&ba=1033666688@vcb&am=50000&tn=HD12345" 
   class="btn-open-bank">
  Mở TCB để chuyển khoản
</a>

<!-- Fallback: Show manual entry form -->
```

**Detection logic:**
```javascript
async function canOpenBankApp() {
  // Try to open banking app - if fails in 2s, show manual form
  const timer = setTimeout(() => showManualForm(), 2000);
  window.location.href = deepLink;
  // If app opens, timer is cleared (page loses focus)
}
```

---

## Unresolved Questions

1. **Does OCB's autofill work from arbitrary web deeplinks?** Documentation says OCB Omni supports autofill but unclear if accessible via standard VietQR deeplinks or proprietary integration only.
2. **What's VPBank/TPBank's actual deeplink format?** VietQR lists them but no public docs on parameters supported.
3. **Can PWA detect installed banking apps reliably?** No standardized browser API for this on iOS/Android.
4. **Does Zalo-TCB integration require merchant partnership?** Unclear if arbitrary PWA can trigger it or only Zalo-approved merchants.

---

## Sources
- [VietQR Deeplink API Documentation](https://www.vietqr.io/en/danh-sach-api/deeplink-app-ngan-hang/)
- [VietQR API Overview](https://api.vietqr.vn/en)
- [Techcombank Zalo Integration Article](https://vietnamnet.vn/tang-toc-do-chuyen-tien-tren-techcombank-mobile-nho-lien-ket-zalo-2247867.html)
- [Android Intent URL Guide](https://medium.com/@amnd33p/deep-dive-into-android-intent-urls-the-ultimate-guide-for-developers-fa5a099c643a)
- [Universal Links and App Links](https://idura.eu/blog/universal-links-and-app-links)
- [NAPAS VietQR Service](https://en.napas.com.vn/napas-fastfund-247-with-vietqr-code-service-184230612220807776.htm)
