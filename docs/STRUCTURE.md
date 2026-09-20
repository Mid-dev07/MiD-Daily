# MiD-Daily — Frontend Structure

The frontend follows a responsibility-first structure. New files should be placed in the smallest existing area that matches their role.

```text
frontend/src/
├── app/                 # Application composition and root state
├── components/
│   ├── layout/          # App-wide layout components
│   └── ui/              # Small reusable UI primitives
├── data/                # Temporary local seed data
├── features/            # Business/domain modules
│   ├── dashboard/
│   ├── finance/
│   ├── schedule/
│   └── tasks/
├── lib/                 # Generic utilities (storage, formatting, etc.)
├── styles/              # Global tokens and application styles
└── types/               # Shared TypeScript types
```

## Rules

1. Do not put feature-specific UI into `components/ui`.
2. Do not put business logic or seed data into layout components.
3. Shared utilities belong in `lib/`; domain logic belongs in `features/`.
4. Shared types belong in `types/` until a type becomes truly feature-specific.
5. Avoid creating a new folder for a single file unless the separation is expected to grow.
6. Delete or migrate obsolete duplicate files instead of keeping parallel implementations.

## Current M1.3 interaction layer

Animations are implemented with native CSS only:
- page enter transitions
- card entrance motion
- staggered list reveal
- navigation hover/press feedback
- focus states
- task completion feedback
- toast notification
- reduced-motion support

No animation library is required at this stage.
