# US-E3-3 AI Quick Parse — Deep Design + Code

**Date:** 2026-04-18 00:20
**Scope:** Design spec (for Pencil import) + React code implementation of missing AI states.
**Owner:** ui-ux-designer
**Status:** Code merged — Pencil frames **NOT created** this session (MCP tool `mcp__pencil__*` not wired into subagent sandbox).

---

## Context

Existing Pencil frames (reference):
- `K2ZUg` US-E3-3 AI Quick Parse — Typing (x=100, y=8020)
- `zLhAX` US-E3-3 AI Quick Parse — Prefilled (x=562, y=8020)
- `cb0z1` US-E3-3 AI Quick Parse — Follow-up (x=1024, y=8020)

PRD spec: `docs/epic-03-transactions.md` §US-E3-3 (lines 181–225). Core flow:
User gõ chat → regex parser → prefilled Create Bill Sheet | Follow-up Card | ignore.

Existing code landing:
- `src/lib/ai-intent-parser.ts` + `ai-intent-types.ts` + `parse-vietnamese-amount.ts`
- `src/components/chat/ai-response-card.tsx` + `ai-followup-card.tsx`
- `src/app/api/ai/parse-intent/route.ts`
- Integration: `src/app/(app)/groups/[id]/page.tsx` `handleSendText`

**Gap audit** — missing states vs spec:
| State | Before | After |
|---|---|---|
| Empty (chưa input) | existing input bar | no change |
| AI processing (loading) | missing | **NEW** bubble |
| AI error (rate-limit/offline/server) | silent swallow | **NEW** bubble + retry + manual fallback |
| Ambiguous parse (hỏi split) | follow-up card OK | no change |
| Low confidence | silent, no signal | **NEW** `⚠ Cần xem lại` chip on response card |
| Success toast | OK (`sonner`) | no change |
| Multi-item parse (2+ amounts) | only first amount used | **NEW** amount picker card |

---

## Design Spec (để import vào Pencil sau)

Design tokens đã có: primary `#3A5CCC`, surface `#F2F2F7`, white card, error `#FF3B30`, warning `#FF9500`, muted `#8E8E93`, Inter font.

### Frame `US-E3-3 AI Parse — Processing`
Chat bubble `bg-white rounded-2xl rounded-tl-sm shadow-sm` p-3. Label `AI trợ lý` 10px bold `#3A5CCC`. 3 dots ø 8px `#3A5CCC/60` bounce staggered `-0.3s`, `-0.15s`, `0s`. Suffix text 11px `#8E8E93` "Đang đọc tin nhắn...". Inline above input bar.

### Frame `US-E3-3 AI Parse — Error (Rate-limit)`
Bubble same container. Label `AI trợ lý` 10px bold **`#FF3B30`** (red). Body 14px `#1C1C1E` "Quá nhiều yêu cầu. Thử lại sau một chút nhé." 2 buttons row gap-2:
- **Thử lại** — outline `#3A5CCC`, bg white, flex-1, rounded-xl, 14px bold
- **Tạo thủ công** — bg `#3A5CCC`, text white, flex-1, rounded-xl, 14px bold

Variants: kind=`network` ("Không có mạng..."), kind=`server` ("AI đang bận...").

### Frame `US-E3-3 AI Parse — Low confidence`
Reuse Prefilled bubble. Add inline chip sau intent chip row: `bg-[#FFF8EC]` px-2 py-0.5 rounded-full, text `#FF9500` 11px bold `⚠ Cần xem lại`. Tooltip "AI không chắc lắm — hãy kiểm tra lại". Chip chỉ render khi `confidence < 0.6`.

### Frame `US-E3-3 AI Parse — Multi-amount`
Bubble same. Body "Thấy nhiều số tiền. Tổng bill là bao nhiêu?" 14px. Chip row wrap gap-1.5. Mỗi chip: `bg-[#F0F4FF]` border `#3A5CCC/20` rounded-full px-3 py-1.5, 12px bold `#3A5CCC`, format VND `1.200.000đ`. Hint footer 10px `#AEAEB2` "Hoặc gõ lại số đúng".

### Microinteractions
- Processing bubble enter: fade-in 150ms + slide-up 4px.
- Bubble hidden khi parsed hoặc error (không stack).
- Error bubble persistent cho đến user click hoặc gõ mới.
- Low-confidence chip 200ms fade-in.
- Multi-amount chip tap → ripple `#3A5CCC/10` 150ms → bubble exits.

**Pencil canvas placement (đề xuất):** bottom row dưới existing 3 frames (x=100,562,1024 / y=8020). Thêm y=8600+ cho 4 frame mới cùng grid step 462px. Tool `find_empty_space_on_canvas(direction="bottom")` sẽ resolve chính xác khi chạy qua Pencil MCP trong session sau.

---

## Code Changes (đã merge)

### 1. `src/lib/ai-intent-types.ts`
Thêm optional fields:
```ts
confidence?: number;      // 0..1, <0.6 shows warning chip
alternates?: Array<{ amount: number; description: string | null }>;
```

### 2. `src/lib/ai-intent-parser.ts`
- Import `extractAllAmounts`.
- Tính `confidence` = 0.4 base + description (+0.25) + peopleCount (+0.2) + splitType (+0.15), clamp ≤1.
- Nếu `extractAllAmounts(text).length > 1` → populate `alternates` (max 3, exclude primary).

### 3. `src/components/chat/ai-processing-bubble.tsx` (NEW)
Typing-dots loading bubble. `role="status" aria-live="polite"`. 3 bouncing `#3A5CCC/60` dots + "Đang đọc tin nhắn..." suffix.

### 4. `src/components/chat/ai-error-bubble.tsx` (NEW)
Props: `kind: "network" | "rate_limit" | "server"`, `onRetry`, `onManualFallback`. `role="alert"`. Red `AI trợ lý` label. Context-aware message. 2 CTAs: **Thử lại** (outline blue) + **Tạo thủ công** (solid blue).

### 5. `src/components/chat/ai-multi-amount-card.tsx` (NEW)
Props: `primary`, `alternates`, `onSelectAmount`. Renders chip row `{formatVND(amt)}đ`. User pick → emits selected amount back to parent.

### 6. `src/components/chat/ai-response-card.tsx`
Thêm `lowConfidence = intent.confidence < 0.6` → render `⚠ Cần xem lại` chip cạnh intent type chip.

### 7. `src/app/(app)/groups/[id]/page.tsx`
- Import 3 new components.
- 4 state mới: `aiProcessing`, `aiError`, `lastParsedText`, `showMultiAmount`.
- Extracted `runParse(text)` — set processing → fetch → map HTTP status (429 → rate_limit, !ok → server, catch → network).
- `handleSendText` now delegates to `runParse` sau khi insert chat message.
- `handleAiRetry` — re-run parse với lastParsedText.
- `handleAiManualFallback` — clear error + open Bill Confirm Sheet với description=lastParsedText (user vẫn tận dụng context đã gõ).
- `handleMultiAmountSelect` — set pendingIntent.amount, mark readyToConfirm, open sheet.
- Render ordering (bottom→top, above input): processing → error → multi-amount → followup → input bar. Chỉ 1 hiện tại time (mutually exclusive, logic flow).

---

## Verification

- `npx next lint --dir src/components/chat --dir "src/app/(app)/groups"` → **No ESLint warnings or errors**.
- `npm run build` → **Success**. `/groups/[id]` bundle: 15.2 kB (was ~14 kB).
- `tsc --noEmit` failed due to local node_modules bin issue but Next build types are OK (Next.js runs tsc internally during build).

---

## New Frame IDs to Create (next Pencil session)

| Slug | Label |
|---|---|
| `us-e3-3-ai-processing` | US-E3-3 AI Parse — Processing |
| `us-e3-3-ai-error-ratelimit` | US-E3-3 AI Parse — Error (Rate-limit) |
| `us-e3-3-ai-error-network` | US-E3-3 AI Parse — Error (Network) |
| `us-e3-3-ai-error-server` | US-E3-3 AI Parse — Error (Server) |
| `us-e3-3-ai-low-confidence` | US-E3-3 AI Parse — Low confidence |
| `us-e3-3-ai-multi-amount` | US-E3-3 AI Parse — Multi-amount picker |

---

## Files Touched

- `src/lib/ai-intent-types.ts` — +2 fields
- `src/lib/ai-intent-parser.ts` — confidence scoring + alternates
- `src/components/chat/ai-processing-bubble.tsx` — NEW
- `src/components/chat/ai-error-bubble.tsx` — NEW
- `src/components/chat/ai-multi-amount-card.tsx` — NEW
- `src/components/chat/ai-response-card.tsx` — low-conf chip
- `src/app/(app)/groups/[id]/page.tsx` — wire 3 new bubbles + runParse + retry + fallback + multi-pick

---

## Unresolved Questions

1. **Pencil MCP access** — MCP tools `mcp__pencil__*` không có trong subagent này. Parent agent cần chạy design session riêng để tạo 6 frame trên (spec đã sẵn). Hoặc bật MCP server `pencil` trong `.claude/settings.json` cho subagent.
2. **Confidence threshold** — hiện dùng 0.6. Có thể cần tune sau user testing (PO decision).
3. **Rate-limit enforcement** — `/api/ai/parse-intent` chưa return 429 thật. Để trigger error UI trong dev, cần thêm rate-limit middleware (Upstash/Supabase) — out of scope session này.
4. **Multi-amount heuristic** — hiện dùng `extractAllAmounts` raw. Có thể false-positive cho VD "500k 6 người" (dù 6 không phải money). Hiện tại OK vì `parseVietnameseAmount` require ≥1000. Cần review thêm với real data.
5. **LLM fallback** — PRD nói "regex local, không LLM". Nếu sau này thêm LLM, error kind cần mở rộng (`llm_timeout`, `llm_quota`).
