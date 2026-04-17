# Product Requirements Document (PRD) Template

## Document Information

| Field | Value |
| --- | --- |
| **Product Name:** | [Enter product name] |
| **Version:** | [e.g., v1.0] |
| **Author(s):** | [Your name & team] |
| **Last Updated:** | [Date] |
| **Status:** | [Draft/Review/Approved] |

---

## 1. Executive Summary

> Write this section last! Summarize the key points in 3-5 sentences that a busy executive can quickly understand.

[Provide a brief overview of what you're building, why, and for whom. Include the main customer problem and your proposed solution.]

---

## 2. The Customer Problem

### 2.1 Problem Statement

> Focus on the customer's pain, not your solution. Use their words, not technical jargon.

**Example:** "Small business owners waste 5+ hours weekly reconciling receipts because they lack a simple way to capture and organize expense data on-the-go."

[Describe the specific problem customers face. Be concrete and measurable.]

### 2.2 Customer Evidence

> Include real quotes, survey data, or support tickets. Numbers make your case stronger!

- **Customer interviews:** [How many? Key insights?]
- **Support tickets:** [Common complaints?]
- **Analytics data:** [What behaviors show the problem?]
- **Market research:** [Industry reports, competitor analysis]

---

## 3. Target Customers

### 3.1 Primary Persona

> Personas live as standalone files in `personas/<persona-slug>.md` (one persona per file, schema in `templates/persona.md`). PRD references them by link so they can be **reused across PRDs and feed the UAT workflow** after pilot/release.

- **Primary:** [`personas/<slug>.md`](../personas/<slug>.md) — [Name, Role, 1-line summary]
- **Secondary (if any):** [`personas/<slug>.md`](../personas/<slug>.md) — [Name, Role, 1-line summary]

> If persona file doesn't exist yet, prd-writer creates it from the brainstormer handoff before filling this section. Existing personas relevant to this product MUST be reused (do not duplicate).

### 3.2 Customer Journey

> Map how customers currently solve this problem. Where do they struggle? Where can we help?

- **Awareness:** [How do they realize they have this problem?]
- **Research:** [How do they look for solutions?]
- **Decision:** [What factors influence their choice?]
- **Onboarding:** [First experience with the solution]
- **Success:** [What does success look like for them?]

---

## 4. Solution Overview

### 4.1 Product Vision

> Complete this sentence: "We believe [target customers] need [solution] to achieve [goal] because [insight]."

[Describe your vision for how this product solves the customer problem]

### 4.2 Key Benefits (Customer Value)

> Focus on outcomes, not features. What will customers be able to DO that they couldn't before?

- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

### 4.3 Platform

> Verified với PO trong brainstorm. 1 lựa chọn duy nhất.

- [ ] Web responsive (desktop + mobile browser)
- [ ] Mobile-first PWA
- [ ] Native iOS/Android
- [ ] Other: _____

**Rationale:** [Why this platform — user behavior, infra constraints, MVP speed, etc.]

### 4.3a BE/DB Stack (recommendation — final choice in `/team-vibe`)

> PRD-writer recommends ONE primary stack với rationale; final PO confirm happens during `/team-vibe` Step 5 (where user can override).

- [ ] **Cloudflare Workers + D1 + better-auth (Recommended default)** — edge-first, generous free tier, single vendor. Best fit: cost-sensitive MVP, global low-latency. See `templates/be-stacks/cloudflare.md`.
- [ ] **Supabase (Postgres + Auth + Storage + Realtime)** — Postgres power, mature OAuth/RLS, realtime built-in. Best fit: realtime features, Postgres extensions (pgvector/postgis/full-text), Supabase Studio ops. See `templates/be-stacks/supabase.md`.
- [ ] Other: _____

**Recommendation rationale:** [1-2 sentences — why this stack fits THIS product based on PRD scope/persona/scale]

### 4.4 Epics

> **3-5 epics MAX** per PRD. Mỗi epic = capability boundary, mutually distinct (no overlap). Brainstormer phải apply **consolidation review** trước khi commit list: nếu hai epic candidates có user-story overlap >40% hoặc share same primary persona+capability → merge. User stories chi tiết trong section 5.

| # | Epic | Brief | Priority | Persona |
| --- | --- | --- | --- | --- |
| E1 | [Epic name] | [1-line capability] | P0/P1 | [`personas/<slug>.md`] |
| E2 | [Epic name] | [1-line capability] | P0/P1 | [`personas/<slug>.md`] |

> **Consolidation log (required):** if any epic candidates were merged during brainstorm review, list the merge here for traceability:
> - `[E_old_a + E_old_b] → E_new` — Reason: shared persona X + capability Y

---

## 5. User Stories & Requirements

> Format: "As a [persona], I want to [action] so that [benefit]." **Acceptance Criteria are nested INSIDE each user story** (no separate AC section) — so each story carries its own testable contract.
>
> **ID convention:** `US-<EpicID>-<n>` (e.g. `US-E1-1`, `US-E1-2`, `US-E2-1`). Stable IDs let Playwright tests, design files, and UAT scripts reference stories without rewrites when ordering changes.

### 5.1 Must-Have (MVP)

> Group by Epic. Each user story has its own Acceptance Criteria checklist (Playwright-testable, measurable thresholds).

#### E1 — [Epic name]

**US-E1-1** — As a [persona link from `personas/<slug>.md`], I want to [action] so that [benefit].
- **Priority:** P0 / **Effort:** S/M/L
- **Acceptance Criteria:**
  - [ ] AC-E1-1.1: [Specific testable criterion — vd: "User can submit expense with photo receipt; appears in dashboard within 5s"]
  - [ ] AC-E1-1.2: [Another criterion]

**US-E1-2** — As a [persona], I want to [action] so that [benefit].
- **Priority:** P0 / **Effort:** S
- **Acceptance Criteria:**
  - [ ] AC-E1-2.1: [...]

#### E2 — [Epic name]

**US-E2-1** — As a [persona], I want to [action] so that [benefit].
- **Priority:** P1 / **Effort:** M
- **Acceptance Criteria:**
  - [ ] AC-E2-1.1: [...]
  - [ ] AC-E2-1.2: [...]

### 5.2 Nice-to-Have (Post-MVP)

> Lighter shape — title + persona + 1-line benefit; AC deferred to PRD revision.

- **Post-US-1:** As a [persona], I want [feature] so that [benefit]. (Effort: L)
- **Post-US-2:** ...

### 5.3 AC Coverage Summary (auto-derived, optional)

> Convenience rollup. Sum of all `AC-*` items above. Used by `/team-vibe` Phase 3 evaluator to verify Playwright spec count matches AC count.

- Total ACs: [N]
- Per epic: E1=[n], E2=[n], ...

---

## 6. Success Metrics

> Choose 3-5 key metrics that directly relate to customer success, not vanity metrics.

### 6.1 Customer Success Metrics

| Metric | Current | Target |
| --- | --- | --- |
| Task completion rate | [e.g., 45%] | [e.g., 85%] |
| Time to value | [e.g., 7 days] | [e.g., < 1 day] |
| Customer satisfaction | [e.g., 3.2/5] | [e.g., 4.5/5] |

### 6.2 How We'll Measure

[Describe your measurement plan: What tools? What cadence? Who's responsible?]

---

## 7. Risks & Assumptions

> Being honest about risks shows maturity and helps the team prepare mitigation strategies.

### 7.1 Key Assumptions We're Making

- [e.g., Customers are willing to change their current workflow]
- [e.g., We can integrate with existing tools they use]

### 7.2 Risks & Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| [Describe risk] | High/Med/Low | [How to address] |

---

## 8. Timeline & Milestones

> Work backwards from your launch date. Include customer validation checkpoints!

| Milestone | Key Deliverables | Target Date |
| --- | --- | --- |
| Research | Customer interviews, competitive analysis | [Date] |
| Design | Wireframes, prototypes, usability testing | [Date] |
| Build | Development sprints, QA testing | [Date] |
| Beta | Beta release, feedback collection | [Date] |
| Launch | Public release, marketing campaign | [Date] |

---

## 9. Stakeholders & Team

> Include everyone who needs to be informed or can block your progress. Don't forget customer-facing teams!

| Role | Name | Responsibility |
| --- | --- | --- |
| Product Manager | [Name] | Overall success |
| Engineering Lead | [Name] | Technical delivery |
| Design Lead | [Name] | User experience |
| Customer Success | [Name] | Customer feedback |

---

## 10. PRD Quality Checklist

> Use this checklist before sharing your PRD:

- [ ] Can a new team member understand the problem in 2 minutes?
- [ ] Is the customer's voice present (quotes, data, evidence)?
- [ ] Are success metrics specific and measurable?
- [ ] Would a customer recognize their problem in your description?
- [ ] Have you identified what you WON'T build (scope boundaries)?
- [ ] Is the timeline realistic with buffer for unknowns?
- [ ] Have you talked to at least 5 potential users?
- [ ] Can the team start working with this information?
