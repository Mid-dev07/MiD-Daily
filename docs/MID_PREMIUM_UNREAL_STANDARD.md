# MiD Daily — Premium Unreal UI/UX Operating Standard

Core objective: make MiD Daily feel unusually premium and memorable while remaining light, calm, fast, and effortless for everyday use.

This document is the master operating standard for future MiD visual, interaction, motion, and frontend decisions.

## 01 — North Star

MiD must feel like:
a beautifully engineered personal operating space, not a template dashboard.

The experience has two simultaneous goals:

### Premium
The user notices intentionality:
- measured spacing;
- precise typography;
- believable materials;
- controlled depth;
- coherent lighting;
- meaningful interaction;
- original visual identity;
- every element has a reason to exist.

### Light
The user does not notice the implementation cost:
- fast navigation;
- no heavy visual engine;
- no unnecessary animation;
- no visual clutter;
- no oversized component trees;
- no decorative assets that add little value;
- graceful behavior on ordinary phones and laptops.

### Non-boring
The product stays interesting through meaningful variation, not constant motion.

Variation comes from:
- context;
- state;
- focus;
- hierarchy;
- progressive disclosure;
- subtle environmental response;
- useful micro-interactions;
- changing daily information.

Never use movement as a substitute for product quality.

## 02 — The MiD Identity Must Never Be Lost

UNREAL is an evolution layer, not a reskin.

Identity anchors:
- MiD dark base: #0a1119
- mineral blue-grey surface family;
- electric cyan #4fd1ff as the interaction/signature accent;
- semantic green / amber / rose states;
- 145deg directional key light;
- numbered workspace system;
- editorial typography;
- Feature Landscape / spatial workspace compass;
- living environment as context;
- compact, information-first daily-management model.

A screen should read as dark neutral material first and accent second.

A change fails when a person could mistake MiD for:
- a generic SaaS dashboard;
- a cyberpunk neon interface;
- a generic glassmorphism app;
- a game menu;
- an AI-generated landing page;
- a copied portfolio interaction pattern.

Correct result:
This is MiD, but at a much higher material and interaction quality.

## 03 — Unreal Standard

UNREAL does not mean neon, excessive 3D, or game-like decoration.

It means the interface behaves as if it has been designed with a high-quality rendering mindset.

### Depth
Every important surface has an intentional spatial relationship:
- background;
- environment;
- shell;
- panel;
- control;
- local content.

### Material
Allowed primary roles:

Glass panel:
- painted translucency;
- subtle inner rim;
- controlled transparency;
- localized light catch;
- grounded shadow.

Recessed:
- inward shadow;
- darker body;
- quiet surface;
- strong focus response.

Emissive:
- limited to attention states;
- primary action;
- active selection;
- live progress;
- important status.

Solid / mineral:
- quiet structural surfaces;
- navigation shell;
- neutral information containers.

### Lighting
The canonical key light is 145deg.

The same direction should inform:
- highlights;
- bevels;
- active edges;
- raised surfaces;
- local reflections.

Lighting must feel consistent across the entire application.

### Spatial realism
Use:
- layered shadows;
- contact shadows;
- edge highlights;
- bevel-like gradients;
- perspective where helpful;
- restrained parallax;
- local specular response.

Do not use:
- permanent floating cards;
- excessive glow;
- giant ambient blobs;
- fake 3D everywhere;
- decorative perspective that hurts readability.

## 04 — Premium UI Standard

Premium is not created by adding more.

Premium is created by removing weak decisions.

Every component must answer:
1. What is its job?
2. What is its material?
3. What is its hierarchy level?
4. What happens when the user interacts?
5. What happens when the user ignores it?
6. What is the least visual energy required to communicate its state?

### Visual hierarchy
Level 1 — focal:
one dominant object or information group.

Level 2 — working:
controls and content required for the current task.

Level 3 — supporting:
context, metadata, secondary actions.

Level 4 — ambient:
environment and non-essential decoration.

Never allow Level 4 to compete with Level 1.

## 05 — Anti-Generic Rule

Reject these patterns unless there is a very strong product reason:
- card grid where every card has identical treatment;
- giant hero title on every page;
- gradient blobs;
- rainbow accent systems;
- excessive pill-shaped UI;
- excessive rounded rectangles;
- stock dashboard illustrations;
- random glassmorphism;
- icon + title + paragraph repeated everywhere;
- meaningless charts;
- fake metrics;
- permanent shadows on every element;
- decorative labels that do not help navigation;
- animation that repeats forever.

MiD should be memorable through composition and behavior, not ornament.

## 06 — Lightweight Experience Standard

UNREAL effects must remain cheap.

Mandatory:
- CSS-first before JavaScript;
- no WebGL/canvas for normal interface presentation;
- no new animation library without a documented benefit;
- no persistent blur layer;
- no continuous full-screen animation;
- no per-card pointer listeners;
- reuse delegated interaction and requestAnimationFrame;
- prefer transform and opacity;
- prefer one atmosphere layer over many decorative layers;
- prefer one reusable material system over bespoke effects.

### Current production asset ceilings
These are hard limits:
- largest JS gzip: 320 KiB
- total CSS gzip: 48 KiB
- total frontend assets: 2 MiB
- media/font assets: 1.28 MiB

Design work must not use these limits as a target to fill.

### Regression rule
New visual work follows:
reuse → consolidate → replace → only then add.

Every new effect must either:
- replace a weaker effect;
- increase usability;
- increase information clarity;
- materially improve the signature experience.

## 07 — Non-Boring Experience System

Boredom usually comes from repetition, not stillness.

Important screens use a three-part cadence:

Focus:
what matters right now?

Action:
what can I do immediately?

Discovery:
what can I explore next when I have time?

This prevents:
- everything looking equally important;
- everything demanding attention.

### Daily freshness
MiD should feel slightly different each day because the content state changes:
- workload;
- schedule density;
- finance state;
- habit momentum;
- assistant proposals;
- environmental conditions.

Visual changes should follow that data subtly.

Never fake freshness through random animation.

## 08 — Interaction Standard

Hover:
- local light catch;
- 1–2px lift;
- slight border response.

Focus:
- highly visible outline;
- local edge highlight;
- no color-only state.

Active:
- tiny downward press;
- reduced shadow;
- slightly reduced elevation.

Selected:
- local emissive rim;
- stronger label contrast;
- surrounding elements may recede.

Disabled:
- lower visual energy;
- never unreadable;
- never ambiguous.

### Motion
Preferred:
- micro response 120–160ms;
- normal interaction 180–240ms;
- scene/state transition 260–360ms.

Motion must communicate cause and effect.

Do not animate purely because an element exists.

## 09 — Boredom Prevention Without Heaviness

Do not make the interface interesting by making it busy.

Use controlled variation in:
- module accent;
- material contrast;
- information layout;
- focal object;
- environmental lighting;
- visualization shape;
- empty-state composition.

Rule:
One system, multiple personalities.

Not:
Nine unrelated themes.

## 10 — Module Personality Standard

Modules share one MiD material system but receive restrained local accents:

| Module | Personality | Accent |
| --- | --- | --- |
| Dashboard | orientation / command center | cyan |
| Schedule | rhythm / temporal flow | violet |
| Tasks | progress / focus | green |
| Finance | resources / value | amber |
| Social | signal / communication | rose |
| Assistant | guidance / intelligence | cyan-light |
| Profile | identity / shelter | silver |
| Insights | observation / analysis | indigo |
| Habits | cultivation / consistency | growth green |

The accent may influence:
- active rail;
- indicator;
- progress;
- local lighting;
- selected control.

It must never recolor the whole page.

## 11 — Typography Standard

Typography should feel quiet and expensive.

UI:
Inter or an equivalent neutral sans.

Display:
stronger display sizing only where hierarchy benefits from it.

Mono:
only for indices, timestamps, telemetry, and compact technical metadata.

Rules:
- avoid excessive uppercase;
- avoid oversized text everywhere;
- avoid too many competing weights;
- avoid decorative fonts;
- avoid dense text blocks when hierarchy can communicate the same information.

Typography is a structural tool, not decoration.

## 12 — Layout Standard

Strict 4pt rhythm:
- 4px micro relation;
- 8px tight relation;
- 12px row/metadata;
- 16px component;
- 24px section;
- 32px hero/spatial.

Controls:
- 44px standard control height;
- 48px touch target.

Use alignment, negative space, controlled asymmetry, hierarchy, and repetition with variation.

Avoid accidental empty space, random offsets, equal visual weight everywhere, and dense card walls.

## 13 — Environment Standard

The environment is part of MiD identity.

It is now a real spatial layer, not only a CSS background.

It may use one bounded WebGL2 canvas with procedural geometry to establish:
- depth;
- architecture;
- material presence;
- camera perspective;
- contextual light;
- spatial continuity between workspaces.

It should:
- create atmosphere;
- establish time and mood;
- support context;
- remain subdued behind content;
- respond subtly to real state;
- degrade to the existing CSS environment when WebGL2 is unavailable.

It must never:
- become wallpaper competing with text;
- become a cyberpunk environment;
- become a tech demo whose complexity is visible to the user;
- continuously animate;
- dominate every page.

Foreground always wins.

The renderer is an environmental instrument, not the product UI.

## 14 — Responsive Standard

Responsive behavior is a product constraint, not a finishing step.

MiD must adapt as a system across:
- desktop monitors;
- laptops;
- tablets in portrait or landscape;
- phones of different widths and heights.

The layout may change composition, navigation placement, density, typography, and environmental intensity, but product semantics remain stable.

Canonical device classes:
- Wide desktop: 1280px and above.
- Laptop: 1024–1279px.
- Tablet/small touch: 768–1023px, with the final touch navigation transition at 820px.
- Phone: 560px and below.
- Compact phone: 390px and below.

Rules:
- never squeeze desktop columns into a phone;
- preserve 48px touch targets;
- support safe-area insets;
- never depend on hover for meaning or critical actions;
- spatial world intensity must reduce on small screens;
- bottom navigation is preferred over a compressed desktop sidebar on touch layouts;
- content width must remain fluid and never cause accidental horizontal overflow;
- controls and toolbars may stack or become scrollable when space is insufficient;
- hierarchy and task order must remain recognizable across all device classes.

Responsive changes must be intentional composition changes, not simply smaller typography.

## 14.1 — Spatial Workspace Composition

The WebGL environment and the DOM workspace form one spatial composition.

Rules:
- the world establishes place, atmosphere, depth, and contextual orientation;
- DOM remains authoritative for all product information and actions;
- each workspace has one clear primary spatial surface, supporting instruments, and quiet background layers;
- not every section becomes a raised card;
- depth is semantic: orientation surfaces sit forward, working surfaces occupy the main plane, supporting information recedes;
- module personality changes small accents and emphasis, not the entire material vocabulary;
- mobile and touch layouts remove depth transforms while retaining hierarchy;
- reduced motion retains hierarchy and state while removing spatial movement;
- spatial composition must remain usable when the environment renderer falls back to CSS.
- workspace navigation may move the camera along a bounded semantic rail tied to module anchors.
- each module anchor owns an explicit camera eye/target intent so the rail is authored as composition, not derived from renderer magic multipliers.
- pointer response is a restrained micro-orbit around that authored camera intent, never a second navigation system.
- spatial motion is event-driven: navigation and pointer response may move the scene, but the world must not rely on perpetual decorative animation loops.
- a calm workspace should feel alive through light, weather, state, and composition rather than constant movement.
- the active module may have a restrained ground-level spatial path connecting its world anchor to the shared workspace core.
- the path is contextual orientation, not decoration: it should remain subtle, non-animated, and disappear naturally on small/touch layouts when the spatial world is reduced.

The composition system is reusable across all nine modules and should be extended through semantic roles before adding one-off visual hacks.
- semantic roles also own micro-lateral stage offsets so the workspace reads as a composed field rather than a flat stack of equal-width cards;
- lateral offsets stay small, deterministic, role-owned, and disappear on touch/mobile and reduced-motion modes.

## 14.2 — Spatial Semantic Roles

Workspace markup should describe spatial intent with `data-spatial-role` rather than encoding depth through one-off page selectors.

Canonical roles:
- `orientation`: establishes where the user is in the workspace.
- `controls`: filters, navigation, or command surface.
- `metrics`: compact high-priority signals.
- `primary`: main working surface.
- `focus`: active work or rhythm surface.
- `rhythm`: ambient daily/behavioral signal.
- `secondary-group`: grouped supporting instruments.
- `supporting`: secondary information surface.
- `utility`: low-priority integration/settings surface.
- `archive`: historical or lower-priority records.
- `identity`: personal identity surface.
- `instrument`: small working object inside a larger spatial surface.

Depth and material must follow semantic role. Canonical material grammar is:
- primary / focus: controlled glass depth with restrained atmospheric highlight;
- supporting / secondary-group: matte/receded working surfaces;
- controls / instrument: recessed instrument surfaces with inner depth;
- metrics: compact HUD-like signal surfaces;
- rhythm: natural-soft material language;
- identity: mineral/personal material language;
- utility / archive: quiet low-priority surfaces.

Only primary and focus may use the bounded panel backdrop blur, and that blur is removed on small/touch layouts. Module-specific rules may change accent, emphasis, or local composition, but must not create unrelated depth or material systems.

## 15 — Accessibility Standard

Required:
- keyboard navigation;
- visible focus;
- semantic buttons/inputs;
- readable contrast;
- state not communicated by color alone;
- reduced-motion support;
- touch-safe hit areas;
- modal focus handling;
- no essential information hidden behind animation.

A visually impressive component that is difficult to use is a failed component.

## 16 — Design Psychology Standard

Every screen should minimize unnecessary cognitive decisions.

Preferred:
recognize → understand → act

Avoid:
search → decode → compare → guess

### Attention budget
At any moment:
- one primary focal region;
- a small number of meaningful secondary signals;
- everything else visually quiet.

Attention is treated as a finite product resource.

## 17 — Quality Gate

Every meaningful visual change must pass:

Identity — still unmistakably MiD?
Premium — does the surface feel deliberately engineered?
Clarity — is the task easier to understand?
Interaction — does motion/light communicate something real?
Novelty — does it avoid common template patterns?
Performance — did the change stay inside the current budget?
Responsive — is it still excellent on mobile?
Accessibility — can keyboard and reduced-motion users still use it?

If one fails, the visual change is not production-ready.

## 18 — Final Principle

The goal is not:
Make MiD look futuristic.

The goal is:
Make MiD feel so intentionally designed that ordinary interactions feel satisfying while the technology underneath remains almost invisible.

The user should notice:
- clarity;
- speed;
- comfort;
- character;
- responsiveness;
- material quality;
- subtle surprise.

The user should not notice:
- heavy effects;
- decoration-induced loading;
- confusing animation;
- excessive gradients;
- generic dashboard patterns;
- a framework trying to show off.

Final standard:

Experience first → clarity second → performance third → aesthetics fourth → technology last.

UNREAL succeeds only when MiD feels premium, alive, memorable, and effortless at the same time.


## 19 — Environmental Geometry Standard v1

The spatial world must be treated as a believable place, not as a decorative backdrop behind the DOM.

Required production language:
- terrain is a shaped surface with restrained height variation; a perfectly flat floor is not sufficient;
- natural forms use more than one deterministic low-poly rock profile so repeated silhouettes do not feel stamped;
- organic ground language uses static foliage-adjacent geometry with low draw cost and no perpetual animation;
- foreground, midground, and background forms should create depth without competing with application content;
- spatial anchors remain connected to the environment rather than floating as isolated UI markers;
- geometry remains deterministic and cached through WebGL vertex arrays;
- the world remains native WebGL2 with the existing 2.2M pixel cap, 45 FPS desktop target, 30 FPS mobile target, reduced-motion handling, and CSS fallback;
- no texture pack, third-party 3D library, particle system, or continuous decorative animation is required for this stage.

Environmental geometry is successful when the user can perceive ground, landform, and organic context before consciously noticing the rendering technique.

The next quality layers remain separate:
1. geometry establishes believable form;
2. materials establish surface identity;
3. lighting establishes physical readability;
4. atmosphere establishes time/weather continuity;
5. composition establishes cinematic spatial framing.

Do not collapse these layers into generic post-processing or decorative blur.

## 20 — Environmental Material Standard v1

Geometry is not considered realistic until surface response changes with material identity and weather.

Material families inside the spatial world:
- Terrain: high roughness, restrained broad variation, low specular response;
- Stone/structure: moderate roughness with controlled directional reflection;
- Rock: lower roughness and stronger form catch so landforms read as solid mineral objects;
- Moss/foliage: high roughness, softer contrast, restrained backlight/scatter response;
- Path/moss accents: quiet matte response so navigation remains subordinate;
- Contact: dark recessed grounding surfaces used only where they materially improve object-to-ground separation.

Weather response:
- wetness must modify both surface darkening and specular response;
- wet rock/stone may become darker and more reflective;
- foliage should remain mostly diffuse;
- wetness must not turn the whole world glossy.

Natural variation:
- deterministic macro/micro surface variation is allowed;
- variation must remain bounded and spatially coherent;
- no texture pack is required for this stage.

Grounding:
- major forms may receive low-profile contact surfaces to approximate soft contact shadowing;
- contact geometry must remain subtle, reusable, and below the content attention level;
- this is an approximation, not a substitute for a full shadow map.

Material realism is successful when terrain, stone, rock, moss, and wet surfaces can be distinguished from their light response—not merely from their base color.


## 21 — Lighting & Atmospheric Depth Standard v1

Environmental lighting must communicate the actual state of the MiD place without requiring a post-processing stack.

The spatial renderer uses the existing astronomical light direction plus a bounded material-light model:
- warm/cool key-light color follows the environment light warmth state;
- sky fill stays cooler and vertically oriented, while ground fill remains subdued and warmer near warm daylight;
- directional light remains dominant over ambient fill so forms keep readable shape;
- atmospheric density lightly reduces contrast with distance rather than applying a visible fog effect over the whole scene;
- material, wetness, and lighting are separate concerns but compose in the same shader pass to avoid extra render passes.

The lighting model is an approximation appropriate to native WebGL2 and the existing performance target. It is not intended to simulate a full physically based renderer.

Quality target: dawn/golden-hour should produce restrained warm directional light, cloudy/rain conditions should remain cooler and flatter, and night should rely on cool ambient structure with minimal emissive support.


## 22 — Cinematic Spatial Composition Standard v1

The world must not read as a collection of generic objects distributed around the canvas. Each workspace receives authored spatial composition intent.

Composition layers:
- foreground framing: restrained landforms near the camera edges to establish scale and depth;
- midground landmark: one authored natural/architectural focal form associated with the active workspace;
- horizon layer: low, distant forms that give the scene a sense of place without becoming scenery wallpaper.

Module composition is authored alongside camera intent. Camera coordinates remain explicit; composition positions must not be derived from hidden multipliers at render time.

Allowed landmark languages:
- ridge: clustered mineral landforms;
- grove: restrained foliage grouping;
- shelter: simple stone/structural form integrated with natural ground.

Composition must remain subordinate to DOM content, disable/reduce on touch layouts, and remain event/state driven with no continuous animation.

A cinematic composition pass is successful when navigation changes not only the camera framing but also the environmental context in which the workspace is situated.


## 23 — Environmental Response & Shadowing Standard v1

Environmental realism is not only a static material color change. Weather and solar state must produce believable surface response and grounding while remaining lightweight.

Required response:
- weather transitions may ease over a short event-driven interval so the world does not snap between dry/wet or warm/cool states;
- wetness must remain material-aware: rock and stone gain controlled reflection and darkening, terrain becomes damp rather than glossy, foliage remains primarily diffuse;
- major elevated forms may receive projected ground-shadow approximations derived from the active solar light vector;
- projected shadows must soften as cloud/air density increases and remain below DOM attention levels;
- contact grounding remains separate from projected cast-shadow approximation so silhouettes do not become a single dark plate;
- shadow geometry is static, cached, low-profile, and uses no additional render pass or texture map.

Solar relationship:
- shadow direction follows the same astronomical light direction used by the material shader;
- the canonical 145deg direction remains fallback-only when solar altitude is unavailable or below the daylight threshold;
- low-altitude light is clamped to avoid physically extreme shadow lengths that would damage composition.

Performance and motion:
- environmental easing is a bounded response to state changes, not perpetual animation;
- no `uTime`, time-based decorative loops, particle systems, shadow maps, or new 3D libraries are required;
- the existing WebGL2, 2.2M-pixel, desktop/mobile frame targets remain unchanged;
- touch/reduced-motion layouts retain the same environmental semantics while reducing spatial intensity.

Quality target: after a weather or day-phase change, the user should perceive a coherent shift in wetness, reflectivity, atmosphere, and grounding rather than a palette swap.


## 24 — Cinematic Landmark Grounding Standard v1

Authored workspace landmarks are part of the same physical environment as the shared workspace core.

Required:
- the active landmark receives a restrained projected ground-shadow approximation derived from the same solar light vector as the rest of the world;
- landmark shadow scale and softness are bounded by landmark taxonomy and authored scale rather than renderer-wide multipliers;
- grove, ridge, and shelter retain distinct grounding footprints while sharing one shadow/material grammar;
- landmark grounding is limited to the desktop/fine-pointer spatial composition boundary and disappears naturally when the world is reduced;
- atmospheric distance fade must use both sky coolness and light warmth so distant forms inherit the current environmental condition rather than fading into a fixed color.

Quality target: a workspace landmark should feel planted into the terrain and atmosphere, not like an isolated low-poly object placed on top of the scene.


## 25 — Weather Intelligence Standard v2

Weather must alter the physical reading of the spatial world, not only its background atmosphere.

Required:
- precipitation reaches the WebGL material model as a bounded environmental input;
- horizontal surfaces may accumulate a restrained rainfall-pooling response, while foliage remains mostly diffuse;
- puddle-like wet patches may appear only as subtle, static environmental cues and must remain subordinate to the workspace;
- wet response must be driven by surface orientation and material family so rain does not create uniform gloss;
- atmospheric density contributes both distance fade and a small near-weather wash for dense fog/rain conditions;
- precipitation transitions use the existing bounded environment easing and contain no continuous decorative animation;
- the same 2.2M-pixel, 45 FPS desktop, 30 FPS mobile, reduced-motion, and touch-reduction constraints remain in force.

Quality target:
clear conditions should read crisp and dry; light rain should introduce subdued surface pooling and cooler distance; heavier rain should produce deeper dampness, softer shadows, and stronger but still restrained atmospheric compression.


## 26 — Interaction & Environmental Motion Standard v1

Interaction polish must make the interface respond to the user without turning the environment into a continuously moving screensaver.

Interaction:
- interactive workspace surfaces may share one delegated pointer stream for local light catch, bounded micro-tilt, and elevation response;
- newly connected interactive surfaces must reuse the existing `data-ux-lit`, `--ux-x`, `--ux-y`, and `--ux-elevation` contract rather than adding per-element listeners;
- primary actions and contextual navigation may receive local specular response, but information layout must not shift under pointer movement;
- touch and reduced-motion modes remove mechanical tilt while preserving focus, state, and hierarchy.

Environmental motion:
- clouds, fog, and light shafts must not use perpetual decorative CSS animation loops;
- environmental changes are driven by astronomy/weather/workload state and bounded CSS/WebGL transitions;
- reduced-motion must be a reduction of motion, not a separate visual theme;
- any future ambient animation requires explicit evidence that it improves state communication and remains below the attention budget.

Quality target: MiD should feel responsive when the user interacts, but visually calm when the user does nothing.


## 27 — Adaptive Spatial Render Budget v1

The spatial world must spend GPU time only while something meaningful is changing.

The renderer:
- wakes on pointer, navigation, environment, visibility, and explicit invalidation events;
- keeps the existing 45 FPS desktop / 30 FPS mobile ceiling while camera or environmental state is settling;
- stops requesting new animation frames once camera and visual state converge within a bounded tolerance;
- resumes rendering immediately when a new interaction or environment change requires visual reconciliation;
- never uses continuous rendering as a substitute for ambient animation.

This is a performance rule, not a visual fallback. The world should feel responsive during change and remain computationally quiet when the user is simply reading.

Quality target: visual fidelity must scale with state change, not with idle time.
