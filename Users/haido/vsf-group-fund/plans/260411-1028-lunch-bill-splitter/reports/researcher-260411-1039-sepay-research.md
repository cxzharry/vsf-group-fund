# SePay Research Report: Multi-Payer Bill Splitting Feasibility

## Executive Summary
**SePay is NOT ideal for multi-payer bill splitting.** Its architecture is single-account, single-webhook focused. For a 20-person scenario where anyone can be payer, you'll need workarounds or alternatives.

---

## Key Findings

### 1. Account Model
**Answer:** 1 SePay account per business/app (not per user)

- SePay is designed as a business payment gateway, not a personal account service
- You create one SePay account for your app
- Users don't need SePay accounts—they just pay via their bank transfers
- Source: SePay Bank Hub supports "individual" vs "enterprise" account types at the business level, not per-user

### 2. Bank Account Linking
**Answer:** Multiple bank accounts supported, but unclear if "many"

- Documentation confirms the API can manage multiple linked bank accounts via `bank_account_id` parameter
- Example: "company with webhooks configured for two different bank accounts" mentioned in docs
- **No explicit maximum stated** — could be limited to 2-5 accounts; contact SePay for exact limits
- Source: Webhook API documentation shows multi-account support

### 3. Webhook Scope
**Answer:** Webhooks fire ONLY on transfers TO registered bank accounts

- Webhooks are triggered by real-time bank notifications: "SePay sends a POST request with JSON when new transactions occur"
- Webhook payload includes: transaction ID, bank name, account number, amount, direction (in/out)
- This requires the receiving account to be linked in SePay
- Source: SePay Webhooks API documentation

### 4. Multi-User Scenario (Critical for your use case)
**Answer:** SePay CANNOT auto-detect 20 different payers' accounts simultaneously

- You can link multiple bank accounts (~2-5, unconfirmed max), but SePay is designed for businesses receiving to a fixed set of accounts
- **Workaround required:** Each of the 20 payers would need to transfer to ONE shared account (the app's main account), not their own
- OR: You'd need to link ~20 accounts and create 20 separate SePay integrations (impractical)
- Source: Virtual Account docs explicitly target single-order, single-payer workflows

### 5. Pricing & Limits
**Answer:** Information not publicly available; unclear free tier

- SePay's official website mentions tiered plans but doesn't list specific pricing
- Rate limit: **3 API calls/second** (standard for Vietnamese fintech)
- Retry mechanism: Fibonacci backoff if rate limited
- **Action required:** Contact SePay directly at info@sepay.vn or 02873.059.589 for pricing/limits
- Source: Attempted search yielded no public pricing documentation

---

## Workarounds for Multi-Payer Bill Splitting

### Option 1: Single Shared Account (Simplest)
- One shared bank account receives all payments from all 20 payers
- SePay webhook detects transfers → your app matches amount + reference code to bill
- **Pros:** Single SePay integration, simple webhook handling
- **Cons:** Requires users to transfer to a shared account (UX friction)
- **Feasibility:** High ✓

### Option 2: Multiple SePay Accounts (Scalable but Costly)
- Create separate SePay account for each payer's bank account
- Maintain 20 separate webhook subscriptions + API tokens
- **Pros:** Direct detection of transfers from each payer
- **Cons:** 20x management overhead, likely expensive, SePay may not support this
- **Feasibility:** Low ✗

### Option 3: Alternative Payment APIs
Vietnamese alternatives that may better support multi-account scenarios:

| Provider | Multi-Account Support | Notes |
|----------|----------------------|-------|
| **MoMo** | Limited | Wallet-based; aggregator model |
| **VNPay** | Single account | Bank payment gateway; similar to SePay |
| **ZaloPay** | Limited | Wallet-based; B2C focused |
| **VietQR** | Unified QR | Connects banks + wallets; may not detect transfers |

**None are significantly better than SePay for this use case.** Vietnamese fintech is optimized for B2C, not multi-payer splitting.

### Option 4: Manual Bank Statement Reconciliation
- Have users transfer to shared account
- Poll bank statement API monthly (if available) instead of real-time webhooks
- **Pros:** Works with any bank account
- **Cons:** Not real-time; requires polling architecture
- **Feasibility:** Medium ⚠

---

## Unresolved Questions

1. What is SePay's maximum number of linked bank accounts per account? (Need to contact sales)
2. Does SePay charge per webhook call, per linked account, or fixed fee? (Need pricing page)
3. Can you link the same bank account to multiple SePay accounts? (Likely no, but unconfirmed)
4. Does SePay offer virtual account (VA) splitting features for multi-payer bills? (Documentation suggests no)
5. Are there Vietnamese APIs specifically designed for peer-to-peer payment splitting?

---

## Recommendation

**For your lunch bill splitter:** Use **Option 1 (Single Shared Account)** as the MVP:

1. Create one SePay account with ONE shared bank account
2. All 20 payers transfer to this account (with bill ID in transfer note)
3. SePay webhook triggers on receipt → app matches amount + note to bill
4. Mark debts as settled in real-time

**Limitations to explain to users:**
- They transfer to the app's account (not peer-to-peer)
- Requires slightly higher UX friction ("transfer to shared account")
- Real-time settlement (fast webhook response)

---

**Sources:**
- [SePay Developer Portal - Webhooks API](https://developer.sepay.vn/en/sepay-oauth2/api-webhook)
- [SePay Bank Hub Overview](https://sepay.vn/sepay-bank-hub.html)
- [SePay API Overview & Rate Limits](https://developer.sepay.vn/vi/bankhub/api/tong-quan-api)
- [SePay Virtual Account by Order](https://sepay.vn/en/tai-khoan-ao-theo-don-hang.html)
- [Vietnamese Payment Methods Overview](https://www.transfi.com/blog/vietnams-top-payment-methods-momo-zalopay-vietqr-explained)
- [SePay Bank Hub Improvements Blog](https://sepay.vn/blog/sepay-bank-hub-nang-cap-ket-noi-da-dang-ngan-hang-va-nhanh-chong-hon/)
