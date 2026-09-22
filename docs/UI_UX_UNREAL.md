# MiD Daily — Nature Cinematic UI/UX Direction

## North star
MiD Daily should feel like a calm digital place inspired by cinematic nature photography: forest shade, fog, moss, wet stone, soft daylight, and warm natural light.

The goal is not to place a forest image behind a conventional dashboard. Nature is the visual environment in which the interface exists.

## Visual ratio
- Cinematic forest: ~70%
- Natural luxury: ~30%

Cinematic forest carries the default dark, immersive mood. Natural luxury appears through warm stone, sage, linen-like softness, and sunlight during calmer or more premium moments.

## Performance direction

The cinematic layer is intentionally lightweight for normal devices:
- no remote photographic background is required for the Dashboard Feature Landscape;
- backdrop-filter rendering is disabled in the production material layer;
- full-screen ambient motion is static instead of continuously repainting;
- pointer-following specular tracking is not used in the main application shell;
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
Nature photography is optional rather than required on the critical application path. When used in future surface treatments, it should be local or otherwise optimized, darkened for legibility, and kept out of the initial critical render.

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
