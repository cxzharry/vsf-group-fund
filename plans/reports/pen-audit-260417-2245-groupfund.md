# GroupFund.pen Frame Audit — 2026-04-17

## Summary
- Total top-level nodes: **72** (frames + labels + notes)
- Top-level **frames: 46**
- Labels (text tags on canvas): 16 · Notes (design notes): 10
- **Archived / move-out frames: 5** (prefix `[archive]` hoặc `[move out]`)
- **Active frames: 41**
- **Frames named by legacy US ID: 39** (`US-<M.N>` pattern)
- **Active frames needing rename** to new `US-E<N>-<M>` IDs: **39**
- **Active frames not mapped to any legacy US ID: 5** (the `Debts / 1..5` set — matches US-E3-6 + US-E4-3 flow)
- **Stories with zero frame coverage (MISSING): 6** trên tổng 28 PRD stories → xem mục Missing list

Legacy → new ID map: `US-1.x → US-E1-x` · `US-2.x → US-E2-x` · `US-3.x → US-E3-x` · `US-4.x → US-E4-x` · `US-5.x → US-E5-x`.

---

## Frame inventory (per user story)

### Epic 1 — Auth (5 stories)

| New US ID | Legacy name | Frame ID | State | Action |
|---|---|---|---|---|
| US-E1-1 (Đăng nhập bằng OTP) | `US-1.1 Đăng nhập` | `TDAum` | active | rename → `US-E1-1 Đăng nhập bằng OTP` (verify OTP flow inside; otherwise treat as login landing) |
| US-E1-2 (Đăng nhập bằng mật khẩu) | — | — | **MISSING** | new frame |
| US-E1-3 (Onboarding — Avatar & Tên) | `US-1.3 Onboarding` | `GquSw` | active | rename → `US-E1-3 Onboarding Step 1 — Avatar & Tên`; verify content actually covers Step 1 only |
| US-E1-4 (Onboarding — Đặt mật khẩu) | — | — | **MISSING** | new frame (onboarding Step 2) |
| US-E1-5 (Branding màn Login) | — | — | **MISSING** (có thể đã nằm trong `TDAum`) | cân nhắc tách subframe hoặc thêm variant |

Ghi chú: Legacy `US-1.1 Đăng nhập` có thể đã gộp cả input SĐT + input OTP + branding vào 1 frame. Cần inspect internal children trước khi quyết định split thành 3 US frames riêng.

### Epic 2 — Groups (5 stories)

| New US ID | Legacy name | Frame ID | State | Action |
|---|---|---|---|---|
| US-E2-1 (Xem danh sách nhóm — Home) | `US-2.1 Xem danh sách nhóm` | `PdtKc` | active | rename → `US-E2-1 Home — Danh sách nhóm` |
| US-E2-1 (Empty variant) | `US-2.1 Xem danh sách nhóm (Empty)` | `aHDw9` | active | rename → `US-E2-1 Home — Empty` |
| US-E2-2 (Tạo nhóm — Step 1) | `US-2.2 Tạo nhóm (Step 1)` | `Wv0LE` | active | rename → `US-E2-2 Tạo nhóm — Step 1` |
| US-E2-2 (Tạo nhóm — Step 2 Mời) | `US-2.2 Tạo nhóm (Step 2 - Mời)` | `Q5Mrb` | active | rename → `US-E2-2 Tạo nhóm — Step 2 Mời` |
| US-E2-3 (Tham gia nhóm dialog) | — | — | **MISSING** | new frame (Join-by-code dialog) |
| US-E2-4 (Xem Group Detail — Chat) | `US-2.4 Xem Group Detail` | `a1dCR` | active | rename → `US-E2-4 Group Detail (v1 — chat)` hoặc archive (xem variants) |
| US-E2-4 (v2) | `US-2.4 Xem Group Detail (v2)` | `eIXWI` | active | rename hoặc archive — giữ 1 canonical |
| US-E2-4 (v3) | `US-2.4 Xem Group Detail (v3)` | `Q2ByW` | active | rename → `US-E2-4 Group Detail (canonical)` nếu là final |
| US-E2-4 (Empty) | `US-2.4 Group Detail (Empty)` | `KoKtg` | active | rename → `US-E2-4 Group Detail — Empty` |
| US-E2-5 (Cài đặt nhóm) | `US-2.5 Cài đặt nhóm` | `LYLPJ` | active | rename → `US-E2-5 Cài đặt nhóm` |

Ghi chú: có **3 versions** của US-2.4 đang cùng tồn tại (`a1dCR`, `eIXWI`, `Q2ByW`) — cần quyết định canonical và archive 2 cái còn lại để tránh drift.

### Epic 3 — Transactions (9 stories)

| New US ID | Legacy name | Frame ID | State | Action |
|---|---|---|---|---|
| US-E3-1 (Create Bill Sheet — blank) | `US-3.1 · Create Bill Sheet (blank)` | `7btI8` | active | rename → `US-E3-1 Create Bill Sheet (blank)` |
| US-E3-1 (focus Mô tả) | `US-3.1 · Tap Mô tả (focus)` | `sG2yc` | active | rename → `US-E3-1 Create Bill — Focus Mô tả` |
| US-E3-1 (focus Số tiền) | `US-3.1 · Tap Số tiền (focus)` | `vN1dh` | active | rename → `US-E3-1 Create Bill — Focus Số tiền` |
| US-E3-1 (Confirm filled) | `US-3.1 · Confirm (all filled)` | `0DCh2` | active | rename → `US-E3-1 Create Bill — Confirm state` |
| US-E3-1 / US-E3-5 (Bill mở ON) | `US-3.1 · Bill mở ON (ẩn Chia cho)` | `kYFwv` | active | **DUPLICATE** với `7XoHZ` (cùng tên, cùng x/y) — giữ 1, xoá 1 |
| US-E3-1 / US-E3-5 (Bill mở ON) | `US-3.1 · Bill mở ON (ẩn Chia cho)` | `7XoHZ` | active | duplicate của `kYFwv` — xoá |
| US-E3-2 (Member Picker — chia đều) | `US-3.2 · Case A: Default (chia đều)` | `KHkNj` | active | rename → `US-E3-2 Member Picker — Case A chia đều` |
| US-E3-2 (Case E payer không tham gia) | `US-3.2 · Case E: Payer không tham gia` | `QsGlF` | active | rename → `US-E3-2 Member Picker — Case E` |
| US-E3-2 (Case B,C,D) | — | — | **MISSING** (chỉ có A + E) | cân nhắc add B/C/D nếu PRD cần |
| US-E3-3 (AI Chat typing) | `US-3.3 · AI Chat typing` | `K2ZUg` | active | rename → `US-E3-3 AI Quick Parse — Typing` |
| US-E3-3 (AI Parsed → prefilled) | `US-3.3 · AI Parsed → Create Sheet prefilled` | `zLhAX` | active | rename → `US-E3-3 AI Quick Parse — Prefilled` |
| US-E3-3 (AI Missing data follow-up) | `US-3.3 · AI Missing data → Follow-up` | `cb0z1` | active | rename → `US-E3-3 AI Quick Parse — Follow-up` |
| US-E3-4 (Bill Details & Actions) | `US-3.4 · Bill Card (in Group Detail feed)` | `agq43` | active | rename → `US-E3-4 Bill Card (feed)`; cần thêm frame Bill Detail full view nếu PRD yêu cầu |
| US-E3-5 (Bill mở — Waiting) | `US-3.5 · Bill mở (Waiting)` | `pwKfX` | active | rename → `US-E3-5 Bill mở — Waiting` |
| US-E3-5 (Bill mở — Add People) | `US-3.5 · Bill mở (Add People)` | `ifwvo` | active | rename → `US-E3-5 Bill mở — Add People` |
| US-E3-6 (Chuyển tiền / QR) | `US-3.6 · Chuyển tiền QR` | `vHjFI` | active | rename → `US-E3-6 Chuyển tiền QR` |
| US-E3-6 (payment flow, legacy "Debts /" set) | `Debts / 3 - Chon cach tra` | `tNaxH` | active | rename → `US-E3-6 QR — Chọn cách trả` (method picker) |
| US-E3-6 (QR confirm) | `Debts / 4 - Xac nhan QR` | `SYKmX` | active | rename → `US-E3-6 QR — Xác nhận` |
| US-E3-7 (Xoá bill — menu) | `US-3.7 · Menu ⋯ trên bill card` | `NMnwu` | active | rename → `US-E3-7 Xoá bill — Menu ⋯` |
| US-E3-7 (Confirm dialog) | `US-3.7 · Confirm dialog xoá` | `o7IOE` | active | rename → `US-E3-7 Xoá bill — Confirm dialog` |
| US-E3-8 (Sửa bill — edit mode) | `US-3.8 · Sửa bill (edit mode)` | `Xnslw` | active | rename → `US-E3-8 Sửa bill — Edit mode` |
| US-E3-8 (Badge Đã sửa) | `US-3.8 · Badge Đã sửa trên card` | `2b8ui` | active | rename → `US-E3-8 Sửa bill — Badge Đã sửa` |
| US-E3-9 (Category picker in sheet) | `US-3.9 · Category chip picker trong sheet` | `wQJpg` | active | rename → `US-E3-9 Categories — Chip picker (sheet)` |
| US-E3-9 (Category badge on card) | `US-3.9 · Category badge trên bill card` | `osjt2` | active | rename → `US-E3-9 Categories — Badge on card` |

Ghi chú:
- `kYFwv` và `7XoHZ` có cùng name, cùng toạ độ (x=1948, y=6190) — **rõ ràng duplicate**, delete một cái (giữ `kYFwv` vì xuất hiện trước trong list).
- Epic 3 còn 6 Transactions stories có multiple frame variants → không thiếu story, chỉ thiếu sub-variants.

### Epic 4 — Debt Tracking (4 stories)

| New US ID | Legacy name | Frame ID | State | Action |
|---|---|---|---|---|
| US-E4-1 (Banner nợ) | — | — | **MISSING** (có thể là component trong Home `PdtKc`, cần tách) | add frame hoặc extract thành component |
| US-E4-2 (Tính nợ ròng — list view) | `Debts / 1 - Danh sach no` | `BKqp8` | active | rename → `US-E4-2 Danh sách nợ ròng` |
| US-E4-2 (Chi tiết khoản nợ) | `Debts / 2 - Chi tiet khoan no` | `CD28E` | active | rename → `US-E4-2 Chi tiết khoản nợ` |
| US-E4-3 (Xác nhận thanh toán 2 chiều) | `Debts / 5 - Hoan tat gach no` | `jVOBD` | active | rename → `US-E4-3 Xác nhận gạch nợ 2 chiều` |
| US-E4-4 (Rút gọn nợ — netting mode) | `US-4.4 · Debts mode Chi tiết` | `CZvjJ` | active | rename → `US-E4-4 Debts — Chi tiết mode` |
| US-E4-4 (Debts mode Nợ ròng) | `US-4.4 · Debts mode Nợ ròng` | `Kqeqv` | active | rename → `US-E4-4 Debts — Nợ ròng mode` |

Ghi chú: cụm `Debts / 1..5` đang chia chức năng giữa Epic 3 (QR/payment) và Epic 4 (list nợ/xác nhận). Cần quyết định clean ownership trước khi rename.

### Epic 5 — Account (5 stories)

| New US ID | Legacy name | Frame ID | State | Action |
|---|---|---|---|---|
| US-E5-1 (Xem thông tin tài khoản) | `US-5.1 Tài khoản` | `JF0Uo` | active | rename → `US-E5-1 Tài khoản` (canonical) |
| US-E5-1 (v2 variant) | `US-5.1 Tài khoản (v2)` | `EnbuG` | active | rename → `US-E5-1 Tài khoản (v2)` hoặc archive nếu đã chọn canonical |
| US-E5-2 (Sửa tên hiển thị) | — | — | **MISSING** | new frame |
| US-E5-3 (Liên kết ngân hàng) | — | — | **MISSING** | new frame |
| US-E5-4 (Liên kết Telegram) | — | — | **MISSING** | new frame |
| US-E5-5 (Đăng xuất) | — | — | **MISSING** (có thể nằm trong account screen làm action) | confirm / add confirm dialog frame |

---

## Archived / stale frames (candidates for delete)

| Frame ID | Legacy name | Lý do |
|---|---|---|
| `TRd7M` | `[archive] US-2.1 Groups Empty (old)` | thay thế bằng `aHDw9` |
| `Hmu5u` | `[archive] US-2.1 Groups v2 (old)` | thay thế bằng `PdtKc` |
| `iY0Ne` | `[move out] Bill Variants (Epic 2)` | move to Epic 3 hoặc delete — đã có đủ bill variants ở Epic 3 |
| `Fq7i4` | `[archive] US-3.4 Split Sheet (old)` | split sheet đã refactor thành `US-3.2 Case A/E` + `US-3.1 Create Bill` |
| `JOZ8P` | `[archive] US-3.4 Split Sheet alt (old)` | same reason |

**Action recommendation:** xoá 5 frames này sau khi confirm không còn reference từ designer. Chúng đang chiếm khoảng không x≥2500 (đã tách khỏi canvas chính).

**Thêm khuyến nghị delete:**
- `7XoHZ` — duplicate của `kYFwv` (cùng tên + cùng toạ độ).
- Quyết định 1/3 canonical cho US-2.4 variants (`a1dCR`, `eIXWI`, `Q2ByW`) rồi archive 2 cái còn lại.
- Quyết định 1/2 canonical cho US-5.1 (`JF0Uo` vs `EnbuG`).

---

## Reusable components
**0 reusable components** trong file (`get_editor_state` xác nhận `No reusable components found`).

→ Design system chưa được proper componentized. Các buttons/cards/inputs đang copy-paste raw. Cân nhắc extract thành reusable components (Button, Input, BillCard, MemberAvatar…) trong 1 frame `Design System` riêng khi có time — không blocker cho audit này.

---

## Migration action list (priority order)

### P0 — Safe cleanup (không ảnh hưởng story coverage)
1. **Delete duplicate frame** `7XoHZ` (clone của `kYFwv`).
2. **Delete 5 archived frames**: `TRd7M`, `Hmu5u`, `iY0Ne`, `Fq7i4`, `JOZ8P`.
3. Keep 16 text labels (`label/Epic 1..5`, `lbl31..lbl51`) — update text nội dung sau khi rename frames.

### P1 — Rename 39 active frames theo new US ID format
Đây là mass-rename, không đổi internal structure:
- Epic 1: 2 renames (`TDAum`, `GquSw`)
- Epic 2: 9 renames (toàn bộ active group frames)
- Epic 3: 22 renames (bao gồm 3 payment frames từ `Debts /` cụm)
- Epic 4: 4 renames (2 `US-4.4` + 2 `Debts /` frames còn lại)
- Epic 5: 2 renames (`JF0Uo`, `EnbuG`)

Tool: `batch_design` với operations `U(frameId, {name: "US-EX-Y ..."})`.

### P2 — Resolve variant duplicates (design decision required)
1. **US-E2-4 Group Detail** — chọn canonical trong `a1dCR` / `eIXWI` / `Q2ByW`; archive 2 cái còn lại.
2. **US-E5-1 Tài khoản** — chọn canonical trong `JF0Uo` / `EnbuG`; archive 1 cái.

### P3 — Create missing frames (6 new screens)
| New US ID | Story | Complexity hint |
|---|---|---|
| US-E1-2 | Đăng nhập bằng mật khẩu | copy `TDAum` rồi thay OTP input → password input |
| US-E1-4 | Onboarding Step 2 — Đặt mật khẩu | copy `GquSw` variant |
| US-E1-5 | Branding màn Login | variant của US-E1-1 hoặc subframe |
| US-E2-3 | Tham gia nhóm (dialog) | new — small modal |
| US-E3-2 Case B/C/D | Member Picker các case còn lại | copy `KHkNj`/`QsGlF` và modify |
| US-E4-1 | Banner nợ | component — thêm vào Home `PdtKc` hoặc frame riêng |
| US-E5-2 | Sửa tên hiển thị | new small screen |
| US-E5-3 | Liên kết ngân hàng | new screen — form nhập số TK |
| US-E5-4 | Liên kết Telegram | new screen — deeplink/QR flow |
| US-E5-5 | Đăng xuất confirm | small dialog |

### P4 — Optional componentization
Nếu có quỹ thời gian: extract Button, Input, AvatarGroup, BillCard, StatusBar, NavBar, BottomNav thành reusable components trong 1 frame `Design System` riêng. Chưa phải blocker.

---

## Unresolved questions

1. Trong số 3 versions `US-2.4 Group Detail` (`a1dCR`, `eIXWI`, `Q2ByW`), version nào là canonical final theo ý designer? — cần decision trước khi rename/archive.
2. `JF0Uo` vs `EnbuG` cho US-5.1 Tài khoản — cái nào là canonical?
3. `iY0Ne [move out] Bill Variants (Epic 2)` — delete luôn hay move sang Epic 3 region trên canvas? Nội dung có gì unique so với các US-3.x hiện có?
4. US-E1-5 (Branding) nên là frame riêng hay chỉ là background/hero của US-E1-1? — phụ thuộc product guidance.
5. US-E4-1 (Banner nợ) nên là standalone frame hay chỉ là component được embed vào Home `PdtKc`? — phụ thuộc design system strategy.
6. Legacy `US-3.4 · Bill Card` (`agq43`) hiện chỉ là **bill card in feed**. PRD US-E3-4 yêu cầu "Bill Details & Actions" (full-page detail) — có cần thêm frame Bill Detail full view không?
7. PRD có 4 cases cho Member Picker (US-E3-2) nhưng file chỉ có Case A + Case E — missing Case B/C/D có phải intentional simplification hay cần bổ sung?
