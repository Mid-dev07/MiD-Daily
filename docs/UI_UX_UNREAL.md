# MiD Daily — Unreal-Grade UI/UX Direction

Single source of truth untuk redesign visual MiD Daily.

## Philosophy
- Physically-based surfaces, bukan flat UI.
- Satu arah cahaya global: `--light-angle: 145deg`.
- Depth hierarchy: atmosphere → content plane → floating panel → modal → toast.
- Efek harus tersebar secara sistematis ke seluruh komponen, bukan hanya hero.

## Three materials
1. **Glass panel** — card, modal, nav rail, dropdown, nested panel. Blur + translucent surface + top rim light + ambient shadow.
2. **Emissive surface** — primary action, active filter/state, progress, status indicator. Gradient + glow proporsional.
3. **Recessed surface** — input, search, textarea, empty state. Inner shadow; hanya menyala saat focus.

## Tokens
- Background: `#0a1119`, `#0d151f`
- Surfaces: `#0f1a26`, `#142130`, `#1b2b3d`, `#24384e`
- Accent: `#4fd1ff`
- Status: `#4ade80`, `#fbbf24`, `#fb7185`
- Lines: translucent white
- Light angle: `145deg`

## Typography
- UI/body: neutral sans (Inter/system)
- Readouts: JetBrains Mono/system mono
- Labels: uppercase + tracking
- Active/live values: very subtle accent glow

## Motion
- Primary easing: `cubic-bezier(.2,.8,.2,1)`
- Entry: scale + blur + settle
- Press: `scale(.97)`
- Hover: small lift, not bounce
- Respect `prefers-reduced-motion`

## Component mapping
| Surface | Material |
|---|---|
| Sidebar / nav | Glass + emissive active indicator |
| Cards / stats / integrations | Glass |
| Primary buttons | Emissive |
| Secondary / icon / filters | Thin glass |
| Inputs / selects / textareas / search | Recessed |
| Checked task / progress | Emissive |
| Empty states | Recessed |
| Modal | Highest glass |
| Toast | Emissive glass |

## Anti AI-slop checklist
- Jangan taruh glow hanya di background.
- Jangan bikin tiap komponen punya shadow/glow berbeda.
- Jangan tambah warna accent per fitur.
- Jangan membuat neon berlebihan.
- Jangan pakai ease-in-out generik untuk semua motion.
- Setiap surface interaktif harus menjawab: **material apa, arah cahaya mana, depth level berapa?**
- UI harus tetap terasa premium saat atmosphere dimatikan.

## Constraint
Pertahankan auth, data flow, API, persistence, integration, dan deployment. Redesign fokus pada presentation dan interaction layer.
