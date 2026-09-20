# MiD-Daily

Lightweight daily management web app for schedules, tasks, finance, and future productivity automation.

## Current phase
M1.3 — UI/UX & Interaction Foundation

## Stack
- React 19
- TypeScript
- Vite
- Native CSS animations (no animation library)

## Current capabilities
- Dashboard, Schedule, Tasks, and Finance views
- Add tasks
- Toggle task completion
- Task filtering
- Local task persistence with `localStorage`
- Responsive layout
- Keyboard focus states
- Lightweight micro-interactions and toast feedback
- Reduced-motion support

## Structure
See [`docs/STRUCTURE.md`](./docs/STRUCTURE.md) for folder rules.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

## Build

```bash
cd frontend
npm run build
```

The local-storage layer and seed data are prototype infrastructure. They are intentionally isolated so the next data-layer phase can replace them without restructuring the UI.
