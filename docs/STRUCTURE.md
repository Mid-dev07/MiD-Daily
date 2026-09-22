# MiD-Daily — Frontend Structure

```text
frontend/src/
├── app/                     # Application composition
├── components/
│   ├── layout/              # App-wide layout components
│   └── ui/                  # Small reusable UI primitives
├── data/                    # Temporary local seed data
├── features/                # Business/domain modules
│   ├── dashboard/
│   ├── finance/
│   ├── schedule/
│   │   ├── components/      # Schedule-specific UI
│   │   ├── schedule.data.ts
│   │   ├── schedule.date.ts
│   │   ├── schedule.migration.ts
│   │   ├── schedule.types.ts
│   │   ├── schedule.validation.ts
│   │   └── ScheduleView.tsx
│   └── tasks/
├── lib/                     # Generic utilities
├── styles/                  # Tokens, global styles, app styles
└── types/                   # Shared application types
```

## Rules

1. No legacy duplicate root-level `App.tsx`, `data.ts`, or `types.ts` implementations.
2. Feature-specific UI, data, validation, and domain types stay inside their feature.
3. `styles/tokens.css` is the canonical design-token source; `styles/ui-system.css` owns active shared UI composition.
4. Shared UI primitives stay in `components/ui`.
5. Layout components never own business logic.
6. Provider-specific integrations are implemented as adapters outside feature presentation code.
7. Do not add a dependency for an effect that can be handled by native CSS or the platform.

## Schedule boundary

Schedule owns event intent, recurrence, and reminder intent. Native notification and Google Calendar implementations should consume this domain model through separate adapters.


## M2.5 notification additions

- `features/schedule/hooks/`: Schedule-side orchestration hooks.
- `integrations/notifications/`: provider-specific notification adapters and service worker registration.
- `public/sw.js`: browser service worker used for notification presentation.


## UNREAL Living Environment

The `environment/` directory is the canonical home for MiD-Daily's procedural environmental system. It owns location permission flow, weather fetching/cache, local solar/lunar calculations, visual-state mapping, and the environment renderer. The system is intentionally dependency-free and must remain secondary to application content.

See `docs/UNREAL_LIVING_ENVIRONMENT.md` for the behavioral, privacy, performance, and QA contract.
