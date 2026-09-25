# MiD Daily — Interaction & Effects Constitution

Status: Effects Constitution v1.0

Purpose: define how MiD uses visual effects so interaction improves comprehension and material quality without becoming spectacle.

## 01 — Core Rule

MiD does not add effects to look interactive.
MiD uses effects to make the system feel responsive to the person.

Effects are communication, not decoration.

## 02 — Effect Layers

1. Light — local specular response and directional material catch.
2. Depth — elevation, press, recessed states, and spatial separation.
3. World — bounded 3D environment geometry and camera perspective.
3. Motion — short cause-and-effect transitions.
4. Atmosphere — subdued environment response to real context.
5. Feedback — visible confirmation that an action changed the system.
6. Spatial — Feature Landscape and contextual focus relationships.

## 03 — Energy Budget

Level 0 — Quiet: no active effect.
Level 1 — Responsive: hover, focus, local light.
Level 2 — Expressive: lift, press, local emissive state.
Level 3 — Signature: spatial transition or contextual environment response.
Level 4 — Hero: rare full material/spatial sequence.

Most everyday UI remains Level 0–1.

## 04 — Canonical Effects

### Cursor Light
Pointer position creates one localized specular catch on the active surface.

### Physical Press
Interactive controls lift slightly on hover and settle during activation.

### Focus Pull
When a spatial region has a focused item, unrelated siblings may visually recede so attention has a clear destination.

### State Morph
Meaningful state changes should transform the existing object instead of replacing it with unrelated animated objects.

### Action Feedback
After a user action, the UI should show the resulting state change through data, hierarchy, or a short local transition.

### Ambient Response
The living environment may change slowly based on actual time, weather, workload, or module state. The spatial world may also adjust light intensity and camera response, but never continuously perform for the user.

### Biophilic Spatial Language
Nature is a mood anchor, not decoration. Natural cues may appear through terrain, stone, moss, foliage silhouettes, fog, sky, and warm directional light. These cues should establish calm and spatial belonging while remaining subordinate to product information.

### Spatial Connection
Related workspace areas may expose temporary visual relationships through proximity, light, line, or shared emphasis.

## 05 — Timing

Micro: 120–160ms.
Normal: 180–240ms.
Scene: 260–360ms.

No effect should loop continuously unless it is part of the living environment and remains slow, bounded, and subordinate to content.

## 06 — Accessibility

Effects must preserve keyboard focus, readable contrast, touch targets, and reduced-motion behavior.

Hover-only effects can never carry essential information.

Reduced motion keeps state hierarchy while removing non-essential spatial movement.

## 07 — Do Not Use

- neon glow everywhere
- RGB/rainbow lighting
- cursor trails
- particle explosions
- giant parallax
- infinite floating UI
- excessive magnetic buttons
- constant pulse
- scroll hijacking
- large 3D rotation
- animation without cause or meaning

## 08 — Performance

CSS-first for product UI.
The spatial world may use one bounded WebGL2 canvas for environment geometry only.
No WebGL/canvas for ordinary UI.
No new animation dependency.
Pointer interaction stays delegated through one requestAnimationFrame stream.
Prefer transform and opacity.
Do not add an effect that increases payload without materially improving clarity, feedback, or the MiD signature experience.

## 09 — Identity Gate

An effect is production-ready only when it:
- still feels unmistakably MiD;
- supports the calm / precise / alive personality;
- makes the state easier to understand;
- remains visually subordinate to content;
- works on touch and reduced-motion contexts;
- stays within the established performance budget.

Canonical principle:

**Responsive, not theatrical.**
