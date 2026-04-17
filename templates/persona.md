---
name: <persona-slug>
display_name: <Display Name, vd "Sarah - Marketing Manager">
type: primary | secondary
created_for_prd: <prd-slug>
last_updated: <YYYY-MM-DD>
used_by_prds:
  - <prd-slug-1>
used_by_uat:
  - <uat-script-path>
---

# <Display Name>

> Persona file — single source of truth, reused across PRDs and consumed by UAT (User Acceptance Test) workflow after pilot/release.

## Profile

| Field | Value |
| --- | --- |
| **Role:** | [e.g., Marketing Manager at mid-size B2B SaaS] |
| **Demographics:** | [Age range, location, team size context] |
| **Tech savviness:** | Beginner / Intermediate / Advanced |
| **Tools currently used:** | [List 3-5 tools they live in daily] |

## Goals

> What they're trying to achieve in their work / life. Outcome-oriented, not feature-oriented.

- [Goal 1 — measurable if possible]
- [Goal 2]
- [Goal 3]

## Frustrations / Pain Points

> The friction THIS product is supposed to remove. Concrete examples.

- [Pain 1 with frequency: "Spends 5+ hrs/week reconciling X manually"]
- [Pain 2]

## Day-in-the-life Scenario

> Narrative paragraph (3-6 sentences) describing a typical workflow / situation where pain manifests. Helps PRD reviewers + UAT testers visualize the persona.

[Walk through a representative scenario.]

## UAT Hooks

> **Consumed by `/team-uat` workflow** (or manual UAT scripts) after product pilot/release. Defines what "the product working for THIS persona" looks like in the wild.

### Trigger conditions
> Real-world scenarios in which this persona will exercise the product. UAT scripts iterate over these.

- [Scenario 1: vd "First Monday of month — needs to file expense report"]
- [Scenario 2]

### Success indicators (delight signals)
> Concrete signals that the product is solving the persona's pain. Each maps to a UAT pass criterion.

- [vd "Completes expense submission in <2 min without consulting docs"]
- [vd "Returns voluntarily next week without prompt"]

### Failure modes (regression watch)
> What breaks the experience for this persona. UAT scripts assert these don't happen.

- [vd "Can't find the upload button on first try"]
- [vd "Mobile flow drops attached photo on session timeout"]

## Cross-references

- **PRDs using this persona:** see frontmatter `used_by_prds`
- **UAT scripts:** see frontmatter `used_by_uat` (added by /team-uat when scripts generated)
- **Design files referencing this persona:** [`designs/<slug>.pen` if applicable]
