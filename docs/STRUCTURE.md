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
│   │   ├── schedule.types.ts
│   │   └── ScheduleView.tsx
│   └── tasks/
├── lib/                     # Generic utilities
├── styles/                  # Tokens, global styles, app styles
└── types/                   # Shared application types
```

## Rules
1. No legacy duplicate root-level `App.tsx`, `data.ts`, or `types.ts` implementations.
2. Feature-specific UI and types stay inside their feature.
3. Shared UI primitives stay in `components/ui`.
4. Layout components never own business logic.
5. Provider-specific integrations are implemented as adapters outside feature presentation code.
6. Do not add a dependency for an effect that can be handled by native CSS or the platform.


## M2.2 Schedule CRUD
The schedule domain now owns its types, seed data, validation, form, detail view, and item card. Schedule state is composed in `app/App.tsx` and persisted through the generic storage utility. Native reminder and Google Calendar integrations remain separate future infrastructure layers.
