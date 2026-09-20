# MiD-Daily — Folder Convention

## Rules

- `app/` composes the application. Business logic should not accumulate here.
- `features/` contains domain modules such as tasks, schedule, finance, and dashboard.
- `components/` contains reusable presentation components shared by multiple features.
- `data/` contains development/demo data only. It will be replaced or supplemented by API repositories later.
- `lib/` contains small infrastructure utilities such as local storage helpers.
- `types/` contains shared domain contracts.

Avoid creating a new folder until there is a real responsibility that benefits from separation.
Avoid putting API/database code inside visual components.
