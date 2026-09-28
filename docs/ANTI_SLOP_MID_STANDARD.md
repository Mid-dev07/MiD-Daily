# MiD Daily Anti-Slop Governance

This project applies Anti-Slop v3.2.18 in DURING mode, alongside the existing MiD Unreal standards.

Editorial source: https://github.com/dharmawan-id/anti-ai-slop
Local skill: `skills/anti-slop/SKILL.md`
Local spine: `skills/anti-slop/AGENTS.md`

## Required skill coverage

- anti-slop: natural human-edited language, concrete wording, cadence variation, false-agency removal, and Indonesian-specific editorial rules.
- antislop: purpose-first decisions, craftsmanship, identity, evidence, functionality, resilience, and delivery gate.
- antislop-ui: visual hierarchy, materials, color restraint, composition, decoration, and purposeful motion.
- antislop-human: contrast, keyboard access, focus, non-text contrast, state completeness, zoom, and form reachability.
- antislop-layoutmobile: content-driven breakpoints, true reflow, overflow prevention, tap targets, touch behavior, and mobile navigation.
- antislop-copywriting: natural product language, no fabricated claims, no AI buzzword padding, and no invented facts.
- antislop-code: comments must explain non-obvious reasons or constraints; remove decorative or redundant comments without changing executable code.

## MiD adaptation

Anti-Slop does not replace MiD identity. The existing MiD design direction remains authoritative for identity, palette, typography, material roles, Unreal spatial behavior, and performance budgets.

When the rules conflict:
1. Safety, accessibility, honesty, and functional behavior win.
2. MiD identity wins over generic visual conventions.
3. Performance and maintainability constrain visual ambition.
4. A visual technique survives only when its product purpose is explicit.

## Mandatory work loop

Audit → define the purpose → implement → functional QA → human/accessibility QA → responsive QA → visual anti-slop QA → cleanup/clean code → regression → delivery.

A phase is incomplete when the implementation works but the resulting code, cascade, visual hierarchy, accessibility, or responsive behavior has regressed.

## Hard quality gates

Reject:
- non-functional controls
- dead navigation
- fabricated metrics/activity/testimonials/trust claims
- color-only status communication
- missing empty/loading/error states
- inaccessible focus states
- horizontal overflow or clipped information
- hover-only functionality
- unnecessary persistent animation

Require:
- every visual technique has a reason
- accent remains an accent
- glass, glow, and shadow have limited hierarchy roles
- responsive composition is validated across width ranges
- interactive targets remain touch-safe
- content remains readable over environmental layers
- comments remain useful and concise
- new effects prefer reuse/consolidate/replace before adding new systems

## Delivery gate

Before declaring a UI phase complete, verify:
- identity remains recognisably MiD
- no generic AI visual cluster has entered the product
- content remains primary
- all states and interactions work
- keyboard/focus behavior is intact
- contrast is verified rather than guessed
- mobile/tablet/desktop composition holds
- performance budgets remain within the project contract
- redundant code and superseded styles are removed
