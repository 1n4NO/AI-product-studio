# Product Studio

An AI-powered product creation pipeline that combines:
- `multi-agent-ai` for orchestrated generation and decisioning
- `themeBuilder` for design system and visual theme synthesis
- `ux-audit-tool` for deterministic quality checks before publish

## Component Architecture

`apps/studio-web` follows **Brad Frost's Atomic Design** methodology. Every UI component lives in exactly one layer of the hierarchy. Imports only flow downward — templates know about organisms, organisms know about molecules, molecules know about atoms. Nothing flows upward.

```
apps/studio-web/components/
├── atoms/               # Smallest indivisible units. No internal state, no business logic.
│   ├── Button.tsx           variant × size primitive
│   ├── Badge.tsx            status and score indicator
│   ├── Input.tsx            single-line text field
│   ├── Textarea.tsx         multi-line text field
│   ├── Label.tsx            semantic form label
│   └── ScoreRing.tsx        SVG donut score visualizer
│
├── molecules/           # Atoms composed into a single functional unit.
│   ├── FormField.tsx        Label + Input/Textarea + error
│   ├── ToneSelector.tsx     group of selectable tone chips
│   ├── ConstraintTag.tsx    removable constraint chip (single + list)
│   ├── CategoryBar.tsx      audit category name + progress bar + value
│   ├── FindingCard.tsx      severity bar + title + description + CTA
│   └── RunItem.tsx          run name + score + review badge (sidebar row)
│
├── organisms/           # Distinct UI sections built from molecules and atoms.
│   ├── Sidebar.tsx          logo, new-run button, run history, nav links
│   └── StageBar.tsx         4-step workflow progress stepper
│
└── templates/           # Layout shells with named slots. No data fetching.
    └── StudioLayout.tsx     sidebar + topbar + scrollable canvas
```

### Atomic Design Rules

1. **Atoms** import only from React, design tokens, and `lib/cn`.
2. **Molecules** import from `atoms/` and React only.
3. **Organisms** import from `molecules/`, `atoms/`, shared types, and React.
4. **Templates** import from `organisms/` and define layout structure only.
5. **Pages** (`app/` routes) import from templates, organisms, and `lib/`.
6. New components go in the lowest layer where all their dependencies already live.
7. If a component needs server data or context, it belongs in a page or a provider — not in atoms or molecules.

### Design Tokens

All visual constants live in `app/globals.css` under `@theme`. Never hard-code hex values in component files. Use Tailwind utilities generated from the token set:

| Token | Utility | Value |
|---|---|---|
| `--color-ps-canvas` | `bg-ps-canvas` | `#0c0c0f` |
| `--color-ps-surface` | `bg-ps-surface` | `#0f0f14` |
| `--color-ps-raised` | `bg-ps-raised` | `#14141e` |
| `--color-ps-border` | `border-ps-border` | `#1e1e26` |
| `--color-ps-accent` | `bg-ps-accent` / `text-ps-accent` | `#7c3aed` |
| `--color-ps-accent-dim` | `bg-ps-accent-dim` | `#4f1da3` |
| `--color-ps-accent-soft` | `text-ps-accent-soft` | `#a78bfa` |
| `--color-ps-ink` | `text-ps-ink` | `#e2e2f0` |
| `--color-ps-ink-dim` | `text-ps-ink-dim` | `#8080b0` |
| `--color-ps-ink-ghost` | `text-ps-ink-ghost` | `#4a4a6a` |
| `--color-ps-ok` | `text-ps-ok` | `#30a060` |
| `--color-ps-err` | `text-ps-err` | `#ef4444` |
| `--color-ps-warn` | `text-ps-warn` | `#eab308` |

## Vision

Product Studio takes a simple brief and produces a launch-ready landing page with:
- generated copy and section structure
- applied brand/theme tokens
- accessibility/readability/performance audit report
- prioritized fix list and optional auto-remediation

Core outcome: reduce idea-to-publish cycle from days to hours while preserving UX quality.

## Goals

- Build a single workflow from brief -> page -> audit -> fix -> publish package.
- Keep humans in control with approval checkpoints at key stages.
- Reuse existing repositories heavily to reduce build time.
- Ship MVP in incremental milestones with production hardening path.

## Non-Goals (MVP)

- Full multi-page website generation.
- Headless CMS integration at launch.
- Real-time collaborative editing.
- Advanced analytics and attribution modeling.

## Users and Primary Use Cases

- Founder/Marketer: "I need a high-converting landing page from a product idea quickly."
- Designer: "I want AI-generated themes that I can tweak before ship."
- Developer: "I want generated output that is code-usable and testable."

Main use cases:
- Generate new landing pages from scratch.
- Regenerate specific blocks (hero, CTA, FAQ) without rewriting everything.
- Run and compare UX audits across iterations.
- Export production-ready assets and implementation guidance.

## System Scope

Product Studio will include:
- Brief intake and constraints capture
- Agent orchestration layer
- Theme token generation and preview
- Landing page draft generation
- Audit pipeline and scoring
- Recommendation/fix pipeline
- Export package (JSON + markdown + optional code stubs)

## High-Level Architecture

### 1) Studio App (New)
- Purpose: control plane + user workflow UI
- Suggested stack: Next.js (App Router), TypeScript, server actions/API routes
- Responsibilities:
  - project/session management
  - workflow orchestration and state display
  - approvals and regeneration controls
  - artifacts explorer and export

### 2) Agent Orchestrator (From `multi-agent-ai`)
- Roles:
  - Strategy Agent: clarifies audience, offer, messaging angle
  - Copy Agent: produces section-level copy variants
  - Structure Agent: defines section ordering and information hierarchy
  - UX Critic Agent: pre-audit self-critique before formal audit
  - Fix Agent: applies audit-driven improvements
- Output contract: structured JSON for deterministic downstream processing

### 3) Theme Engine (From `themeBuilder`)
- Responsibilities:
  - token generation (color, type, spacing, radius, motion)
  - constraint-aware variants (brand-safe, high-contrast, playful, minimal)
  - preview payload usable by generated page renderer

### 4) Audit Engine (From `ux-audit-tool`)
- Inputs:
  - rendered HTML or URL snapshot
- Outputs:
  - grouped findings by category
  - weighted score
  - actionable recommendations
  - machine-readable fix targets

### 5) Chat Widget Extension (Optional, Phase 2; from `paas`)
- Add an optional embeddable support widget tuned to generated page context.

## Proposed Repository Strategy

Create `product-studio` as the umbrella app and bring in reusable pieces via:
- direct module extraction (preferred)
- npm workspace packages
- or git submodule/subtree only where extraction is expensive

Suggested package layout:
- `apps/studio-web` - main web app
- `packages/agent-runtime` - orchestration, prompts, contracts
- `packages/theme-engine` - token and variant logic
- `packages/ux-audit` - audit checks/adapters
- `packages/shared-types` - canonical schemas

## Canonical Data Model

### Entities
- Workspace
- Project
- Brief
- GenerationRun
- Artifact
- AuditRun
- FixRun
- ExportBundle

### Key JSON Schemas
- `BriefSchema`
  - product name, audience, value prop, tone, constraints, CTA goal
- `PageBlueprintSchema`
  - ordered sections, intent per section, required components
- `ThemeTokenSchema`
  - semantic colors, typography scale, spacing scale, radii, shadows, motion
- `AuditReportSchema`
  - category scores, findings, severity, recommendations
- `FixPlanSchema`
  - targeted changes mapped to findings

## End-to-End Workflow

1. Intake
- User submits brief and constraints.

2. Plan
- Strategy + Structure agents produce `PageBlueprint`.
- Human approves or requests revision.

3. Generate
- Copy agent creates section variants.
- Theme engine generates 2 to 4 token sets.

4. Compose
- System compiles a first-pass page draft (content + theme).

5. Audit
- Run deterministic UX audit.
- Produce scorecard and prioritized issues.

6. Improve
- Fix agent proposes targeted edits.
- Re-audit and compare deltas.

7. Export
- Deliver final artifacts:
  - approved brief
  - blueprint
  - theme tokens
  - content JSON
  - audit reports (before/after)
  - implementation notes

## Quality Gates

- Gate 1: Schema validity (all agent outputs pass JSON schema checks)
- Gate 2: Content quality baseline (no missing critical sections)
- Gate 3: UX audit threshold (minimum weighted score)
- Gate 4: Accessibility safeguards (critical checks must pass)
- Gate 5: Regression check (score must not drop after fixes)

## MVP Milestones

### Milestone 0: Foundations (Week 1)
- Initialize monorepo/workspaces.
- Set up shared schemas and validation.
- Define artifact storage model (file-based first, DB optional).

### Milestone 1: Brief -> Blueprint (Week 1 to 2)
- Integrate strategy/structure agents.
- Build brief form + blueprint review UI.
- Add approval checkpoint.

### Milestone 2: Blueprint -> Draft + Theme (Week 2 to 3)
- Integrate copy generation contract.
- Integrate theme token generation.
- Render first-pass landing page preview.

### Milestone 3: Audit + Fix Loop (Week 3 to 4)
- Connect ux audit engine to rendered output.
- Build findings UI and fix planning.
- Implement one-click re-audit after fix application.

### Milestone 4: Export + Packaging (Week 4)
- Create export bundle format.
- Add run history and version comparison.
- Ship MVP docs and demo flow.

## Backlog (Post-MVP)

- Multi-page generation (pricing, docs, contact).
- Experiment mode (A/B variants for hero/CTA).
- Brand kit import (logo, palette extraction).
- CMS connectors.
- `paas` widget auto-context injection.
- Team collaboration and comments.

## API Surface (Initial)

- `POST /api/projects`
- `POST /api/projects/:id/brief`
- `POST /api/projects/:id/generate-blueprint`
- `POST /api/projects/:id/generate-draft`
- `POST /api/projects/:id/run-audit`
- `POST /api/projects/:id/apply-fixes`
- `POST /api/projects/:id/export`
- `GET /api/projects/:id/runs`

## Observability and Reliability

- Structured logs per run and agent step.
- Correlation IDs across generation/audit/fix stages.
- Retry policy for non-deterministic model failures.
- Snapshot artifacts for reproducibility.

## Security and Governance

- Prompt and artifact versioning.
- PII-safe brief handling guidelines.
- Rate limiting for generation endpoints.
- Audit trail for approvals and final exports.

## Testing Strategy

- Unit tests:
  - schema validators
  - prompt/output mappers
  - scoring and prioritization logic
- Integration tests:
  - full pipeline with mocked model responses
- E2E tests:
  - create project -> generate -> audit -> export path
- Golden tests:
  - stable fixture briefs to catch regressions in output shape

## Success Metrics

- Time to first usable draft
- Time from first draft to audit-pass draft
- Audit score lift after fix loop
- Export acceptance rate (used without major manual rewrite)

## Risks and Mitigations

- Risk: agent output drift
  - Mitigation: strict schemas + repair/retry layer
- Risk: visually good but inaccessible themes
  - Mitigation: theme constraints + hard contrast checks
- Risk: over-long generation latency
  - Mitigation: parallel agent stages + cached intermediate artifacts

## Production Docs

- `PRODUCTION_ROADMAP.md`
- `docs/ONBOARDING_AND_OPERATIONS.md`
- `docs/INCIDENT_RUNBOOK.md`
- `docs/DEPLOYMENT_ENVIRONMENTS.md`
- Risk: low trust in AI edits
  - Mitigation: diff-first UI + approval checkpoints

## First Execution Tasks (Immediate)

1. Create monorepo skeleton under `product-studio` (`apps/`, `packages/`).
2. Port shared schema contracts from scratch into `packages/shared-types`.
3. Wrap `ux-audit-tool` checks in a callable package API.
4. Implement a minimal Studio UI with:
   - brief form
   - blueprint output panel
   - audit score panel
5. Add fixture-based integration test for one canonical brief.

## Definition of Done (MVP)

MVP is done when a user can:
- create a project from a brief,
- generate a themed landing page draft,
- run audit and apply at least one automated fix cycle,
- and export a complete artifact bundle,
with deterministic schema-valid outputs and documented run history.
