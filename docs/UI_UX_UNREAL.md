# MiD Daily — Nature Cinematic UI/UX Direction

## North star
MiD Daily should feel like a calm digital place inspired by cinematic nature photography: forest shade, fog, moss, wet stone, soft daylight, and warm natural light.

The goal is not to place a forest image behind a conventional dashboard. Nature is the visual environment in which the interface exists.

## Visual ratio
- Daylight nature environment: ~70%
- Natural luxury material system: ~30%

Daylight nature is the default mood. Forest, moss, stone, fog, foliage, and sunlight remain visible as the environment; the workspace uses ivory, linen, sage, mineral, and warm-earth materials for information surfaces. Dark tones are contrast accents, not the dominant UI.

## Performance direction

The cinematic layer is intentionally lightweight for normal devices:
- no remote photographic background is required for the Dashboard Feature Landscape;
- backdrop-filter rendering is disabled in the production material layer;
- full-screen ambient motion is static instead of continuously repainting;
- bounded pointer interaction is used only on foreground material surfaces through one delegated listener and requestAnimationFrame; the environment shell itself does not track the pointer; touch devices and reduced-motion users receive simpler static states;
- procedural grain is not rendered in the DOM;
- entry transitions use opacity/transform rather than animated blur.

The visual goal remains cinematic, but the runtime budget takes priority over decorative effects.

## Editorial spatial layer

MiD Daily now uses an editorial composition layer inspired by premium interactive portfolios without copying a specific site.

Principles:
- numbered levels ("LVLL 001", "LVLL 002", etc.) give each workspace view a sense of place and sequence;
- oversized display typography is used as a visual anchor while utility copy stays compact;
- generous negative space separates hierarchy instead of adding more cards;
- the Dashboard hero and Feature Landscape act as an environment first, interface second;
- motion remains restrained and progressively degrades on touch and reduced-motion contexts;
- responsive behavior is contract-driven: no critical positioning depends on absolute coordinates, and the mobile layout collapses into a single-column flow with bottom navigation.

This layer is intentionally lightweight: CSS gradients, transforms, controlled blur, and one photographic environment are preferred over persistent 3D canvases or heavy animation runtimes.

## Material language
1. **Dew glass**
   - translucent appearance without mandatory GPU blur
   - subtle highlight
   - lightweight painted surfaces by default
   - no cyan neon glow

2. **Natural stone / wood surface**
   - matte body
   - warm edge light
   - deep ambient shadow
   - tactile borders

3. **Recessed earth**
   - used for inputs, empty slots, and quiet controls
   - inward shadow
   - minimal highlight until focus

## Lighting
One consistent natural key light should inform surface gradients, highlights, borders, active states, and hover response.
Light should feel like sunlight or diffused canopy light rather than an artificial neon emitter.

## Color direction
Primary: deep forest, moss, muted sage, stone, fog, warm sunlight.
Semantic states: muted green success, warm ochre warning, muted clay-red danger.
Avoid bright cyan as a primary visual identity.

## Environmental photography
The production shell now uses one real nature photograph as the visual source of truth, with the procedural landscape retained only as low-opacity depth support. The photo is served through Unsplash's dynamic image transformation parameters as AVIF at bounded responsive widths and quality, with the procedural scene remaining a visual fallback.

The image treatment is intentionally subdued for product readability:
- the photograph carries realistic tree, moss, mist, and sunlight texture;
- CSS overlays provide day-phase, weather, and legibility modulation;
- module state changes crop/position by a few percent instead of running a camera system;
- no second photo is loaded merely for decoration.


## Feature landscape
Feature navigation should behave as part of the environment:
- feature nodes are material objects, not floating labels
- hover catches light and shifts depth
- active state uses warm natural light, not glow
- metadata reveals slightly on interaction
- click navigates to the real feature
- desktop uses spatial grouping
- tablet uses a tighter grid
- mobile uses stacked/two-column touch targets

Never depend on absolute pixel coordinates for critical navigation.

## Motion
Preferred: soft lift, subtle rotation, light catch, fog/atmosphere drift, short spring-like easing.
Avoid constant floating, large parallax, aggressive scale, repeated glow pulses, and generic ease-in-out everywhere.
Respect reduced-motion preferences.

## Responsive contract
Desktop: persistent sidebar, wide landscape modules, spacious composition.
Tablet: compact sidebar, single-column content when required, feature scene collapses gracefully.
Mobile: floating bottom navigation, touch-friendly controls, stacked forms, bottom-sheet style modal presentation, and sufficient content padding above fixed navigation.

## Accessibility
- visible focus states
- semantic labels
- state not communicated by color alone
- keyboard Escape for modal dismissal
- background scroll lock while modal is open
- reduced-motion preference support

## Anti-slop checklist
Reject a change when it looks like a generic AI dashboard, introduces unexplained gradients or blobs, uses neon cyan to signal importance, adds glass everywhere without hierarchy, sacrifices readability for visual drama, breaks mobile layout, or adds motion without meaningful interaction feedback.


## Final phase — ecosystem convergence

The last visual phase treats each core module as terrain inside the same living environment rather than a collection of generic cards.

- Dashboard = **clearing / orientation**: signal rail, current moment, and daily overview.
- Schedule = **rhythm / temporal terrain**: a continuous path through time.
- Tasks = **ground / focus blocks**: progress reads like a grounded work surface.
- Finance = **resources / mineral layers**: budgets and spending use restrained warm material cues.
- Social = **mist / signal**: analytics remain read-only and visually quiet.
- Assistant = **guide / signal**: conversation and integrations share a subtle directional cue.
- Profile = **personal shelter**: identity surfaces use linen/stone softness instead of generic account chrome.
- Insights = **observatory**: metrics remain analytical while gaining a restrained circular observation motif.
- Habits = **growth / cultivation**: repeated completion cells and weekly progress use organic growth cues.

This phase deliberately avoids heavy illustration, 3D runtimes, or decorative assets. The final material layer remains CSS-driven, responsive, reduced-motion aware, and content-first.

### Mobile contract — final

The nine-module field guide uses a horizontally scrollable bottom rail on small screens. The active module is automatically brought into view so navigation never requires guessing which items are off-canvas.

### Release contract

A visual phase is not considered complete merely because the stylesheet builds. The release gate requires the final ecosystem selectors to remain wired, mobile navigation to remain reachable, interactive overflow clipping to stay disabled, and the existing build, static QA, backend tests, Worker dry-run, deployment, and smoke checks to remain green.


## UI refinement — less noise, more signal

The post-convergence refinement keeps the UNREAL world intact while treating information density as a product concern.

### Page-level hierarchy
- **Today**: the primary command center now opens with live signals and places the Feature Landscape as a compact system compass. Duplicated finance and next-activity summaries were removed from secondary areas, and integration management no longer competes with daily work.
- **Schedule**: the timeline gains a lightweight live-time marker so the page communicates the current point in the day without becoming a chart-heavy calendar.
- **Tasks**: row-level utility actions are consolidated into an overflow menu; progress is shown only when the task has meaningful progress data or is complete.
- **Finance**: financial summaries remain prominent but quiet, protecting transaction review as the main working surface.
- **Social**: provider configuration language is separated into a developer disclosure so the product surface remains user-oriented.
- **Assistant**: assistant channels are limited to assistant-relevant surfaces; Instagram analytics stays in Social.
- **Profile**: identity remains intentionally narrow and personal rather than becoming a general administration page.
- **Insights**: the page is framed as a current weekly snapshot rather than implying historical analytics that are not stored.
- **Habits**: today's completion ratio is surfaced above the weekly matrix to create immediate rhythm feedback.

### Deletion rule
A UI element should survive only when it helps the user understand state, choose an action, or move to the relevant workspace. Duplicated information, provider internals, and low-value row actions should move to secondary layers or disappear.

### Responsive safeguard
Refinement changes preserve the existing mobile field-guide navigation, reduced-motion behavior, touch targets, and no-persistent-blur performance contract.


## Environment visibility refinement

The living environment is now an explicit visual layer rather than a subtle color wash:
- the scene contains layered procedural ridges, a near ground plane, tree silhouettes, canopy depth, mist, and daylight shafts;
- the shell and workspace surfaces are semi-opaque so environmental depth can remain visible through the interface without sacrificing text contrast;
- day-phase and weather state modulate the landscape tone and atmospheric layers;
- no external photographic asset or heavy 3D engine is required for the environment surface.


## Living interaction layer

The UNREAL environment now reacts to the user without turning the app into a game-like scene:
- the pointer shifts environmental light shafts, terrain depth, canopy, sun, moon, and stars by a few pixels;
- feature nodes become a focus system: one node rises and brightens, surrounding nodes quieten, and the central hub reflects the focused workspace;
- content surfaces catch a local painted highlight based on pointer position;
- navigation remains semantic and click/keyboard driven; visual motion never carries essential meaning alone;
- the interaction layer uses event delegation + requestAnimationFrame and does not introduce a canvas, WebGL runtime, external animation library, or persistent blur.


## Performance contract — realism without payload bloat

- one environment photograph only;
- AVIF, bounded to 900px mobile / 1600px desktop variants;
- quality capped at 55;
- no pointermove JavaScript in the shell;
- visual exploration uses CSS hover/focus state and bounded transform transitions;
- procedural SVG remains low opacity and exists only to preserve depth when photography is unavailable or loading;
- environment motion is limited to transform/opacity and remains disabled for coarse pointers/reduced motion.


## Final contrast contract
Readability outranks visual drama. No nature treatment may reduce the legibility of primary content.

- Primary text uses deep forest text and targets at least 4.5:1 contrast on ordinary UI surfaces.
- Secondary and muted text use dedicated daylight tokens selected to retain AA-sized contrast on ivory surfaces.
- Primary actions use dark moss surfaces with light text rather than pale green text-on-green.
- Warning and danger states use restrained ochre/clay surfaces with darker text; color is never the only state cue.
- Inputs, cards, navigation, modals, popovers, and badges retain visible surface separation even when the photographic environment is bright.
- Important content never sits directly on the photograph without a controlled surface layer.
- Focus indicators use a visible 2px outline with an offset against both light materials and the environment.

## Unreal material hierarchy
UNREAL is expressed through material behavior rather than decorative overload:

1. **Dew glass** — translucent painted surfaces, luminous inner rim, restrained depth shadow, no persistent blur.
2. **Natural stone** — matte ivory/sage body, tactile border, directional highlight, grounded shadow.
3. **Recessed earth** — mineral input wells with inward shadow and a clear focus lift.
4. **Living objects** — feature nodes and signal cards respond with lift, border catch, and subtle tonal change; no continuous floating animation.

A component must have a clear material role. Glass is not applied indiscriminately.

## Interaction contract
Interaction is CSS-first:
- hover = lift + light catch;
- focus-visible = explicit outline + edge highlight;
- active = small press/lower state;
- disabled = reduced contrast only where semantics permit, never unreadable;
- reduced-motion removes non-essential transforms and transitions.

The nature photograph remains atmospheric context. Information surfaces create the readable foreground, preserving a convincing sense that the workspace occupies the environment rather than sitting on top of a generic wallpaper.
