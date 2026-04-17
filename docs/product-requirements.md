# NoPay FreeLunch — Product Requirements Document

## Document Information

| Field | Value |
| --- | --- |
| **Product Name:** | NoPay FreeLunch |
| **Version:** | v1.2 |
| **Author(s):** | cxzharry (PO) |
| **Last Updated:** | 2026-04-17 |
| **Status:** | Draft — reformat to avengers-team PRD structure |
| **Live URL:** | https://nopay-freelunch.vercel.app |
| **Public PRD:** | https://nopay-freelunch.vercel.app/prd |

---

## 1. Executive Summary

App chia bill cho nhóm bạn bè tại Việt Nam. Tạo bill nhanh qua chat (AI parse "500k ăn trưa 6 người"), theo dõi nợ ròng giữa các thành viên, chuyển tiền qua VietQR, và gửi thông báo Telegram 2 chiều. Thiết kế mobile-first, 2 tabs only ("Nhóm" + "Tài khoản"), giảm tối đa ma sát so với Splitwise/Zalo-Excel workflow hiện tại của người Việt.

---

## 2. The Customer Problem

### 2.1 Problem Statement

Người Việt hay ứng tiền hộ cho nhóm (ăn trưa team, du lịch, nhậu) nhưng **không có công cụ chia bill native** — đang dùng Excel + Zalo + Momo rời rạc. Kết quả: quên nợ, nhắc nợ ngại, chuyển tiền sai số TK, không biết ai đã thanh toán vs chưa.

**Minh (persona chính)** tạo 4-6 bill/tuần vào đỉnh điểm du lịch; mỗi lần **mất 5-10 phút** gõ Excel + inbox từng người qua Zalo. **Linh (persona phụ)** thường quên nợ 2-3 tuần, phải bị nhắc thủ công.

### 2.2 Customer Evidence

> **⚠️ Cần PO bổ sung dữ liệu quantitative** — dưới đây là observational evidence từ pilot nội bộ + self-dogfooding.

- **Pilot nội bộ (VSF team, Q1 2026):** 15 members active, trung bình **3.2 bill/tuần/nhóm**. Feedback chính: "không phải gõ Excel nữa" + "Telegram notify thay thế Zalo nhắc nợ"
- **Self-dogfooding:** PO + team dùng app cho 8 chuyến team ăn uống Q1 2026 — 0 lỗi chia sai, 100% bill thanh toán < 7 ngày
- **Competitive gap:** Splitwise (chủ đạo global) thiếu VietQR + Telegram + UI tiếng Việt. Tricount thiếu chat input + AI parse
- **Research references:** `plans/reports/researcher-260412-2337-splitwise-complete-feature-audit.md`, `plans/reports/researcher-260412-2338-splitwise-tricount-vs-nopay-comparison.md`

**Unresolved:** cần tiến hành interview ≥5 user thật ngoài VSF team để validate pain points broader + thu số liệu DAU/retention dự kiến.

---

## 3. Target Customers

### 3.1 Primary Persona

- **Primary:** [`personas/group-organizer-vn.md`](../personas/group-organizer-vn.md) — Minh, người tổ chức chia bill nhóm, ứng tiền cho team ăn trưa + du lịch
- **Secondary:** [`personas/group-member-vn.md`](../personas/group-member-vn.md) — Linh, thành viên mắc nợ, cần thanh toán nhanh qua QR

### 3.2 Customer Journey

- **Awareness:** Bạn bè giới thiệu qua Zalo/Telegram sau 1 chuyến du lịch hỗn loạn về chia tiền
- **Research:** So sánh với Splitwise/Tricount → NoPay thắng vì có QR VN + Telegram + tiếng Việt
- **Decision:** Tạo tài khoản bằng email OTP (< 30 giây), không cần signup password lần đầu
- **Onboarding:** Setup avatar + tên + (optional) password → tạo group đầu tiên + mời qua link/QR
- **Success:** Tạo bill < 30 giây, 80% thanh toán qua QR không cần verify, Telegram notify thay thế nhắc nợ thủ công

---

## 4. Solution Overview

### 4.1 Product Vision

> "Chúng tôi tin rằng **các nhóm bạn người Việt hay chia tiền ăn uống/du lịch** cần **một app chia bill native + thanh toán VietQR + Telegram notify** để **không phải nhớ nợ + nhắc nợ thủ công nữa**, vì **80% thao tác hiện tại chạy qua 3 app rời (Excel/Zalo/Momo) vốn không designed cho use case này**."

### 4.2 Key Benefits (Customer Value)

- Tạo bill qua chat nhóm < 30 giây, AI parse số tiền + mô tả tự động
- Nợ ròng tính sẵn — không phải cộng trừ thủ công giữa nhiều bill với cùng 1 người
- Thanh toán 1 tap qua VietQR (đúng bank + số TK + số tiền pre-filled)
- Telegram notify 2 chiều ("bạn nợ", "bạn nhận được", "đã xác nhận") — không cần mở app mỗi lần
- Bill mở cho tình huống "chưa biết ai ăn" — check-in sau rồi chia sau
- Rút gọn nợ (netting) cho chuyến du lịch nhiều bill — gộp nhiều debt thành 1 payment

### 4.3 Platform

- [x] **Web responsive (desktop + mobile browser)** — PWA-lite, Next.js SSR
- [ ] Mobile-first PWA (native install)
- [ ] Native iOS/Android
- [ ] Other

**Rationale:** MVP trên web để iterate nhanh + tránh app store review cycle. Mobile-first responsive design (Tailwind + 2-tab layout) handle cả desktop + mobile browser. PWA installable sau khi stable.

### 4.3a BE/DB Stack

- [ ] Cloudflare Workers + D1 + better-auth
- [x] **Supabase (Postgres + Auth + Storage + Realtime)** — đã implement
- [ ] Other

**Rationale:** Chọn Supabase vì cần Realtime (chat feed + bill card update live), Postgres RLS (per-group access control), mature auth (email OTP + social), và Supabase Storage cho ảnh bill sau này. See [`templates/be-stacks/supabase.md`](../templates/be-stacks/supabase.md).

### 4.4 Epics

3-5 epics MAX. Mỗi epic = capability boundary. User stories chi tiết trong file riêng.

| # | Epic | Brief | Priority | Persona | File |
|---|---|---|---|---|---|
| E1 | Đăng nhập & Onboarding | OTP + password login, 2-step onboarding, branding NoPay | P0 | Minh + Linh | [epic-01-auth.md](epic-01-auth.md) |
| E2 | Nhóm | Tạo/tham gia nhóm, xem Home với debt chip, Group Detail chat view, cài đặt nhóm | P0 | Minh | [epic-02-groups.md](epic-02-groups.md) |
| E3 | Giao dịch | Tạo bill (manual + AI quick parse), chọn người chia, bill mở, chuyển tiền, sửa/xoá bill, phân loại | P0 | Minh | [epic-03-transactions.md](epic-03-transactions.md) |
| E4 | Theo dõi nợ | Banner nợ, nợ ròng, xác nhận thanh toán 2 chiều, rút gọn nợ (netting) | P0 | Minh + Linh | [epic-04-debt-tracking.md](epic-04-debt-tracking.md) |
| E5 | Tài khoản | Hồ sơ, ngân hàng VN, Telegram link, đăng xuất | P0 | Minh + Linh | [epic-05-account.md](epic-05-account.md) |

**Consolidation log:** N/A — 5 epics đã được định nghĩa từ đầu, không có merge.

---

## 5. User Stories & Requirements

User stories chia theo file epic riêng để dễ quản lý + ownership per-feature:

- **E1** → [epic-01-auth.md](epic-01-auth.md) — 5 user stories (US-E1-1 → US-E1-5)
- **E2** → [epic-02-groups.md](epic-02-groups.md) — 5 user stories (US-E2-1 → US-E2-5)
- **E3** → [epic-03-transactions.md](epic-03-transactions.md) — 10 user stories (US-E3-1 → US-E3-10)
- **E4** → [epic-04-debt-tracking.md](epic-04-debt-tracking.md) — 4 user stories (US-E4-1 → US-E4-4)
- **E5** → [epic-05-account.md](epic-05-account.md) — 5 user stories (US-E5-1 → US-E5-5)

**ID convention:** `US-<EpicID>-<n>` (vd `US-E3-1`). Acceptance Criteria: `AC-<EpicID>-<n>.<m>` (vd `AC-E3-1.1`). **Legacy IDs (`US-3.1`)** được migrate — xem [docs/migration-us-id.md](migration-us-id.md) nếu có.

### Post-MVP (Nice-to-Have)

Các user stories chưa ship hoặc defer sau MVP:

- **Post-US-1:** Xuất file chia bill Excel/PDF cho kế toán nhóm / chuyến du lịch (Effort: M)
- **Post-US-2:** Đa ngôn ngữ — English switch cho expat user (Effort: M)
- **Post-US-3:** Tag bill (hashtag trong mô tả) cho filter + analytics (Effort: S)
- **Post-US-4:** Import transactions từ sao kê ngân hàng (Effort: L)
- **Post-US-5:** Group admin role — kick/ban member (Effort: S)
- **Post-US-6:** Push notification (FCM) song song với Telegram notify (Effort: M)

### AC Coverage Summary

> Derived từ epic files. ACs là **functional only** (behavior, state, data) — visual/layout specs thuộc `design-system/`.

- **Total functional ACs:** 117
- **Per epic:** E1=19, E2=18, E3=56, E4=13, E5=11
- **Total stories:** 29 (E1=5, E2=5, E3=10, E4=4, E5=5)

---

## 6. Success Metrics

> **⚠️ Cần PO confirm specific targets** — dưới đây là đề xuất baseline.

### 6.1 Customer Success Metrics

| Metric | Current | Target (6 tháng) |
| --- | --- | --- |
| Thời gian tạo bill (manual flow) | ~60-90s (dự) | **< 30s** |
| Tỷ lệ bill thanh toán < 7 ngày | ~60% (dự) | **> 85%** |
| DAU / WAU ratio | TBD | **> 40%** (indicator of sticky) |
| Tỷ lệ bill dùng AI Quick Parse (US-E3-3) vs Manual | TBD | **> 40%** AI Quick |
| Tỷ lệ user link Telegram bot | TBD | **> 70%** active users |
| Retention tuần 4 (D28) | TBD | **> 50%** |

### 6.2 How We'll Measure

- **Instrumentation:** Supabase analytics + custom events table (`events_log`) — track create_bill, pay_debt, telegram_link, open_bill_details
- **Cadence:** Weekly review trong standup PO + dev; monthly cohort retention analysis
- **Ownership:** PO owns metrics review + định hướng iteration; dev owns instrumentation

**Unresolved:** cần PO confirm 3-5 metric targets cụ thể + timeline đo.

---

## 7. Risks & Assumptions

### 7.1 Key Assumptions We're Making

- User Việt đã quen với chat-based input (AI Quick Parse) — không cần tutorial dài
- Telegram notify đủ để thay thế Zalo — user sẵn sàng link bot (expected > 70%)
- VietQR bankcode coverage đủ cho 10+ bank chính (TCB, VCB, MB, ACB, TPB, VPBank, BIDV, Agribank, Sacombank, Vietinbank)
- Supabase free tier đủ cho < 500 DAU; paid tier ~$25/mo nếu scale
- AI parser regex-based đủ cho 80% input Việt; không cần LLM cho MVP

### 7.2 Risks & Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| AI parse sai số tiền → mất lòng tin | High | User luôn confirm trong Create Bill Sheet trước submit (US-E3-1); edit dễ |
| Telegram bot bị block/spam | Med | Rate limit per user; fallback email notify (Post-MVP) |
| QR mã sinh sai bank/số TK | High | Validate VietQR payload + test với 10 bank chính trước release |
| Supabase downtime | Med | Chấp nhận với MVP; future: multi-region + cached reads |
| User confuse "Chi tiết" vs "Nợ ròng" view (US-E4-4) | Low | Tooltip lần đầu; default "Chi tiết" |
| Bill mở check-in abuse (check nhiều lần, fake) | Low | Unique constraint per user_id + bill_id; admin có thể close bất kỳ lúc nào |

---

## 8. Timeline & Milestones

> **⚠️ Timeline placeholder** — cần PO confirm dates.

| Milestone | Key Deliverables | Target Date |
| --- | --- | --- |
| Research | Persona interviews (5+ user), competitor audit | 2026-Q1 ✅ done |
| Design | `GroupFund.pen` + design tokens | 2026-Q1 ✅ done |
| Build MVP | Epic 1-5 all P0 stories shipped | 2026-04-30 |
| Internal Pilot | VSF team dogfood, 15+ users | 2026-05-15 |
| Beta (external) | 50 beta users, feedback + iterate | 2026-06-01 |
| Public Launch | Open signup, marketing push | 2026-06-30 |

---

## 9. Stakeholders & Team

| Role | Name | Responsibility |
| --- | --- | --- |
| Product Owner | cxzharry (Hai Do) | Vision, PRD, success metrics review |
| Engineering Lead | cxzharry | Next.js + Supabase architecture |
| Design Lead | cxzharry (via Pencil.dev) | `GroupFund.pen`, design tokens |
| Customer Feedback | VSF team (pilot) | Dogfood + feedback loop |
| AI Product Framework | avengers-team workflow | agents + skills + commands |

---

## 10. Scope Boundaries — What We Won't Build (v1)

- ❌ **Native iOS/Android app** — web responsive first
- ❌ **Multi-currency** — VND only for v1
- ❌ **Recurring bills** (tiền nhà hàng tháng auto-split) — Post-MVP
- ❌ **OCR receipt scanning** — type/AI parse only
- ❌ **In-app wallet / escrow** — chỉ sinh QR, không giữ tiền
- ❌ **LLM-powered chat assistant** — regex parser đủ
- ❌ **Group voting / polls** — keep app lean
- ❌ **Expense categories custom** — 6 fixed (an_uong, di_lai, luu_tru, mua_sam, giai_tri, khac)
- ❌ **SMS / email notify** — Telegram only for MVP
- ❌ **Integration với app ngân hàng** — chỉ deep link, không API

---

## 11. PRD Quality Checklist

- [x] New team member understands problem in 2 minutes (section 1 + 2.1)
- [ ] Customer voice present — **partial:** observational, cần interview quotes
- [ ] Success metrics specific and measurable (≥3 with numbers) — **partial:** cần PO confirm targets
- [x] Customer recognizes their problem in description (persona day-in-life)
- [x] Scope boundaries clear (section 10)
- [x] Platform explicitly chosen and justified (4.3)
- [x] Epics defined (5) with brief capability + priority (4.4)
- [x] User stories grouped by Epic ID, correct format (section 5 + epic files)
- [x] Team can start working with this information
- [x] Content in Vietnamese (prose, stories, AC); headers + technical jargon in English
- [ ] Have talked to at least 5 potential users — **pending:** cần mở rộng ngoài VSF team
- [x] Timeline realistic with buffer — **partial:** PO confirm dates

---

## Appendix A — Design System (external)

> Design tokens + component patterns **không** sống trong PRD nữa. Source of truth:
> - `design-system/tokens.json` — raw values (color, spacing, typography, radius, shadow, motion)
> - `design-system/components.md` — component patterns (button, card, sheet, form, etc.)
> - `GroupFund.pen` — visual implementation via Pencil MCP
>
> Design agent + dev agent đọc `design-system/` trực tiếp, KHÔNG đọc PRD cho visual specs.

---

## Appendix B — Logic Chia Bill (shared across epics)

### Chia đều
```
Mỗi người = floor(tổng / số người)
Phần dư → +1 VND cho N người đầu
Nợ: mỗi participant (trừ người trả) nợ người trả
```

### Chia không đều (tuỳ chỉnh)
```
Nhập thủ công mỗi người, tổng PHẢI = tổng bill
```

### Bill mở (US-E3-5)
```
Check-in → đóng bill → mỗi người = floor(tổng / số check-in)
```

### Nợ ròng (US-E4-2)
```
ròng = sum(họ nợ tôi) - sum(tôi nợ họ)
Dương = họ nợ tôi | Âm = tôi nợ họ
```

---

## Appendix C — Thông Báo Telegram (shared)

| Sự kiện | Người nhận | Tin nhắn |
|---------|------------|----------|
| Tạo bill | Người nợ | "Bạn nợ [Người trả] [Số tiền]" |
| Báo đã chuyển | Chủ nợ | "[Người nợ] báo đã chuyển [Số tiền]" |
| Xác nhận | Người nợ | "[Chủ nợ] đã xác nhận nhận [Số tiền]" |
| Bill mở | Nhóm | "[Người tạo] tạo bill mở: [Tiêu đề]" |
| Check-in | Người trả | "[Thành viên] đã check-in" |
| Đóng bill | Người nợ | "Bill đã đóng. Mỗi người: [Số tiền]" |

---

## Unresolved Questions (for PO review)

1. **Customer evidence quantitative** — có interview + survey data từ ≥5 user thật ngoài VSF team không?
2. **Success metrics targets** — số cụ thể cho DAU/WAU, retention D28, AI parse rate? (hiện placeholder)
3. **Launch timeline** — 2026-06-30 public launch có thực tế không?
4. **Pricing model** — free forever hay freemium sau? (chưa có trong PRD)
5. **Post-MVP priority** — thứ tự ship của 6 post-MVP stories?
