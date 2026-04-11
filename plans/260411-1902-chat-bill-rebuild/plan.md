---
title: "Chat-first Bill Splitting Rebuild"
description: "Rebuild Group Fund with chat interface, AI intent parsing, open bills, and redesigned payment flow"
status: pending
priority: P1
effort: 32h
branch: main
tags: [rebuild, chat-ui, ai, open-bills, vietqr]
created: 2026-04-11
---

# Chat-first Bill Splitting Rebuild

## Goal
Transform group detail from static member list into chat-first interface (Screens A-H from Pencil). Users type natural Vietnamese, AI parses intent, bills/transfers appear as cards inline.

## Current State
- Group detail: static member list + invite code + "Tạo bill" button
- Bill creation: separate `/bills/new` page with form
- No chat, no AI, no open bills, no inline cards

## Architecture Change
- `/groups/[id]/page.tsx` becomes the chat interface (Screen A)
- New API route `/api/ai/parse-intent` for Claude Haiku
- Supabase Realtime subscriptions for live chat + check-ins
- Bottom sheet components for bill confirm (Screen E) + add people (Screen H)
- QR transfer becomes a dedicated screen (Screen F)

## Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 1 | [Database Migration](phase-01-database-migration.md) | 2h | pending |
| 2 | [Chat Interface](phase-02-chat-interface.md) | 6h | pending |
| 3 | [AI Intent Engine](phase-03-ai-intent-engine.md) | 6h | pending |
| 4 | [Bill Creation Flow](phase-04-bill-creation-flow.md) | 5h | pending |
| 5 | [Open Bill Flow](phase-05-open-bill-flow.md) | 5h | pending |
| 6 | [Payment Flow](phase-06-payment-flow.md) | 4h | pending |
| 7 | [Integration & Polish](phase-07-integration-polish.md) | 4h | pending |

## Dependencies
- Phase 1 must complete first (all others depend on schema)
- Phase 2 + 3 can run in parallel after Phase 1
- Phase 4 depends on 2 + 3
- Phase 5 depends on 1 + 2
- Phase 6 depends on 4
- Phase 7 depends on all

## Key Decisions
- Claude Haiku for intent parsing (cheap, fast, good Vietnamese)
- Supabase Realtime for chat + check-ins (already in stack)
- Keep existing bill/debt tables, extend with new columns/tables
- No WebSocket server — Supabase handles all realtime
