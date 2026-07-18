# ADR 0001: Design overhaul direction and scope

**Status:** Accepted
**Date:** 2026-07-18

## Context

The dashboard's current frontend (`frontend/app/globals.css` + components) already
implements a fairly deliberate dark-glassmorphism UI: CSS custom-property design
tokens, a gradient-text header, blurred glass cards with hover-lift and glow
shadows, shimmer skeleton loaders, and semantic status colors for AQI/activity
score. This is not a bare-bones or dated UI — it already covers several boxes on
a "premium SaaS dashboard" checklist.

The request was to do a "complete design overhaul" so the project feels premium
and eye-pleasing to potential freelance clients. Given the existing UI is
already reasonably polished, the overhaul was scoped through a short interview
rather than assumed, to avoid redoing work that doesn't need it and to avoid
solving the wrong problem.

## Decision drivers (from interview)

- **Trigger:** the requester has seen the live UI and specific things feel
  off — not a vague "make it nicer" ask.
- **Specific gripes called out:** typography, color & contrast, spacing &
  density, and motion/micro-interactions all named as off — i.e., every visual
  dimension, not one isolated issue.
- **UX flows in scope, not just visuals:** add-city interaction, empty/error
  states, card information hierarchy, and overall page structure (currently a
  single long scroll with no nav/sections) are all called out for rework.
- **Style reference:** none supplied. The requester wants original directions
  proposed rather than a copy of an existing product's look.
- **Viewing context:** this will be sent to clients as a **live link they open
  themselves** — mobile/responsive behavior is a hard requirement, not a nice
  to have, since there's no one present to narrate around a broken layout.

Given gripes were selected across all four visual axes and all UX flows, this
is effectively a full front-end design pass, not a spot-fix — consistent with
the original "complete overhaul" framing.

## Decision

1. **Scope: full visual + UX rework**, covering typography, color palette,
   spacing/density, motion, the add-city flow, empty/error states, card
   hierarchy, and overall page structure. Not a token-only tweak.
2. **Technical approach: keep vanilla CSS + the existing custom-property token
   system.** Rejected alternatives:
   - *Tailwind migration* — would require rewriting every component's
     className usage for a stack change that doesn't address any of the named
     gripes (typography/color/spacing/motion are token and design decisions,
     not a CSS-methodology problem). Adds migration risk with no upside for a
     solo-maintained project.
   - *Component library (shadcn/ui, Radix)* — useful for complex interactive
     primitives (menus, dialogs), but this dashboard's interactive surface
     (one text input, buttons, cards) doesn't need it. Revisit only if v2 adds
     real overlay/menu complexity.
   - Rationale: the existing token system (`--bg`, `--surface`, `--accent`,
     `--good/moderate/poor/bad`, `--radius`, `--shadow*`) is already
     well-structured and semantically named. The problem is the *values and
     application* of the tokens (and the states/flows around them), not the
     mechanism. Refining in place is lower-risk and keeps a solo-maintained
     codebase simple.
3. **No fixed style reference — present distinct original directions.**
   Because the requester didn't name a reference product, the next step is
   to produce 2-3 genuinely different direction mockups (not incremental
   variations of the current theme) and let the requester react, rather than
   guessing a single direction and building it all the way out.
4. **Mobile responsiveness is a first-class constraint**, not an
   afterthought pass at the end, because the primary distribution channel to
   clients is a live link opened on whatever device they have.

## Consequences

- Every component (`CityCard`, `AddCityForm`, `AqiBadge`, `ActivityScore`,
  `ForecastChart`) and `page.js`'s structure/empty/error states are in scope,
  not just `globals.css` tokens.
- Before writing final implementation CSS, direction mockups get built and
  approved first (see `docs/glossary.md` for the vocabulary used to discuss
  them), to avoid rebuilding the whole surface twice.
- Because the library/framework choice is "no change," this ADR does not
  block on a dependency decision — work can start immediately on the chosen
  direction once picked.
- Follow-up ADR expected once a direction is picked, recording the specific
  palette/type/motion decisions made and why, so a future pass (or another
  developer) understands the reasoning instead of just the resulting CSS.
