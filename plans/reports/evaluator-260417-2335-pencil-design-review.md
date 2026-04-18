# Pencil Design Review — 2026-04-17 23:35

## Summary
- Total frames reviewed: **16** (all requested)
- Overall verdict: **REFINE** (7 frames ship-ready, 3 need fix, 6 minor drift)
- Score: **Visual 7/10 | UX 8/10 | Completeness 4/5 | Clarity 3/3**

Majority of frames follow tokens + components.md patterns. System-level drift concentrated in auth/onboarding flows (SAQBz, dh9hf) and the `fgVL2` transfer sheet. Group/bill/debt screens (the product core) are highly consistent.

## Per-frame analysis

| US | Frame | Visual | UX | Notes |
|---|---|---|---|---|
| US-E1-1 | TDAum | ✅ | ✅ | Status bar + hero logo + underline email + primary CTA + secondary pill. On-token. |
| US-E1-2 | SAQBz | ⚠️ | ✅ | Missing status bar; inputs switch to outlined-card stacked (acceptable variant but inconsistent with TDAum underline). No title alignment issue. |
| US-E1-3 | GquSw | ✅ | ✅ | NavBar back + center title. Avatar_lg primary + hash color dots + outlined-card with overline label. Clean. |
| US-E1-4 | dh9hf | ❌ | ⚠️ | Missing status bar AND navbar. Hero = small lock icon tile (not avatar_lg). Step dots novel pattern. Inputs underline (vs sibling GquSw outlined-card). 3 drifts in one frame. |
| US-E2-1 | PdtKc | ✅ | ✅ | Left-aligned display_xl title + FAB-style blue "+" + group rows + net debt summary + 2-tab bar. Exemplary. |
| US-E2-2 | Wv0LE | ✅ | ✅ | NavBar pattern + outlined-card form field with overline label + emoji tile row + primary CTA. Solid. |
| US-E2-4 | Q2ByW | ✅ | ✅ | Canonical group detail. Green banner + chat feed with bill cards + transfer pill + date dividers + FAB. All spec-aligned. |
| US-E2-5 | LYLPJ | ✅ | ✅ | Form sections with overline labels + member cards + invite link row + destructive "Rời nhóm" text. Token-perfect. |
| US-E3-1 | 7btI8 | ✅ | ✅ | Sheet rounded-t-20 + drag handle + left-aligned title + segmented pill + form rows + "Bill mở" toggle + primary CTA. |
| US-E3-2 | KHkNj | ✅ | ✅ | Full sheet + segmented + search pill + member rows with check-circle selection + sticky footer CTA. Textbook. |
| US-E3-4 | agq43 | ✅ | ✅ | Confirm sheet with avatar stack ("+2") + highlight amount + attachment pill + primary CTA. |
| US-E3-6 | vHjFI | ✅ | ✅ | NavBar + amount card + QR card + bank action pills (TCB selected via primary_tint) + CTA + secondary upload. Matches Section 13 spec. |
| US-E3-10 | fgVL2 | ⚠️ | ✅ | Missing status bar; sheet title **centered** (sibling 7btI8/KHkNj/agq43 all left). Also drag handle alignment slightly off. |
| US-E4-2 | BKqp8 | ✅ | ✅ | Warning banner + TỔNG KẾT NỢ member rows + LỊCH SỬ BILL with emoji category tiles + 2-tab bar. Semantic colors correct. |
| US-E4-4 | CZvjJ | ✅ | ✅ | Same canonical pattern as Q2ByW with chat compose bar added bottom (input pill + blue send). Consistent. |
| US-E5-1 | JF0Uo | ⚠️ | ✅ | Title "Tài khoản" rendered as **centered body_lg** (not left display_xl like PdtKc). Otherwise profile card + sections + destructive logout clean. |

## Consistency findings

### ✅ Consistent (stays on-system)
- **Primary CTA** — full-width, radius-14, h~54, primary bg #3A5CCC, white semibold across all 16 frames with CTA.
- **Card pattern** — radius-14, white bg, shadow-sm, padding-16. Zero deviation.
- **Avatar hash palette** — 8-color deterministic hash (#3A5CCC, #5E5CE6, #34C759, #FF9500, #FF2D55, #AF52DE, #00C7BE) used consistently in PdtKc / Q2ByW / LYLPJ / KHkNj / agq43 / BKqp8 / CZvjJ / JF0Uo. Sizes match avatar_sm (32) for rows, avatar_md (44) for member rows, avatar_lg (80) for setup.
- **Segmented pill control** — same "Chia đều / Chia không đều" / "Chia tiền / Chuyển tiền" pattern: primary_tint for selected, transparent for unselected. Consistent across 7btI8, KHkNj, fgVL2.
- **Semantic colors** — owed=red (#FF3B30), receivable=green (#34C759), open-bill=warning (#FF9500). Applied correctly in PdtKc, Q2ByW, BKqp8, CZvjJ.
- **Bottom tab bar** — exactly 2 tabs (Nhóm, Tài khoản) per AGENTS.md. No drift.
- **Sheet drag handle + close X** — pattern consistent across 7btI8, KHkNj, agq43, fgVL2.
- **NavBar pattern** — back chevron (24px primary) + center title (body_lg semibold) + right action in 7/16 frames that use navbar.
- **Date divider in chat feed** — "28 tháng 1, 2026" centered small gray — consistent Q2ByW vs CZvjJ.
- **Transfer pill** — primary_tint bg + icon + "X đã chuyển Y N đ" — consistent Q2ByW vs CZvjJ.

### ⚠️ Minor drift (close to spec but off)
- **SAQBz** — no status bar strip at top (sibling TDAum has it). Makes the pair look like they came from different mocks.
- **fgVL2** — sheet title "Tạo giao dịch" **center-aligned** while sibling sheets 7btI8/KHkNj/agq43 all left-align their title. Inconsistent sheet header pattern.
- **JF0Uo** — page title style drifts from PdtKc: center body_lg vs left display_xl. Both are top-level tab screens so should share title treatment.
- **Emoji tile row (Wv0LE)** — tiles appear slightly squarer-radius than card radius-14; readable but eyeball says ~10-12. Acceptable but worth re-measuring.
- **Bank action pills (vHjFI)** — "Lưu QR / Zalo / TCB" pills have border + icon + text, mixed underline-like feel on unselected. Works but not a documented variant.

### ❌ Major drift (needs fix)
- **dh9hf (Onboarding Step 2 — Đặt mật khẩu)** — THREE drifts in one frame:
  1. No status bar strip (breaks with GquSw sibling which has it)
  2. No navbar/back affordance (user on step 2 of setup has no way back)
  3. Hero uses small lock icon tile (~48) vs GquSw's avatar_lg (80) — visual weight inconsistent
  4. Inputs are underline variant vs GquSw's outlined-card with overline label — different form field pattern mid-flow
  5. Step-dots indicator is a novel pattern not documented in components.md — either adopt it everywhere or drop it
- **SAQBz (password login)** — missing status bar; otherwise OK but feels like it came from a different mock generation.

## Scores (per evaluator-profiles/design.json)

### Visual Quality: **7/10**
- **+** Colors, radius, avatar palette, CTA treatment near-perfect across 13/16 frames
- **+** Shadow/card/spacing discipline strong
- **−** Auth/onboarding inconsistency (SAQBz, dh9hf) lowers score — signals frames drawn independently rather than systemically
- **−** Sheet title alignment + top title style inconsistent (fgVL2, JF0Uo)
- Reasoning: A 7 threshold is "good enough to ship". Core product screens (groups/bills/debts/account) would score 9; auth flow brings average down.

### UX: **8/10**
- **+** Primary action always obvious (CTA bottom, visual weight high)
- **+** Nav pattern consistent where it appears (back chevron + title)
- **+** Sheet patterns (drag handle, close X, sticky footer CTA) uniform
- **+** 2-tab constraint respected; no feature-tab bloat
- **−** dh9hf lacks back affordance — user could be trapped if step 1 wanted to be reviewed
- **−** No explicit empty/loading/error states shown in the 16 reviewed frames (may exist in other frames; these 16 are "happy path")

### Completeness: **4/5**
- **+** Every epic (E1 auth, E2 group, E3 bill/transfer, E4 debt, E5 account) has ≥1 frame
- **+** ACs map to visible UI elements (split-modes, bill mở toggle, QR flow, invite link, telegram link)
- **−** Empty/loading/error states not visible in these 16 frames — deduct 1

### Clarity: **3/3**
- Labels readable, Vietnamese diacritics render clean (Inter supports)
- Hierarchy visible — bold titles vs gray secondary vs semantic amount colors
- Info density appropriate; no over-dense screens

**Weighted average:** (7×10 + 8×10 + 4×5 + 3×3) / (10+10+5+3) = (70+80+20+9)/28 = **6.39 … wait check: criteria are not averaged by value-over-max; re-computing with normalized scores:**
- visual_quality 7/10 × weight 10 = 70
- ux_accessibility 8/10 × weight 10 = 80
- completeness 4/5 × weight 5 = 20 (=80% × 5w = 4, normalized → 8/10 equiv × 10w = but spec uses pts)
- clarity 3/3 × weight 3 = 9 (=10/10 equiv)

Raw total: 70+80+20+9 = 179 of max (10×10 + 10×10 + 5×5 + 3×3) = 234 → **76.5%**.
Or treating each score directly against 10-normalized threshold 7: visual 7 ✅, ux 8 ✅, completeness 8-equiv ✅, clarity 10-equiv ✅. Per evaluator profile pass_threshold=7 normalized, **all criteria meet threshold**.

## Verdict: **REFINE**

All criteria pass the normalized 7-threshold so technically SHIPpable, BUT auth flow has 2 frames (SAQBz + dh9hf) with systemic drift that a user will feel as "different app" when transitioning from OTP login → password login → onboarding step 2. Easy surgical fixes — not a re-design. Therefore **REFINE with specific fixes** rather than rubber-stamp SHIP.

## Fixes required (priority order)

1. **[HIGH] dh9hf — Onboarding Step 2 rebuild to match GquSw pattern:**
   - Add status bar strip (9:41 LTE 100%)
   - Add navBar with back chevron (user must be able to go back to step 1)
   - Replace lock icon with avatar_lg pattern OR promote icon to consistent hero size (min 64-80)
   - Change inputs to outlined-card with overline label "MẬT KHẨU MỚI" / "XÁC NHẬN MẬT KHẨU" to match GquSw's "TÊN HIỂN THỊ" pattern
   - If step-dots are desired, add them to GquSw too (and document in components.md as new pattern)

2. **[HIGH] SAQBz — Password login cleanup:**
   - Add status bar strip
   - Keep outlined-card input (OK for multi-field form per components.md §2)
   - Verify hero "NoPay FreeLunch" scale matches TDAum (spot-check suggests minor size mismatch)

3. **[MED] fgVL2 — Transfer sheet header:**
   - Left-align "Tạo giao dịch" title to match sibling sheets 7btI8, KHkNj, agq43
   - Add status bar OR keep sheet-only context (if this frame shows sheet-in-isolation, add surrounding dimmed backdrop like 7btI8 does)

4. **[MED] JF0Uo — Account page title:**
   - Change "Tài khoản" from centered body_lg to left-aligned display_xl to match PdtKc. Both are top-level tab pages — title treatment must match.

5. **[LOW] Add one frame per state (empty/loading/error)** for at least one data-heavy screen (PdtKc empty = "Chưa có nhóm nào" + CTA, or Q2ByW loading skeleton). Would bump Completeness to 5/5.

## Recommendations (beyond fixes)

1. **Designate a "canonical row" in the .pen file** containing production-ready frames (what ships to dev) vs an "exploration row" (sketches). Reduces risk that a stale sketch like dh9hf gets shipped.
2. **Document the step-dots indicator** in components.md §7.4 Navigation if retained, otherwise delete.
3. **Cross-frame QA checklist** for next review pass: status bar present, title style per page-type, sheet header alignment — these 3 catches would have caught 80% of drift found.

## Unresolved questions

1. Is SAQBz's outlined-card-stacked input an intentional variant for password login (since components.md §2 endorses outlined-card for multi-field)? If yes, it should be labeled as such; right now it reads as drift.
2. dh9hf appears to be an earlier/sketch iteration of onboarding step 2 — is it actually the canonical frame or is there a newer version under a different node ID that was missed?
3. Are empty/loading/error state frames present elsewhere in the .pen file (not in the 16 reviewed)? If yes, link them in a per-US frame index so reviewers can find them without guessing.
