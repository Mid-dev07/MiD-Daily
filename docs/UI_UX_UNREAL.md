# MiD Daily — Unreal-Grade Native UI/UX Direction

## North star

MiD Daily is a daily-management workspace first. **UNREAL is the material and interaction quality bar, not a reskin.**

The interface must remain recognisably MiD:
- same core workspace structure and navigation;
- same editorial hierarchy and daily-management purpose;
- same living environment as contextual atmosphere;
- same readable, calm information density.

UNREAL means the interface feels intentionally manufactured: depth, material response, lighting, hierarchy, spatial separation and interaction quality.

## Identity contract

The visual identity is built from five persistent constants:

1. **MiD dark base** — `#0a1119`
2. **MiD surface family** — deep blue-grey / mineral surfaces, not saturated blue.
3. **Electric cyan** — `#4fd1ff` as the interaction/signature color, not the page background.
4. **Semantic accents** — success `#4ade80`, warning `#fbbf24`, danger `#fb7185`.
5. **145deg key light** — the same directional light logic informs rims, bevels, highlights and raised surfaces.

A screen should read as dark neutral material first and accent second.

## Material system

UNREAL uses three principal material roles:

### 1. Glass panel
MiD now uses glassmorphism as the primary surface language while keeping the living environment visible underneath.

Glass is intentionally hierarchical:

- **G0 — environment:** the procedural living scene remains the source of ambient color and depth.
- **G1 — shell glass:** sidebar and topbar use controlled frosted glass.
- **G2 — clear glass:** cards and data surfaces use translucent layered glass with rim light; most do not invoke backdrop blur.
- **G3 — recessed glass:** inputs and quiet controls use inward depth and restrained translucency.
- **G4 — dense glass:** search, modal and command surfaces use stronger frost and depth.

Use:
- layered translucent gradients;
- a restrained rim and top-left highlight;
- soft occlusion shadow;
- local pointer reflection through the existing delegated interaction stream;
- natural environment color bleeding through translucent surfaces.

Do not:
- cover every component in heavy blur;
- animate blur itself;
- stack opaque glass over opaque glass without hierarchy;
- turn every interaction into a glow effect.

The result should read as **material glass**, not transparent rectangles.

### Experience System V3
The current implementation has one visual authority after the structural UI system:
- `experience.css` owns environment presentation, shell material, page stage, glass hierarchy, module terrain, responsive composition, and hide-state compositing;
- `ui-system.css` owns shared structural/component behavior and the 4pt rhythm;
- superseded `glass.css` overrides are intentionally removed to prevent cascade drift.

### 2. Emissive
Reserved for meaningful attention:
- primary action;
- active navigation;
- focused module;
- progress signal;
- live state.

Emission must remain local. A primary button can glow; the entire page must not.

### 3. Recessed
Used for:
- inputs;
- search fields;
- quiet controls;
- empty slots;
- secondary data wells.

The visual language is inward shadow + restrained edge highlight + strong focus state.

## Lighting

The light model is one directional 145deg key light plus restrained ambient fill.

Lighting hierarchy:
1. information readability;
2. material separation;
3. interaction highlight;
4. atmosphere.

Never reverse that order.

## Color ratio

A healthy default composition is approximately:

- 75–85% dark neutral / mineral material;
- 8–12% environmental/natural tone;
- 3–7% cyan interaction/signature;
- semantic colors only where state requires them.

This prevents the interface from becoming a cyan theme or a rainbow dashboard.

## Module terrain

Modules share one MiD material system but receive restrained local accents:

- Dashboard — cyan / orientation
- Schedule — violet / temporal rhythm
- Tasks — green / progress
- Finance — amber / resources
- Social — rose / signal
- Assistant — cyan-light / guidance
- Profile — silver / identity
- Insights — indigo / observation
- Habits — soft growth green

The module accent changes small details: active rail, kicker, indicator, progress and local light. It must not recolor the entire screen.

## Environment

The existing MiD living environment remains part of the identity.

The environment is:
- procedural rather than a static wallpaper;
- responsive to day/weather/workload state;
- subdued enough to protect content;
- lightweight and CSS-driven;
- allowed to retain natural terrain, fog, celestial light, and warm atmospheric color.

The environment is not replaced by a sci-fi blue gradient.

## Spatial language

The existing editorial composition remains intact:
- numbered workspace system;
- oversized display type;
- generous negative space;
- Feature Landscape as spatial navigation;
- focused module hierarchy.

UNREAL is introduced by the **quality of the surfaces and transitions**, not by rearranging the product into a generic sci-fi dashboard.

## Interaction

Interaction follows:

- hover → local light catch + 1–2px lift;
- focus → visible edge + keyboard-safe outline;
- active → subtle press;
- selected → local emissive rim;
- disabled → reduced energy, not invisible;
- reduced motion → retain hierarchy without non-essential motion.

Pointer lighting stays delegated through the existing application interaction stream and requestAnimationFrame. No new per-component pointer listeners.

## Typography

Keep Inter for UI and display. Use mono typography only for:
- indices;
- timestamps;
- telemetry;
- compact metadata.

Do not overuse monospace as decoration.

## Rhythm

The whole UI uses a strict 4pt foundation:

- 4px micro relation;
- 8px tight relation;
- 12px standard row spacing;
- 16px component boundary;
- 24px section boundary;
- 32px hero / scene spacing.

Controls remain 44px high and touch targets remain 48px.

## Motion

Preferred:
- opacity;
- transform;
- short spring lift;
- local light catch;
- restrained scale;
- short enter/exit transition.

Avoid:
- constant floating;
- giant parallax;
- repeated glow pulses;
- scroll-jacking;
- full-screen blur animation;
- game-like motion for ordinary task management.

## Performance contract

UNREAL is an art direction constraint, not a runtime excuse.

Required:
- no WebGL/canvas runtime for ordinary UI;
- backdrop blur is limited to shell and transient command/modal surfaces;
- blur values stay tokenized and are never animated;
- no new animation dependency unless justified;
- no image added solely for decoration;
- keep the existing asset budgets;
- use CSS compositing before JavaScript;
- reuse the existing delegated interaction system;
- keep the complete visual material system isolated in `experience.css` so future cleanup does not scatter material overrides across the structural layout system.

## Acceptance criteria

A visual change is rejected when:

- MiD identity becomes unrecognisable;
- the page reads as a blue/cyan theme;
- module accents recolor whole screens;
- every card becomes glass;
- effects are visible before content;
- spacing breaks the 4/8 rhythm;
- mobile hierarchy becomes weaker;
- interaction exists only for spectacle;
- performance budget worsens without a clear product benefit.

The correct result should feel like **MiD, but materially elevated** — not like a different application wearing the MiD logo.

## Render Core — Phase 1

The first runtime layer of the UNREAL experience is now implemented as a delegated, CSS-composited render core.

It adds:
- local pointer-driven light vectors rather than a binary hover glow;
- pointer-relative micro-tilt capped at 1.25deg for interactive surfaces;
- elevation response using local depth and shadow modulation;
- a screen-space specular catch-light that follows the pointer;
- slow world-atmosphere breathing on clouds, shafts, and fog;
- reduced-motion and coarse-pointer fallbacks.

The system still avoids WebGL/canvas and new animation dependencies. Future phases should build view-specific spatial composition and material-specific behavior on top of this render core instead of stacking unrelated global effects.
