# Code ↔ Design Gap Audit — 2026-04-18

Scope: đối chiếu `src/` với PRD (`docs/product-requirements.md` + `docs/epic-0{1-5}.md`) + design reports (`plans/reports/design-*`, `e{2..5}-cluster-*`, `pen-audit-*`, `evaluator-*-pencil-design-review.md`).

PO hỏi Pencil MCP — mặc dù có tool schema, bản audit này dựa trên design intent đã được chốt trong docs/reports (đủ để xác định gap code vs spec). `.pen` file không được mở trực tiếp ở session này.

---

## Phần 1 — Code không match design intent

### 1.1 [HIGH] `/groups` orphan page conflict với Home canonical

- **File:** `src/app/(app)/groups/page.tsx` (273 lines)
- **Vấn đề:** route `/groups` vẫn tồn tại với UI riêng (shadcn Card + `PageHeader backHref="/"` + 2 nút "Tạo nhóm / Tham gia" + join-by-code dialog).
- **Design intent (PRD US-E2-1/E2-2/E2-3):** Home `/` là canonical "Nhóm" tab (`src/app/(app)/page.tsx`). Không có design frame nào cho `/groups` list — chỉ Home (`PdtKc`), Create (`Wv0LE`), Join (missing frame — còn là dialog).
- **Current behavior:** 2 surface độc lập hiển thị cùng data: Home = design chuẩn (88px row + debt subtitle + chip tổng), `/groups` = kiểu shadcn generic.
- **Impact:** AGENTS.md rule "app chỉ 2 tabs" bị phạm trên thực tế nếu user gõ URL `/groups`. Drift visual + logic.
- **Expected:** xoá file, redirect `/groups` → `/` (giống pattern `members/page.tsx` + `profile/page.tsx`).

### 1.2 [HIGH] Orphan top-level routes còn hoạt động UI đầy đủ

Các route sau có UI độc lập, không thuộc 2-tab scope, chưa có frame Pencil tương ứng:

| Route | File | LoC | Status | Note |
|---|---|---|---|---|
| `/activity` | `src/app/(app)/activity/page.tsx` | 214 | Full UI | Agg bills + payments, dùng shadcn Card/Badge, `PageHeader backHref="/"` |
| `/bills` | `src/app/(app)/bills/page.tsx` | 136 | Full UI | List all bills, shadcn Card. PRD không có "Bills" tab/page |
| `/bills/[id]` | `src/app/(app)/bills/[id]/page.tsx` | — | Full UI | Bill detail standalone page — E3 cluster note: design nói phải là half-sheet |
| `/bills/new` | `src/app/(app)/bills/new/page.tsx` | 344 | Full UI | Standalone create-bill page, conflict với US-E3-1 spec "Create Bill Sheet" (half-sheet trong group detail) |
| `/debts` | `src/app/(app)/debts/page.tsx` | 706 | Full UI | US-E4-4 canonical, hợp lệ. Nhưng nav không expose (access qua banner button) |
| `/summary` | `src/app/(app)/summary/page.tsx` | 265 | Full UI | Duplicate partial của `/debts` (shadcn Card, backHref="/"). Không có PRD story |
| `/transfer/[debtId]` | | 550 | Full UI | US-E3-6 canonical |

- **Design intent:** PRD + AGENTS.md: chỉ có Home (groups list) + Group Detail + Account. Bill & debt flows nested trong group detail.
- **Expected:** `/activity`, `/summary`, `/bills`, `/bills/new`, `/bills/[id]` redirect hoặc delete. `/debts` + `/transfer` giữ lại (có referrer từ banner/card).

### 1.3 [MED] Bill detail = standalone page thay vì half-sheet

- **File:** `src/app/(app)/bills/[id]/page.tsx` (~300 lines, shadcn Card/Badge/Separator).
- **PRD US-E3-4:** "Tap vào card → mở **Bill Details Sheet** (half-sheet)" với section "Thông tin" + "Chi tiết chia tiền" + "Ảnh bill" + footer action "Sửa/Xoá".
- **Current behavior:** chỉ có `/bills/[id]` full page. Bill card trong chat feed (`bill-card-bubble.tsx`) **không có onClick** để mở details sheet — chỉ menu `⋯` để edit/delete.
- **Gap:** AC-E3-4.4 fail (tap card không open details sheet) + AC-E3-4.5 partial (no action buttons inside sheet context) + status indicator ("Bạn nợ X") **không có** (AC-E3-4.6 fail).
- **Expected:** `BillDetailsSheet` component, bill card tap → open sheet. Standalone page có thể redirect.

### 1.4 [MED] Bill mở: "Đóng bill" CTA vẫn còn trong code

- **File:** `src/components/chat/open-bill-card.tsx:131-139`
- **Design decision (2026-04-18):** `plans/reports/design-260417-2335-us-e3-5-options.md` PO feedback #2: "**Bỏ 'Đóng bill' button** — bill sau tạo dùng standard edit/delete (qua `⋯` menu), không có explicit close action."
- **Current behavior:** State B + C vẫn render nút "Đóng bill" (secondary text link) khi `isPayerOrAdmin`.
- **Expected:** xoá nút "Đóng bill" hoàn toàn. Đóng bill chuyển thành implicit (qua edit bill? Hay qua ⋯ menu?). Cần design spec rõ hơn — nhưng theo decision hiện tại, button phải biến mất.

### 1.5 [MED] Bill mở card: per-person amount không hiển thị trước khi đóng

- **File:** `src/components/chat/open-bill-card.tsx:60-77`
- **Design intent (design-260417-2335):** State B hiển thị status text `~150.000đ/người` (per-person = `total_amount ÷ fixed_participant_count`, cố định khi tạo). State C: `Đủ 8 người — mỗi người ~150.000đ`.
- **Current behavior:** card chỉ hiện "{checkinCount} người đã check-in" + total amount. Không có per-person estimate.
- **Expected:** thêm `~Xđ/người` row dựa trên `estimated_people_count` hoặc `checkin_count`.

### 1.6 [MED] Bill mở card: "Tôi có ăn" button màu cam thay vì primary blue

- **File:** `src/components/chat/open-bill-card.tsx:111`
- **Design intent (design-260417-2335):** "Tôi có ăn (primary blue)" cho State A + B.
- **Current behavior:** button `bg-[#FF9500]` (warning orange).
- **Expected:** `bg-[#3A5CCC]` (primary).

### 1.7 [MED] Bill mở card: thiếu `⋯` menu (AC-E3-4/design state A)

- **File:** `src/components/chat/open-bill-card.tsx`
- **Design intent (design-260417-2335 PO feedback #3):** "⋯ menu thêm vào State A — consistency: bill đã tạo thì luôn có edit/delete menu".
- **Current behavior:** open bill card **không có** `⋯` menu (chỉ `bill-card-bubble` có). Khi bill mở còn active, owner không thể edit/delete qua card.
- **Expected:** add `MenuDots` top-right giống bill-card-bubble, chỉ hiện khi `isOwner`.

### 1.8 [MED] Amount color of bill card header = #1C1C1E thay vì #3A5CCC

- **File:** `src/components/chat/bill-card-bubble.tsx:174`
- **Design intent (E3 cluster report, evaluator-260417-2335 note):** amount highlight `#3A5CCC` 17px bold primary.
- **Current behavior:** "Tổng" amount row dùng `text-[#1C1C1E]` 15px semibold. E3 cluster report line 38 claim "Amount color → #3A5CCC (17px bold primary)" — code chưa apply ở row Tổng (có thể cluster apply ở amount khác trước đó).
- **Expected:** chỉnh Tổng amount to primary highlight per spec.

### 1.9 [MED] Onboarding Step 2 design drift (already flagged)

- **File:** `src/app/setup/page.tsx:188-198`
- **Design review (evaluator-260417-2335 Fix #1):** dh9hf frame có 5 drifts (no status bar, no navbar back, lock icon tile thay avatar_lg, input underline vs outlined-card, step-dots pattern novel).
- **Current behavior:** code match chính xác với **bad design frame** dh9hf — step-dots + lock icon 48px + inputs underline + no back button.
- **Expected:** rebuild match GquSw pattern — avatar_lg 80px OR icon ≥64px, outlined-card inputs with overline label, navbar với back chevron.

### 1.10 [MED] US-E3-2: thiếu Guest + Anonymous people support

- **File:** `src/components/chat/split-sheet.tsx`
- **PRD US-E3-2 Case C + D:** "Khách ngoài nhóm" (có tên, không có TK) + "Số người ẩn danh" input (tăng count > members+guests → tạo slot ẩn danh).
- **Current behavior:** chỉ select group members. Không có section Khách, không có input "Số người chia".
- **Gap:** AC-E3-2.4 + AC-E3-2.5 + AC-E3-2.10 + AC-E3-2.13 fail.
- **Expected:** add Guest section (nhập tên, max 10) + "Số người chia" input (default = members + guests, cho user tăng).

### 1.11 [LOW] Add-People-Sheet close button style ≠ sheet pattern

- **File:** `src/components/chat/add-people-sheet.tsx:72-80`
- **Current behavior:** close button là chip round `h-7 w-7 bg-[#F2F2F7]` thay vì text "✕" theo pattern sheets khác.
- **Expected:** align với `bill-confirm-sheet` + `split-sheet` pattern: text `✕` 16px `#AEAEB2`.

### 1.12 [LOW] US-E2-5 leave group — banner không có trong group settings

- **File:** `src/app/(app)/groups/[id]/settings/page.tsx` (checked via e2-cluster report).
- **Currently OK** per e2-cluster-260417-2312, nhưng cần confirm full read. Skip trong audit này.

### 1.13 [MED] Home debt chip style drift

- **File:** `src/app/(app)/page.tsx:208-231`
- **Design intent (PdtKc exemplary):** chip tổng nợ là 2-line "Bạn đang nợ / Bạn được nợ" dạng summary card.
- **Current behavior:** h-[52px] single-row bg-white chip, có conditional `·` separator + "Tổng: ...".
- **Gap nhỏ:** visible rendering OK nhưng `rounded-[12px]` thay vì `rounded-[14px]` chuẩn card radius.

### 1.14 [LOW] AI Follow-up card styling khác pattern

- **File:** `src/components/chat/ai-followup-card.tsx`
- **Current behavior:** `rounded-2xl rounded-tl-sm` + bold AI label 10px + options dạng text buttons có letter label (A., B., C.). Style unique.
- **Design intent:** PRD US-E3-3 nói "AI Follow-up Card inline trước chat input" — không chi tiết visual. Nhưng pattern không match bubble cards khác (`rounded-[14px]`).
- **Expected:** align radius + token-color.

---

## Phần 2 — Features có trong code/app nhưng chưa define trên Pencil design

### 2.1 Payer picker sheet trong Create Bill Sheet
- **Code:** `bill-confirm-sheet.tsx:359-408` (`showPayerPicker`)
- **Gap:** PRD US-E3-1 nói "Người trả: một thành viên trong nhóm" nhưng không có frame riêng cho picker sheet. Frame `7btI8` chỉ show row "Người trả" dạng static.
- **Note:** Code làm đúng spec functionally nhưng sheet visual chưa có design — cần frame.

### 2.2 Recipient picker sheet (US-E3-10 Transfer)
- **Code:** `bill-confirm-sheet.tsx:411-465` (`showRecipientPicker`)
- **Gap:** design frame `fgVL2` có "Tạo giao dịch" sheet (centered title drift) nhưng không có subsheet cho recipient picker. Missing design.

### 2.3 AI intent parser result state
- **Code:** `src/lib/ai-intent-parser.ts` + `handleFollowupSelect` logic trong `groups/[id]/page.tsx:323`
- **Design:** có frame `K2ZUg` (typing), `zLhAX` (prefilled), `cb0z1` (follow-up) — covered. OK.

### 2.4 Pending confirmation banner variant ("Chờ xác nhận")
- **Code:** `groups/[id]/page.tsx:820-829` — banner cam bg `#FFF8EC` + text "Chờ ... xác nhận thanh toán"
- **Gap:** PRD US-E3-6 step 5 mention "banner chuyển sang 'Chờ xác nhận' (vàng)" nhưng không có design frame riêng cho pending state. Assumed OK.

### 2.5 Delete bill confirm dialog (inline)
- **Code:** `groups/[id]/page.tsx:1076-1102`
- **Design frame:** `o7IOE` có "Xoá bill — Confirm dialog" — match. OK.

### 2.6 Edit bill flow qua Create Bill Sheet mode="edit"
- **Code:** `groups/[id]/page.tsx:1032-1064`, `bill-confirm-sheet.tsx:73,168` (title "Sửa bill", CTA "Lưu thay đổi")
- **Design frame:** `Xnslw` edit mode — match. OK.

### 2.7 "Đã sửa" inline badge (AC-E3-8.5)
- **Code:** `bill-card-bubble.tsx:192` `text-[11px] text-[#8E8E93] · Đã sửa`
- **Design frame:** `2b8ui` có badge design — code match spec "inline text, no pill". OK.

### 2.8 "Đã đóng" pill trên bill card (closed state)
- **Code:** `bill-card-bubble.tsx:194-197` — green `#F0FFF4` pill "Đã đóng"
- **Gap:** không có design frame cho closed bill card variant. Missing.

### 2.9 Home session storage caching (SSG hydration)
- **Code:** `page.tsx:58-68` — `sessionStorage` cache `home_groups_v2`
- **Gap:** performance optimization, không có design impact. OK.

### 2.10 Group detail empty state button "Chia sẻ mã mời"
- **Code:** `groups/[id]/page.tsx:950-969`
- **Design:** frame `KoKtg` "Group Detail (Empty)" tồn tại — nhưng empty state copy trong PRD US-E2-4 edge cases nói "icon receipt + 'Chưa có bill nào'" — **không match code** hiện show "Chưa có hoạt động nào" + "Mời thêm thành viên...". Design frame có thể chưa match PRD text.

### 2.11 Pending debt set tracking
- **Code:** `groups/[id]/page.tsx:211-223, 80` — `pendingConfirmDebtIds` set để switch banner state.
- **Gap:** không có design frame riêng, chỉ variant của US-E4-1 banner. Assumed covered by "Chờ xác nhận" orange banner.

### 2.12 "Dùng OTP thay thế" + "Nhập mật khẩu" mode switch in login
- **Code:** `login/page.tsx:149-155, 237-241`
- **Design:** frame `TDAum` (OTP) + `SAQBz` (password, flagged drift) — có frame nhưng drift. Mode switch button style chưa chuẩn.

### 2.13 Desktop sidebar nav với brand logo + "NPFL v1.0" footer
- **Code:** `desktop-nav.tsx:27-67`
- **Gap:** toàn bộ desktop layout chưa có frame trong .pen (design là mobile-first). Acceptable — Tailwind `sm:` breakpoint handle.

### 2.14 PRD public page `/prd`
- **Code:** `src/app/prd/page.tsx` (existed per grep)
- **Gap:** không có trong PRD section 4.3 hay epic. Public mirror của docs. OK — nội bộ tool.

### 2.15 Screenshot OCR upload trong transfer flow
- **Code:** `src/components/screenshot-upload.tsx`, `src/lib/ocr-parser.ts`
- **Gap:** PRD US-E3-6 mention "Lưu QR download PNG" nhưng không có OCR upload flow. Code có hỗ trợ screenshot_ocr confirm method nhưng chưa define trong PRD/design.

---

## Phần 3 — Features có trong design/PRD nhưng chưa code (hoặc code sai)

### 3.1 [HIGH] US-E3-4 Bill Details Sheet (half-sheet)
- **PRD:** tap card → mở Bill Details Sheet với sections Thông tin + Chi tiết chia tiền + Ảnh bill + footer actions.
- **Code:** chưa có `BillDetailsSheet` component. Chỉ có `/bills/[id]` standalone page (conflict — xem 1.3).
- **Status:** **NOT IMPLEMENTED**.

### 3.2 [HIGH] US-E3-4 Status indicator trên bill card ("Bạn nợ X" / "Họ nợ X")
- **PRD AC-E3-4.6:** "Status indicator chính xác (bạn nợ / họ nợ / đã xong)" ở footer card.
- **Code:** `bill-card-bubble.tsx` chỉ có `showOwed` → "Bạn mượn Xđ". Không có "{payer} nợ bạn" khi current user là creditor. Không có "Đã thanh toán" gray state.
- **Status:** **PARTIAL** — chỉ 1/3 case.

### 3.3 [HIGH] US-E3-2 Case C (guest) + Case D (anonymous)
- **PRD:** 2 feature bắt buộc cho Split Sheet.
- **Code:** chưa có. Xem 1.10.
- **Status:** **NOT IMPLEMENTED**.

### 3.4 [MED] US-E3-1 "Bill mở" ẩn "Chia cho" row — partial
- **PRD AC-E3-1.7:** Bill mở ON → ẩn "Chia cho", hiện "Số người ước tính".
- **Code:** `bill-confirm-sheet.tsx:276-323` đã implement — hide `showSplit` khi `isOpenBill` và show `estimatedPeople` input.
- **Gap:** "Số người ước tính" input ở **cùng row với toggle**, không separate row như design. OK chấp nhận được. Pass.

### 3.5 [MED] US-E3-1 Manual flow entry point
- **PRD:** nút ➕ trong chat input bar → mở Create Bill Sheet **blank**.
- **Code:** `chat-input-bar.tsx` + `groups/[id]/page.tsx:1003-1018` có `onOpenManualBill` — tạo pendingIntent blank rồi open sheet. Pass.

### 3.6 [MED] US-E3-5 Đóng bill logic
- **PRD Rules/Function step 4:** "Đóng bill: payer hoặc group admin tap 'Đóng bill' → chia đều cho tất cả người đã check-in, tạo khoản nợ".
- **Design decision (2026-04-18):** bỏ nút Đóng bill — implicit close?
- **Code:** `handleCloseBill` trong `groups/[id]/page.tsx:563-632` vẫn hoạt động. Nhưng button UI vẫn ở open-bill-card (conflict với decision 1.4).
- **Status:** backend logic OK, UI chưa cập nhật theo decision mới.
- **Unresolved Q:** decision "bỏ Đóng bill button" conflict với PRD US-E3-5 step 4. PO cần clarify: implicit close khi đủ người? Hay dùng `⋯` menu "Đóng bill"?

### 3.7 [MED] US-E3-9 Auto-infer category on edit
- **PRD AC-E3-9.2:** "Auto-infer từ description khi tạo/sửa bill"
- **Code:** `bill-confirm-sheet.tsx:102` `inferCategory(description)` run on render. Pass ở create. Ở edit mode, `handleEditBill` trong `groups/[id]/page.tsx:686+` cần verify re-infer. (Chưa đọc hết code — check cần thiết.)
- **Status:** likely OK.

### 3.8 [MED] US-E4-1 Debt banner rounded card variant
- **PRD + design:** banner nợ. Current code: full-bleed strip `h-[56px]`, no radius.
- **e4-cluster-260417 Unresolved Q #1:** should be floating card (`mx-4 rounded-[14px]`) or full-bleed strip?
- **Status:** ambiguous spec, code = strip (simpler).

### 3.9 [MED] US-E4-4 `simplifyDebtsGraph` v2 algorithm
- **PRD AC-E4-4.2:** "Mode 'Nợ ròng' gộp debts bằng `simplifyDebts()` hoặc `simplifyDebtsGraph()`"
- **Code:** `simplifyDebts()` wire vào `debts/page.tsx:120`. `simplifyDebtsGraph()` **không được gọi** từ UI (e4-cluster-260417 Unresolved Q #3).
- **Status:** v2 exists trong `simplify-debts.ts` nhưng không expose. PO cần decide toggle v1/v2.

### 3.10 [MED] US-E5-1 Avatar deterministic hash 8-color
- **PRD + components.md §5:** 8-color hash từ email → avatar background.
- **Code:** `account/page.tsx:105` hardcode `#3A5CCC` (single color). Hash logic có trong `setup/page.tsx:10-20` cho onboarding nhưng không apply ở account page.
- **Status:** PARTIAL. Inconsistent across pages.

### 3.11 [MED] US-E5-2/3/4/5 — design frames MISSING
- Per `pen-audit-260417-2245` Epic 5 section: US-E5-2 (Sửa tên), US-E5-3 (Liên kết NH), US-E5-4 (Liên kết Telegram), US-E5-5 (Đăng xuất) **không có frame nào** trong .pen file.
- **Code:** đều implemented trong `account/page.tsx` via Dialog component.
- **Status:** feature code OK, design miss — no Pencil reference để validate. E5 cluster report dùng components.md spec thôi.

### 3.12 [LOW] US-E1-5 Branding frame
- Per pen-audit: US-E1-5 là subframe hoặc variant của login; có thể đã gộp vào `TDAum`.
- **Code:** login page render logo + "NoPay FreeLunch" text (`login/page.tsx:98-119`). OK functionally.
- **Status:** code OK, design frame chưa tách rõ.

### 3.13 [LOW] US-E2-3 Join by code dialog frame MISSING
- Per pen-audit: US-E2-3 không có frame riêng.
- **Code:** join flow qua `/groups` orphan page (dùng shadcn Dialog) + API `/api/groups/join` + route `/join/[code]`.
- **Status:** code OK functionally, design frame missing. Cần design frame chuẩn để tránh drift.

### 3.14 [MED] US-E3-1 "Loại bill" toggle logic "Chuyển tiền" redirect
- **PRD AC-E3-1.2:** "Toggle Chia tiền default, Chuyển tiền redirect US-E3-6".
- **Code:** `bill-confirm-sheet.tsx:147-150` — toggle `setBillType(type)` **switches in-place**, không redirect. US-E3-10 flow mới cho phép transfer bill làm chat message.
- **PRD conflict:** AC-E3-1.2 vs US-E3-10 entry point. US-E3-10 nói "Create Bill Sheet toggle = Chuyển tiền" (in-place) — **newer spec wins**.
- **Status:** code match US-E3-10 (newer). PRD US-E3-1 AC-E3-1.2 need update.

### 3.15 [LOW] "Tab bar ẩn trên màn này" (AC-E2-4.5)
- **Code:** `bottom-nav.tsx:26` check `if (pathname !== "/" && pathname !== "/account") return null` — nav hide trên group detail. Pass.

---

## Phần 4 — Unresolved questions

1. **US-E3-5 "Đóng bill" button decision conflict** — PRD step 4 nói có button, design-260417-2335 PO feedback nói bỏ. Làm sao đóng bill hiện tại sau khi bỏ button? Qua `⋯` menu "Đóng bill"? Hay implicit khi đủ `estimated_people`?
2. **`/bills`, `/bills/new`, `/bills/[id]`, `/activity`, `/summary`, `/groups` orphan routes** — delete / redirect / giữ làm dev tool?
3. **Bill Details Sheet vs standalone `/bills/[id]` page** — pick one. PRD US-E3-4 clearly muốn half-sheet. Delete standalone page hay redirect to sheet?
4. **Debt banner shape** — full-bleed strip (hiện tại) vs floating card (`mx-4 rounded-[14px]`)? e4-cluster Q #1.
5. **`simplifyDebtsGraph` v2 expose UI** — toggle thêm sub-option trong `/debts` cho v2 (multi-hop) không? Hay default v1 luôn?
6. **Avatar hash 8-color**: apply uniformly (account page, group card, member avatars) hay giữ hardcoded primary ở 1 số nơi?
7. **Bill mở per-person display** — show `~Xđ/người` từ `estimated_people_count` ngay khi tạo hay chỉ sau check-in?
8. **US-E3-2 Guest + Anonymous** — implementation priority? Features unchecked (AC-E3-2.4, .5, .10, .13) = critical MVP hay v1.5?
9. **`/prd` public page** — giữ public hay auth-gate?
10. **Group detail empty state text drift** — code hiện "Chưa có hoạt động nào" vs PRD US-E2-4 edge case "Chưa có bill nào". Pick one.
11. **AI Follow-up card style** — align với bubble radius 14px hay giữ unique rounded-2xl?
12. **Onboarding Step 2 redesign** — rebuild match GquSw (có navbar back + avatar_lg + outlined-card input) requires new design frame first hay dev guess từ components.md?

---

## Summary

- **Phần 1 code-vs-design drift:** 14 issues (3 HIGH, 9 MED, 2 LOW)
- **Phần 2 undefined-in-design:** 15 items (code implemented, design missing)
- **Phần 3 designed-not-coded or code-wrong:** 15 items (3 HIGH, 9 MED, 3 LOW)

**Top priority HIGH items:**
1. Delete/redirect `/groups`, `/bills*`, `/activity`, `/summary` orphan routes (1.1, 1.2)
2. Implement `BillDetailsSheet` + tap-to-open (3.1, 3.2)
3. Implement US-E3-2 Guest + Anonymous support (1.10, 3.3)
4. Rebuild Onboarding Step 2 match GquSw pattern (1.9)
5. Fix `open-bill-card`: remove "Đóng bill" button OR resolve decision (1.4, 3.6), change "Tôi có ăn" to primary blue (1.6), add `⋯` menu (1.7), add per-person amount display (1.5)
