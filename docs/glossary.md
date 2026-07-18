# Glossary — design overhaul

Shared vocabulary for discussing the redesign, so "premium," "direction," and
"token" mean the same thing in every conversation and ADR about this project.

**Design token**
A named variable (CSS custom property in `globals.css`, e.g. `--accent`,
`--radius`, `--shadow-lg`) standing in for a raw value. Changing the token in
one place changes it everywhere it's used. The redesign changes token
*values*, not the fact that tokens exist.

**Direction**
A complete, self-consistent visual proposal (palette + type + spacing + motion
treated as one package) — not a single tweak. Task 3 produces 2-3 directions;
picking one means adopting all of it, not mixing pieces before it's built out.

**Surface / elevation**
The layered background system (`--bg` → `--surface` → `--surface-2`) that
implies depth without heavy borders — each "level" reads as slightly closer to
the viewer. Distinct from **shadow**, which is the cast-light effect that
reinforces elevation.

**Accent**
The single brand color (or small gradient) used sparingly for interactive and
emphasis moments (buttons, focus rings, the header's live-data dot). Currently
an indigo→cyan gradient (`--accent-gradient`); one of the things up for
replacement in the direction mockups.

**Semantic status color**
Color tied to meaning rather than decoration — `--good` / `--moderate` /
`--poor` / `--bad`, used for AQI and activity-score badges. These must stay
distinguishable (including for color-blind users) regardless of which
direction is chosen; this is a constraint on the palette, not a free variable.

**Card hierarchy**
The order in which information on a `CityCard` competes for attention:
currently city name → temperature → condition label → AQI badge → stat row →
activity score → forecast chart, all roughly equal weight. Part of the UX
rework is deciding what's the one thing a client should see first.

**Empty state / error state / loading state**
The three non-happy-path states a card or the page can be in: no cities added
yet, a provider request failed, and data still in flight (currently a
shimmering skeleton). All three are explicitly in scope, not just the "happy
path" card with data.

**Activity score**
The derived 0-100 number from `backend/src/services/activityScore.js` that
combines weather, air quality, and daylight into one opinionated number — the
actual business-logic value proposition being pitched to clients. Visually, it
should read as the *payoff* of the dashboard, not just another stat.

**Micro-interaction**
A small, purposeful bit of motion tied to one user action (hover, focus, add,
remove) — as opposed to decorative animation with no functional signal.
"Motion feels abrupt/missing" was a named gripe; the fix is adding or
smoothing these, not adding animation for its own sake.

**Premium (as used in this project)**
Not a specific palette — a set of qualities: restraint (few colors, used
deliberately), consistency (the same spacing/radius/motion values reused
everywhere rather than one-off numbers), and responsiveness that doesn't
degrade the experience on mobile. A direction can be dark or light, minimal or
bold, and still satisfy this definition or fail it.

**Live link (viewing context)**
The distribution method for this dashboard to potential clients: a URL they
open themselves, on their own device, with no one narrating. This is why
mobile layout is a hard requirement rather than a "nice if there's time"
pass — there's no fallback to "let me show you on my screen instead."
