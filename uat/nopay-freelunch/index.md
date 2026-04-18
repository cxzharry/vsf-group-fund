# UAT — NoPay FreeLunch

Generated: 2026-04-18
PRD: [`docs/product-requirements.md`](../../docs/product-requirements.md)
Live: https://nopay-freelunch.vercel.app

## Personas (5)

| # | Slug | Display name | Type | Script |
|---|---|---|---|---|
| 1 | group-organizer-vn | Minh — Người tổ chức | Primary | [group-organizer-vn.md](./group-organizer-vn.md) |
| 2 | co-payer-member-vn | An — Member kiêm payer | Primary | [co-payer-member-vn.md](./co-payer-member-vn.md) |
| 3 | group-member-vn | Linh — Member mắc nợ | Secondary | [group-member-vn.md](./group-member-vn.md) |
| 4 | casual-guest-vn | Duy — Khách mới mời | Secondary | [casual-guest-vn.md](./casual-guest-vn.md) |
| 5 | bill-skeptic-vn | Tú — Soi số liệu | Secondary | [bill-skeptic-vn.md](./bill-skeptic-vn.md) |

## Coverage Matrix (Epic × Persona)

| Epic | Minh | An | Linh | Duy | Tú |
|---|:---:|:---:|:---:|:---:|:---:|
| E1 Auth | ✓ | ✓ | ✓ | ✓✓ | ✓ |
| E2 Group | ✓✓ | ✓ | ✓ | ✓✓ | ✓ |
| E3 Bill | ✓✓ | ✓✓ | ✓ | ✓ | ✓✓ |
| E4 Debt | ✓ | ✓✓ | ✓✓ | ✓ | ✓✓ |
| E5 Account | ✓ | ✓ | ✓ | — | ✓ |

✓ = 1 scenario, ✓✓ = multi-scenario focus

## Scenario Totals

- Minh: 5 scenarios (primary-heavy)
- An: 5 scenarios (primary-heavy, nợ ròng focus)
- Linh: 4 scenarios
- Duy: 4 scenarios (onboarding heavy)
- Tú: 4 scenarios (verification + edit)

**Total:** 22 scenarios

## Test Setup

**1 UAT group shared bởi cả 5 personas** — "UAT Team":
- Owner: Minh (group-organizer-vn)
- Members: Minh, An, Linh, Tú (existing), Duy (joins during E1/E2 scenarios)
- Pre-seed data: 0 bills tại t=0. Scenarios add bills sequentially để test state interaction.

## Run Instructions

### Automated (Playwright)
```bash
# Set target
export UAT_TARGET=https://nopay-freelunch.vercel.app

# Run all scenarios (khi Playwright harness sẵn sàng)
npm run uat:playwright
```

### Manual
Mở từng file persona, follow Given/When → assert Then → capture evidence tại `evidence/<scenario-id>/`.

## Pass Criteria

- **SHIP:** ≥80% scenarios pass (17/22), không có Regression watch nào trigger
- **REFINE:** 50-79% pass, bundle fixes + re-run
- **BLOCK:** <50% pass, escalate back to dev

## Evidence

Path convention: `uat/nopay-freelunch/evidence/<persona-slug>-s<N>/` gồm:
- `screenshot.png`
- `console.log`
- `network.har`
- `notes.md` (nếu manual)

## Results

Saved to `uat/nopay-freelunch/results-<YYYY-MM-DD>.json` sau mỗi run.
