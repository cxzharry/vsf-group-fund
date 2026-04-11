# Phase 3: AI Intent Engine (Screens B, D)

## Priority: P1 | Status: pending | Effort: 6h
## Depends on: Phase 1

Parse Vietnamese chat messages into bill/transfer intents using Claude Haiku.

## Context
- [Screen B] User types "1tr phở 8 người" → AI shows parsed card with confirm
- [Screen D] User types "ăn trưa 500k" (missing info) → AI asks follow-up with options A/B/C
- Need: fast, cheap, good Vietnamese understanding

## Requirements

### Intent Detection Rules
| Input pattern | Result |
|---------------|--------|
| Has amount + people count | Screen B: direct confirm card |
| Has amount, no people count | Screen D: ask how to split |
| No amount | AI asks "Bao nhiêu tiền?" |
| "chuyển cho/trả cho" + name | intent = transfer |
| No people count mentioned | suggest "Bill mở" as option |

### API Route: `/api/ai/parse-intent`

**Request:**
```ts
{
  message: string       // user's chat text
  groupId: string       // for member name resolution
  conversationHistory?: { role: string, content: string }[] // prior turns
}
```

**Response:**
```ts
{
  intent: 'bill' | 'transfer' | 'unclear'
  confidence: number
  parsed: {
    amount?: number           // VND
    description?: string
    peopleCount?: number
    splitType?: 'equal' | 'custom' | 'open'
    transferTo?: string       // member name
  }
  followUp?: {
    question: string
    options: { label: string, value: string, description: string }[]
  }
  displayText: string         // formatted text for AI card
}
```

### Claude Haiku Prompt Design
- System prompt: Vietnamese bill-splitting assistant
- Extract: amount (handle "1tr", "500k", "1.5 triệu"), description, people count, names
- Determine intent: split bill vs transfer
- If incomplete → generate follow-up with concrete options
- Keep token usage minimal — single-turn where possible, max 2-3 turns

### AI Response Card (Screen B — enough info)
- Shows parsed: amount, description, people count, per-person
- Type chips: "Chia tiền" / "Chuyển tiền"
- Buttons: "Tạo bill" (→ confirm sheet) + "Sửa" (→ edit inline)

### AI Follow-up Card (Screen D — missing info)
- Shows question text
- Options A/B/C as tappable cards (like Claude's UI)
- Example: A: "Chia đều - chưa biết mấy người (Bill mở)", B: "Chia đều - 6 người", C: "Chia tuỳ chỉnh"
- User can tap option OR continue chatting
- Hint at bottom: "Chọn option hoặc chat tiếp"

### Conversation Context
- Keep last 3-5 messages as context for follow-ups
- Store AI parse results in `chat_messages.metadata`
- Don't send entire chat history — only relevant turn

## Architecture / File Structure

```
src/app/api/ai/parse-intent/
  route.ts              — API handler, calls Claude Haiku

src/lib/
  ai-intent-parser.ts   — prompt construction, response parsing
  ai-amount-parser.ts   — Vietnamese amount string → number ("1tr" → 1000000)

src/components/chat/
  ai-response-card.tsx   — Screen B: parsed result with confirm
  ai-followup-card.tsx   — Screen D: options A/B/C
```

## Related Code Files
- **Create**: `src/app/api/ai/parse-intent/route.ts`
- **Create**: `src/lib/ai-intent-parser.ts`
- **Create**: `src/lib/ai-amount-parser.ts`
- **Modify**: `src/components/chat/ai-response-card.tsx` (from Phase 2 placeholder)
- **Create**: `src/components/chat/ai-followup-card.tsx`

## Dependencies
- `@anthropic-ai/sdk` — add to package.json
- `ANTHROPIC_API_KEY` env var

## Implementation Steps
1. `npm install @anthropic-ai/sdk`
2. Create `ai-amount-parser.ts` — handle "1tr", "500k", "1.5 triệu", "200 nghìn", raw numbers
3. Create `ai-intent-parser.ts` — system prompt, parse response, format for UI
4. Create `/api/ai/parse-intent/route.ts` — validate, call Haiku, return structured
5. Build `ai-response-card.tsx` — display parsed bill with confirm/edit buttons
6. Build `ai-followup-card.tsx` — display options, handle selection
7. Wire into chat flow: on message send, if not pure chat → call parse-intent → insert AI response as chat_message
8. Handle option selection → re-call parse with selected option as context

## Success Criteria
- [ ] "1tr phở 8 người" → parsed card: 1,000,000đ, Phở, 8 người, 125,000đ/người
- [ ] "ăn trưa 500k" → follow-up with split options
- [ ] "chuyển cho Hai 200k" → transfer intent, 200,000đ to Hai
- [ ] "ăn gì đó" (no amount) → AI asks amount
- [ ] Options tappable, continue chat works
- [ ] Response time < 2s

## Risk
- Claude Haiku may misparse ambiguous Vietnamese — need good system prompt + fallback to manual
- Amount parsing edge cases: "1tr5", "một triệu", mixed formats
- Rate limiting / cost — cache identical requests? Probably YAGNI for now
