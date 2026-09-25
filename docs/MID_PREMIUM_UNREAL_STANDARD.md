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
