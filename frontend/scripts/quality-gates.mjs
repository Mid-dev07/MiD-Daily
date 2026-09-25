import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const operatingStandardPath = join(root, '../docs/MID_PREMIUM_UNREAL_STANDARD.md')
if (!existsSync(operatingStandardPath)) failures.push('Premium Unreal operating standard document is missing.')
const identityPath = join(root, '../docs/MID_IDENTITY_SYSTEM.md')
const effectsPath = join(root, '../docs/MID_EFFECTS_CONSTITUTION.md')
if (!existsSync(identityPath)) failures.push('MiD core identity system document is missing.')
if (!existsSync(effectsPath)) failures.push('MiD effects constitution document is missing.')
const srcDir = join(root, 'src')

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

const tsxFiles = walk(srcDir).filter((file) => file.endsWith('.tsx'))
const cssFiles = walk(join(srcDir, 'styles')).filter((file) => file.endsWith('.css'))
const uiSystem = readFileSync(join(srcDir, 'styles/ui-system.css'), 'utf8')
const experienceSystem = readFileSync(join(srcDir, 'styles/experience.css'), 'utf8')
const tokens = readFileSync(join(srcDir, 'styles/tokens.css'), 'utf8')
const dashboard = readFileSync(join(srcDir, 'features/dashboard/DashboardView.tsx'), 'utf8')
const actionFocus = readFileSync(join(srcDir, 'features/dashboard/components/ActionFocus.tsx'), 'utf8')
const workspaceHeaderPath = join(srcDir, 'components/ui/WorkspaceHeader.tsx')
const confirmDialogPath = join(srcDir, 'components/ui/ConfirmDialog.tsx')
const confirmDialogSource = existsSync(confirmDialogPath) ? readFileSync(confirmDialogPath, 'utf8') : ''
const workspaceHeaderSource = existsSync(workspaceHeaderPath) ? readFileSync(workspaceHeaderPath, 'utf8') : ''
const convergedWorkspaceFiles = [
  'features/schedule/ScheduleView.tsx',
  'features/tasks/TasksView.tsx',
  'features/finance/FinanceView.tsx',
  'features/social/SocialAnalyticsView.tsx',
  'features/ai/AssistantView.tsx',
  'features/profile/ProfileView.tsx',
  'features/insights/InsightsView.tsx',
  'features/habits/HabitsView.tsx',
]
const modalCandidates = tsxFiles.filter((file) => /role="dialog"[\s\S]{0,240}aria-modal="true"/.test(readFileSync(file, 'utf8')))
const mainSource = readFileSync(join(srcDir, 'main.tsx'), 'utf8')
const environmentScene = readFileSync(join(srcDir, 'environment/EnvironmentScene.tsx'), 'utf8')
const appSourceForInteraction = readFileSync(join(srcDir, 'app/App.tsx'), 'utf8')
const environmentFiles = [
  'environment/types.ts',
  'environment/astronomy.ts',
  'environment/weather.ts',
  'environment/location.ts',
  'environment/visual.ts',
  'environment/useEnvironment.ts',
  'environment/EnvironmentScene.tsx',
  'environment/MiDWorldCanvas.tsx',
  'environment/moduleWorld.ts',
]

const failures = []

const unrealTokens = ['#0a1119', '#0d151f', '#4fd1ff', '#4ade80', '#fbbf24', '#fb7185']
if (!unrealTokens.every((token) => tokens.toLowerCase().includes(token.toLowerCase()))) {
  failures.push('MiD Unreal material tokens are missing or have drifted.')
}
if (!/--light-angle:\s*145deg/.test(tokens)) failures.push('The canonical 145deg MiD key-light token must remain intact.')
if (!existsSync(join(srcDir, 'styles/experience.css')) || !/styles\/experience\.css/.test(mainSource)) failures.push('Glass material layer must be loaded explicitly after the structural UI system.')
if (!/linear-gradient\(145deg/.test(uiSystem) && !/linear-gradient\(145deg/.test(experienceSystem)) failures.push('Unreal material surfaces must retain a 145deg directional gradient.')

if (!/--rhythm-micro:\s*4px/.test(tokens) || !/--rhythm-tight:\s*8px/.test(tokens) || !/--rhythm-component:\s*16px/.test(tokens)) {
  failures.push('Canonical 4pt spacing tokens are missing from tokens.css.')
}
if (!/4PT RHYTHM CONTRACT/.test(uiSystem) || !/FINAL UI SYSTEM CLEANUP/.test(uiSystem)) {
  failures.push('Active UI stylesheet must include the canonical 4pt rhythm and final cleanup layers.')
}

const spatialSource = uiSystem + '\n' + experienceSystem
const spatialDeclarations = [...spatialSource.matchAll(/(?:^|[;{}])\s*(gap|row-gap|column-gap|padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|min-height|max-height|min-width|max-width|height|width|top|right|bottom|left|inset|border-radius|grid-template-columns|grid-template-rows):\s*([^;{}]+)/gm)]
const offGridValues = []
for (const match of spatialDeclarations) {
  const prop = match[1]
  const raw = match[2]
  for (const px of raw.matchAll(/(-?\d+(?:\.\d+)?)px/g)) {
    const value = Number(px[1])
    if (value === 0) continue
    if (prop === 'border-radius' && Math.abs(value) >= 90) continue
    if ((prop === 'height' || prop === 'width' || prop === 'min-height' || prop === 'min-width') && Math.abs(value) === 1) continue
    if (value % 4 !== 0) offGridValues.push(prop + '=' + value)
  }
}
if (offGridValues.length) {
  failures.push('Active UI stylesheet contains off-grid spatial values: ' + [...new Set(offGridValues)].join(', '))
}

const requiredUiClasses = ["confirm-dialog","confirm-dialog-copy","confirm-dialog-actions","global-search-dialog","global-search-result","global-search-copy","global-search-footer","toast","dashboard-section-link","connection-loading","finance-toolbar-controls","stat-row","finance-budget-row","schedule-date-caption","schedule-now-strip","flexible-plan","secondary-panel","notification-card","task-item-card","task-item-footer","task-progress-track","task-actions-menu","profile-layout","profile-avatar-large","profile-form","profile-account-row","insights-metric-grid","insights-grid","review-note","insights-category-row","insights-schedule-row","habit-composer","habit-days","habit-board","habit-row","habit-week-grid","social-foundation-card","provider-details"]
for (const className of requiredUiClasses) {
  const selector = new RegExp('\\.' + className + '(?=[^A-Za-z0-9_-]|$)')
  if (!selector.test(uiSystem)) failures.push('Missing component UI selector: ' + className)
}

if (existsSync(join(srcDir, 'styles/app.css'))) {
  failures.push('Legacy styles/app.css must remain removed from the active stylesheet tree.')
}
if (uiSystem.includes('backdrop-filter')) {
  failures.push('ui-system.css must remain material-blur free; keep backdrop-filter isolated in experience.css.')
}
const experienceBlurDeclarations = [...experienceSystem.matchAll(/(?:^|\n)\s*backdrop-filter:\s*([^;]+)/g)].map((match) => match[1])
if (experienceBlurDeclarations.length > 8) {
  failures.push('Experience blur budget exceeded: expected no more than 8 backdrop-filter declarations, found ' + experienceBlurDeclarations.length + '.')
}
if (experienceBlurDeclarations.some((value) => value.trim() !== 'none' && !/blur\(var\(--glass-(blur-shell|blur-surface|blur-modal)\)/.test(value))) {
  failures.push('Glass blur must use tokenized blur values from tokens.css.')
}
if (!/@supports\s+not\s*\(\s*backdrop-filter:\s*blur\(1px\)\s*\)/.test(experienceSystem)) {
  failures.push('experience.css must provide a backdrop-filter feature-detection fallback contract.')
}
if (!/G0/.test(experienceSystem) || !/G1/.test(experienceSystem) || !/G2/.test(experienceSystem) || !/G3/.test(experienceSystem) || !/G4/.test(experienceSystem)) {
  failures.push('Experience material hierarchy contract is missing or incomplete.')
}
if (!/data-ux-lit/.test(uiSystem) || !/action-focus/.test(uiSystem) || !/prefers-reduced-motion:\s*reduce/.test(uiSystem)) {
  failures.push('Living material interaction contract is missing from the active UI stylesheet.')
}
if (!/surfaceSelector/.test(appSourceForInteraction) || !/requestAnimationFrame/.test(appSourceForInteraction) || !/pointermove/.test(appSourceForInteraction)) {
  failures.push('Foreground material interaction must use one delegated pointer stream with requestAnimationFrame.')
}
if (!/UNREAL FINAL RENDER CORE — PHASE 1 COMPLETE/.test(experienceSystem) || !/--ux-rx/.test(experienceSystem) || !/--ux-ry/.test(experienceSystem) || !/--ux-elevation/.test(experienceSystem)) {
  failures.push('Final Unreal render core must visibly consume delegated light/elevation variables.')
}
if (/\.content-card[\s\S]{0,220}backdrop-filter:\s*blur/.test(experienceSystem)) {
  failures.push('G2 content cards must remain clear painted glass; persistent blur belongs only to shell/transient surfaces.')
}
if (!/UNREAL FINALIZATION — PHASE 2/.test(experienceSystem) || !/UNREAL FINALIZATION — PHASE 4/.test(experienceSystem)) {
  failures.push('Final Unreal spatial/material pass is incomplete.')
}
if (!/:focus-visible/.test(uiSystem) || !/outline:\s*2px/.test(uiSystem)) {
  failures.push('Global focus visibility contract must remain explicit and measurable.')
}
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.environment-clouds[\s\S]*?animation:\s*none/.test(experienceSystem)) {
  failures.push('Reduced-motion must disable non-essential environmental movement.')
}
if (/pointermove/.test(environmentScene)) {
  failures.push('EnvironmentScene must not own pointermove handlers; keep pointer interaction bounded to foreground surfaces.')
}
if (!/--font-ui\s*:/.test(tokens) || !/--font-display\s*:/.test(tokens) || !/--ease-spring\s*:/.test(tokens)) {
  failures.push('Canonical MiD design tokens are missing from tokens.css.')
}
const canonicalTokenPattern = /--(?:space-[0-9]+|rhythm-|radius-|font-|ease-spring|light-angle|content-max|content-gutter|text-display|control-h|touch-target)\s*:/
if (canonicalTokenPattern.test(uiSystem)) {
  failures.push('Canonical geometry/type tokens must be defined only in tokens.css, not redefined by ui-system.css.')
}
if (/environment-photograph/.test(uiSystem)) {
  failures.push('Obsolete photographic environment selectors must not remain in ui-system.css.')
}
if (!/ActionFocus/.test(actionFocus) || !/buildActionFocus/.test(actionFocus) || !/action-focus/.test(actionFocus)) {
  failures.push('Action Focus must remain a live, state-driven daily priority surface.')
}

const terrainFiles = [
  ['schedule toolbar', join(srcDir, 'features/schedule/components/ScheduleToolbar.tsx'), /workspace-toolbar-surface/],
  ['tasks toolbar', join(srcDir, 'features/tasks/TasksView.tsx'), /workspace-toolbar-surface/],
  ['finance toolbar', join(srcDir, 'features/finance/FinanceView.tsx'), /workspace-toolbar-surface/],
  ['finance metrics', join(srcDir, 'features/finance/FinanceView.tsx'), /workspace-metrics|workspace-metric/],
  ['insights metrics', join(srcDir, 'features/insights/InsightsView.tsx'), /workspace-metrics--four|workspace-metric/],
]
for (const [label, file, pattern] of terrainFiles) {
  if (!pattern.test(readFileSync(file, 'utf8'))) failures.push('Shared content terrain missing from ' + label + '.')
}
if (!/workspace-toolbar-surface/.test(uiSystem) || !/workspace-metrics/.test(uiSystem) || !/empty-state/.test(uiSystem)) {
  failures.push('Shared content terrain CSS contract is missing.')
}
if (!/ActionFocus/.test(dashboard) || !/<ActionFocus/.test(dashboard) || /FeatureLandscape/.test(dashboard)) {
  failures.push('Dashboard must expose Action Focus and must not retain the Compass component.')
}
if (/feature-(landscape|compass|node|core|directory)|Workspace Compass|Daily Compass|buildCompassState|data-compass-target/i.test(
  [dashboard, actionFocus, uiSystem, experienceSystem].join('\n'),
)) {
  failures.push('Compass implementation or dead Compass styling remains in the active frontend surface.')
}
if (!existsSync(confirmDialogPath) || !/useModalBehavior/.test(confirmDialogSource) || !/role="dialog"/.test(confirmDialogSource) || !/aria-modal="true"/.test(confirmDialogSource)) {
  failures.push('Shared ConfirmDialog must use the existing modal behavior and accessible dialog contract.')
}
const confirmationSources = tsxFiles.map((file) => readFileSync(file, 'utf8')).filter((source) => /window\.confirm/.test(source))
if (confirmationSources.length) {
  failures.push('Native browser confirm() dialogs must not remain in the MiD frontend; use the shared ConfirmDialog.')
}
if (!/WorkspaceContextRail/.test(appSourceForInteraction) || !/activeView !== 'dashboard'/.test(appSourceForInteraction) || !/workspace-context-rail/.test(experienceSystem)) {
  failures.push('Non-Today workspaces must retain a shared live context bridge back to schedule, tasks, and finance.')
}
if (!/dashboard-command-deck/.test(dashboard) || !/dashboard-hero-aside/.test(dashboard) || !/dashboard-live/.test(dashboard)) {
  failures.push('Dashboard visual redesign contract is missing the command deck, live status rail, or hero shell.')
}
if (!/listHabits/.test(dashboard) || !/Today’s habits/.test(dashboard) || !/dashboard-habits/.test(experienceSystem)) {
  failures.push('Today must surface a live habit rhythm signal as part of Module Convergence.')
}
if (!/opacity\s*:\s*0[\s;]+visibility\s*:\s*hidden[\s;]+pointer-events\s*:\s*none/.test(uiSystem + experienceSystem)) {
  failures.push('Sidebar hide state must remove the hidden rail from interaction and visual compositing.')
}

const iconSidebarSource = readFileSync(join(srcDir, 'components/layout/Sidebar.tsx'), 'utf8')
if (!/MiDIcon/.test(iconSidebarSource) || /icon: '[⌂◷✓◎✦●↗◉]'/u.test(iconSidebarSource)) {
  failures.push('Primary navigation must use the deterministic MiD SVG icon system, not platform glyphs.')
}
if (!/MiDIcon/.test(actionFocus) || /icon: '[⌂◷✓◎✦●↗◉]'/u.test(actionFocus)) {
  failures.push('Action Focus must use the deterministic MiD SVG icon system.')
}
if (!/\.view-key\[data-module/.test(uiSystem) && !/\.view-key\[data-module/.test(experienceSystem)) {
  failures.push('Module terrain signature layer is missing from the active visual system.')
}
if (!/assistant-health-strip/.test(uiSystem)) {
  failures.push('Integration health strip styling is missing from the active UI system.')
}
const instagramViewSource = readFileSync(join(srcDir, 'features/social/SocialAnalyticsView.tsx'), 'utf8')
const instagramApiSource = readFileSync(join(srcDir, 'integrations/instagramApi.ts'), 'utf8')
const instagramServerSource = readFileSync(join(root, '../backend/src/server.ts'), 'utf8')
const instagramOAuthSource = readFileSync(join(root, '../backend/src/integrations/instagramOAuth.ts'), 'utf8')
if (!/startInstagramAuthentication/.test(instagramViewSource) || !/Connect Instagram/.test(instagramViewSource)) {
  failures.push('Instagram must expose a user-facing Connect action when OAuth is available.')
}
if (!/\/api\/integrations\/instagram\/start/.test(instagramApiSource)) {
  failures.push('Instagram Connect API contract is missing.')
}
if (!/\/auth\/instagram\/callback/.test(instagramServerSource) || !/handleInstagramStart/.test(instagramServerSource) || !/handleInstagramCallback/.test(instagramServerSource)) {
  failures.push('Instagram OAuth server start/callback flow is missing.')
}
if (!/instagram_business_basic/.test(instagramOAuthSource) || !/instagram_business_manage_insights/.test(instagramOAuthSource)) {
  failures.push('Instagram OAuth analytics scopes are missing.')
}
if (!/SIDEBAR_HIDDEN_STORAGE_KEY/.test(appSourceForInteraction) || !/setSidebarHidden/.test(appSourceForInteraction) || !/sidebarHidden/.test(appSourceForInteraction)) {
  failures.push('Workspace navigation visibility must remain user-controllable and persisted.')
}
if (!/sidebarHidden={sidebarHidden}/.test(appSourceForInteraction) || !/onToggleSidebar={toggleSidebar}/.test(appSourceForInteraction)) {
  failures.push('Topbar must remain wired to the sidebar visibility controller.')
}
const shellStyles = uiSystem + experienceSystem
if (!/sidebar-hidden/.test(shellStyles) || !/\.app-frame\.sidebar-hidden/.test(shellStyles) || !/\.sidebar-hidden \.sidebar/.test(shellStyles)) {
  failures.push('Sidebar visibility state must have bounded desktop/mobile presentation rules.')
}
if (!tsxFiles.some((file) => file.endsWith('app/App.tsx') && /useEnvironment/.test(readFileSync(file, 'utf8')) && /EnvironmentScene/.test(readFileSync(file, 'utf8')))) {
  failures.push('Living environment must be wired into the application shell.')
}
const sidebarSource = readFileSync(join(srcDir, 'components/layout/Sidebar.tsx'), 'utf8')
const brandMarkSource = join(srcDir, 'components/ui/MiDMark.tsx')
if (!existsSync(brandMarkSource)) failures.push('Canonical MiD brand mark component is missing.')
if (!/MiDMark/.test(sidebarSource)) failures.push('Primary shell must use the canonical MiD brand mark.')
if (!/CORE EXPERIENCE V1 — THE MI D ROOM/.test(experienceSystem)) failures.push('Core MiD room experience layer is missing from experience.css.')
const appSource = readFileSync(join(srcDir, 'app/App.tsx'), 'utf8')
if (!/nav-index/.test(sidebarSource) || !/index: '001'/.test(sidebarSource) || !/index: '009'/.test(sidebarSource)) {
  failures.push('Field-guide navigation must keep explicit navigation indices.')
}
if (!/useRef(?:<[^>]+>)?\(null\)/.test(sidebarSource) || !/scrollIntoView/.test(sidebarSource)) {
  failures.push('Active field-guide navigation should remain discoverable when the mobile rail scrolls horizontally.')
}
if (!/grid-auto-flow:\s*column/.test(uiSystem) || !/grid-auto-columns:\s*minmax\(68px,\s*78px\)/.test(uiSystem) || !/overflow-x:\s*auto/.test(uiSystem)) {
  failures.push('Mobile field-guide navigation must remain horizontally scrollable and touch-sized.')
}
if (!/data-module=\{activeView\}/.test(appSourceForInteraction)) {
  failures.push('Active module marker must remain wired to the view container.')
}
if (!/Experience System V3/.test(experienceSystem)) {
  failures.push('Experience System V3 must remain present in the active visual stylesheet.')
}
if (!/EFFECTS CONSTITUTION V1/.test(experienceSystem)) {
  failures.push('Effects Constitution V1 implementation layer is missing from experience.css.')
}
if (!/--effect-hover-lift:/.test(tokens) || !/--effect-press-scale:/.test(tokens)) {
  failures.push('Canonical interaction response tokens are missing from tokens.css.')
}
if (!/data-workload=/.test(appSourceForInteraction)) {
  failures.push('Living workload state must remain available to the effect layer.')
}
for (const terrain of [
  'data-module="dashboard"', 'data-module="schedule"', 'data-module="tasks"',
  'data-module="finance"', 'data-module="social"', 'data-module="assistant"',
  'data-module="profile"', 'data-module="insights"', 'data-module="habits"',
]) {
  if (!uiSystem.includes(terrain) && !experienceSystem.includes(terrain)) failures.push('Missing final ecosystem terrain selector: ' + terrain)
}
if (/overflow:\s*clip/.test(uiSystem)) {
  failures.push('Interactive cards must not reintroduce overflow: clip.')
}
if (!/environmentCssVariables/.test(readFileSync(join(srcDir, 'environment/visual.ts'), 'utf8'))) {
  failures.push('Environment visual state must remain the source for live CSS variables.')
}
if (!/environment-stars/.test(environmentScene) || !/environment-sun/.test(environmentScene) || !/environment-moon/.test(environmentScene) || !/environment-terrain/.test(environmentScene) || !/environment-rain/.test(environmentScene)) {
  failures.push('Living Environment must render the procedural sky, celestial, terrain, and precipitation layers.')
}
if (/environment-photograph/.test(environmentScene) || /images\\.unsplash\\.com/.test(environmentScene)) {
  failures.push('Living Environment must not fall back to a photographic wallpaper layer.')
}
const worldRendererPath = join(srcDir, 'environment/MiDWorldCanvas.tsx')
if (!existsSync(worldRendererPath)) {
  failures.push('Spatial world renderer is missing from the environment layer.')
} else {
  const worldRenderer = readFileSync(worldRendererPath, 'utf8')
  if (!/getContext\(['"]webgl2/.test(worldRenderer)) failures.push('Spatial world renderer must use a real WebGL2 context.')
  if (!/requestAnimationFrame/.test(worldRenderer)) failures.push('Spatial world renderer must use a bounded animation frame loop.')
  if (!/prefers-reduced-motion/.test(worldRenderer)) failures.push('Spatial world renderer must honor reduced-motion.')
  if (!/MAX_WORLD_PIXELS/.test(worldRenderer) || !/Math\.sqrt\(MAX_WORLD_PIXELS/.test(worldRenderer)) failures.push('Spatial world renderer must cap its pixel workload.')
  if (!/createVertexArray/.test(worldRenderer)) failures.push('Spatial world renderer must cache geometry through WebGL vertex arrays.')
  const renderStart = worldRenderer.indexOf('const render =')
  if (renderStart >= 0 && worldRenderer.slice(renderStart).includes('getBoundingClientRect(')) {
    failures.push('Spatial world renderer must keep layout reads outside its frame loop.')
  }
  if (!/removeEventListener\(['"]visibilitychange/.test(worldRenderer)) failures.push('Spatial world renderer must clean up visibility listeners.')
  if (/addEventListener\(['"]pointermove/.test(worldRenderer)) failures.push('Spatial world renderer must not own a second pointermove stream.')
}
if (/pointermove/.test(environmentScene) || existsSync(join(srcDir, 'hooks/useLivingInteractions.ts'))) {
  failures.push('Environment shell must not reintroduce a local pointermove interaction handler.')
}
if (!/mid:world-pointer/.test(appSourceForInteraction) || !/CustomEvent/.test(appSourceForInteraction)) {
  failures.push('The shared App interaction stream must route pointer state into the spatial world.')
}
if (!/activeView={activeView}/.test(appSourceForInteraction)) {
  failures.push('The active workspace must be wired into the spatial environment.')
}
const moduleWorldPath = join(srcDir, 'environment/moduleWorld.ts')
if (existsSync(moduleWorldPath)) {
  const moduleWorld = readFileSync(moduleWorldPath, 'utf8')
  const requiredViews = ['dashboard', 'schedule', 'tasks', 'finance', 'social', 'assistant', 'profile', 'insights', 'habits']
  for (const view of requiredViews) {
    if (!moduleWorld.includes("view: '" + view + "'")) {
      failures.push('Spatial module world anchor is missing: ' + view)
    }
  }
  const spatialWorldSource = readFileSync(join(srcDir, 'environment/MiDWorldCanvas.tsx'), 'utf8')
  if (!/worldModuleAnchor/.test(spatialWorldSource)) {
    failures.push('Spatial renderer must resolve the active module through the shared module-world map.')
  }
  if (!/activeAnchor\.camera\.eye/.test(spatialWorldSource) || !/activeAnchor\.camera\.target/.test(spatialWorldSource)) {
    failures.push('Spatial renderer must consume explicit camera intent from the active module anchor.')
  }
  if (!/function rockGeometry/.test(spatialWorldSource) || !/const moss/.test(spatialWorldSource)) {
    failures.push('Spatial world must retain the calm natural-form language.')
  }
  if ((moduleWorld.match(/camera:\s*\{\s*eye:/g) || []).length !== requiredViews.length) {
    failures.push('Every spatial module anchor must define an explicit camera eye intent.')
  }
  if ((moduleWorld.match(/camera:\s*\{\s*eye:[^}]*target:/g) || []).length !== requiredViews.length) {
    failures.push('Every spatial module anchor must define an explicit camera target intent.')
  }
} 

const spatialGeometrySource = readFileSync(join(srcDir, 'environment/MiDWorldCanvas.tsx'), 'utf8')
for (const contract of [
  'function terrainHeight',
  'function terrainGeometry',
  'function foliageGeometry',
  'function rockGeometry(variant = 0)',
  'const terrain = createMesh',
  'const rockA = createMesh',
  'const rockB = createMesh',
  'const rockC = createMesh',
  'const foliage = createMesh',
  'draw(terrain, [0, -0.2, 0]',
]) {
  if (!spatialGeometrySource.includes(contract)) failures.push('Environmental geometry v1 contract missing: ' + contract)
}
if (spatialGeometrySource.includes('function planeGeometry') || spatialGeometrySource.includes('planeGeometry')) {
  failures.push('Environmental geometry v1 must not retain the obsolete flat floor plane.')
}
if ((spatialGeometrySource.match(/draw(foliage,/g) || []).length < 4) {
  failures.push('Environmental geometry v1 must retain multiple restrained organic foliage clusters.')
}
if ((spatialGeometrySource.match(/draw(rock[ABC],/g) || []).length < 8) {
  failures.push('Environmental geometry v1 must retain multiple low-poly landform placements.')
}

const spatialStyles = join(srcDir, 'styles/spatial-composition.css')
if (!existsSync(spatialStyles)) {
  failures.push('Spatial workspace composition stylesheet is missing.')
} else {
  const spatialSource = readFileSync(spatialStyles, 'utf8')
  const moduleScopedDepthPattern = /\.view-key\[data-module="[^"]+"\][^{]*\[data-spatial-role="[^"]+"\]\s*\{[^}]*\btransform:\s*[^;]*translateZ\(/s
  const moduleScopedHeaderDepthPattern = /\.view-key\[data-module\][^{}]*\.workspace-header[^{}]*\{[^}]*translateZ\(/s
  if (moduleScopedDepthPattern.test(spatialSource)) {
    failures.push('Spatial depth must remain owned by semantic roles, not module-specific selectors.')
  }
  if (moduleScopedHeaderDepthPattern.test(spatialSource)) {
    failures.push('WorkspaceHeader depth must remain owned by its semantic role, not a component-specific selector.')
  }

  for (const contract of [
    'perspective:',
    'data-module="dashboard"',
    'data-module="schedule"',
    'data-module="tasks"',
    'data-module="finance"',
    'data-module="social"',
    'data-module="assistant"',
    'data-module="profile"',
    'data-module="insights"',
    'data-module="habits"',
    'prefers-reduced-motion: reduce',
    'data-spatial-role="primary"',
    'data-spatial-role="supporting"',
    'data-spatial-role="controls"',
    'data-spatial-role="instrument"',
    'data-spatial-role="rhythm"',
    'data-spatial-role="identity"',
    'data-spatial-role="archive"',
    'data-spatial-role="focus"',
    'translate3d(var(--spatial-x), 0, var(--spatial-z))',
    'backdrop-filter: blur(10px)',
    'inset 0 1px 6px',

  ]) {
    if (!spatialSource.includes(contract)) failures.push('Spatial composition contract missing: ' + contract)
  }
}
const spatialRoleContracts = {
  'features/dashboard/DashboardView.tsx': ['primary', 'rhythm', 'secondary-group', 'supporting', 'focus', 'archive', 'instrument'],
  'features/schedule/ScheduleView.tsx': ['orientation', 'primary', 'supporting', 'utility'],
  'features/tasks/TasksView.tsx': ['controls', 'primary', 'instrument'],
  'features/finance/FinanceView.tsx': ['metrics', 'primary', 'supporting', 'archive'],
  'features/social/SocialAnalyticsView.tsx': ['primary'],
  'features/ai/AssistantView.tsx': ['primary', 'instrument', 'focus', 'supporting'],
  'features/profile/ProfileView.tsx': ['identity', 'primary'],
  'features/insights/InsightsView.tsx': ['metrics', 'primary', 'supporting', 'archive'],
  'features/habits/HabitsView.tsx': ['primary', 'focus', 'instrument', 'archive'],
  'components/ui/WorkspaceHeader.tsx': ['orientation'],
}
for (const [relative, roles] of Object.entries(spatialRoleContracts)) {
  const source = readFileSync(join(srcDir, relative), 'utf8')
  for (const role of roles) {
    if (!source.includes('data-spatial-role="' + role + '"')) {
      failures.push('Spatial role missing in ' + relative + ': ' + role)
    }
  }
}
if (!mainSource.includes("styles/spatial-composition.css")) failures.push('Spatial composition stylesheet must be loaded by main.tsx.')

const responsiveStyles = join(srcDir, 'styles/responsive.css')
if (!existsSync(responsiveStyles)) {
  failures.push('Responsive experience authority stylesheet is missing.')
} else {
  const responsiveSource = readFileSync(responsiveStyles, 'utf8')
  for (const contract of [
    '@media (min-width: 1280px)',
    '@media (min-width: 1024px) and (max-width: 1279px)',
    '@media (max-width: 1023px)',
    '@media (max-width: 820px)',
    '@media (max-width: 390px)',
    'env(safe-area-inset-bottom)',
    '(hover: none), (pointer: coarse)',
  ]) {
    if (!responsiveSource.includes(contract)) failures.push('Responsive contract missing: ' + contract)
  }
  if (!/environment-world-canvas/.test(responsiveSource)) failures.push('Responsive spatial world rules are missing.')
  if (!/min-height:\s*48px/.test(responsiveSource)) failures.push('Responsive touch controls must preserve 48px targets.')
}
const natureTokens = readFileSync(join(srcDir, 'styles/tokens.css'), 'utf8')
for (const token of ['--nature-ground', '--nature-moss-soft', '--nature-stone-warm']) {
  if (!natureTokens.includes(token)) failures.push('Nature identity token missing: ' + token)
}
const moodSource = readFileSync(join(srcDir, 'environment/mood.ts'), 'utf8')
for (const contract of ['phaseMood', 'weatherMood', 'composeEnvironmentMood', 'environmentLightDirection']) {
  if (!moodSource.includes(contract)) failures.push('Time-weather environment contract missing: ' + contract)
}
const environmentTypes = readFileSync(join(srcDir, 'environment/types.ts'), 'utf8')
for (const visualField of ['lightWarmth', 'skyCoolness', 'natureSaturation', 'sunBeamOpacity', 'airDensity', 'wetness', 'worldContrast']) {
  if (!environmentTypes.includes(visualField)) failures.push('Environment visual field missing: ' + visualField)
}
const worldRenderer = readFileSync(join(srcDir, 'environment/MiDWorldCanvas.tsx'), 'utf8')
if (!/environmentLightDirection/.test(worldRenderer)) failures.push('Spatial world must consume real solar direction when available.')
if (!/uniforms\.light, lightDirection\[0\], lightDirection\[1\], lightDirection\[2\]/.test(worldRenderer)) {
  failures.push('Spatial world must upload the calculated solar direction to WebGL lighting.')
}
if (/uTime|const t = timestamp \* 0\.001|Math\.sin\(t/.test(worldRenderer)) {
  failures.push('Spatial world must not use perpetual time-based animation loops.')
}
if (!/cameraState|desiredCamera|cameraBlend/.test(worldRenderer)) {
  failures.push('Spatial world must use the event-driven semantic camera rail.')
}
if (!/function drawSpatialPath/.test(worldRenderer) || !/drawSpatialPath\(\s*draw,\s*box/.test(worldRenderer)) {
  failures.push('Spatial world must connect the active module anchor to the workspace via the shared spatial path.')
}
if (!/spatialPathQuery/.test(worldRenderer) || !/spatialPathQuery\.matches/.test(worldRenderer)) {
  failures.push('Spatial path must be reduced on small/touch layouts.')
}
if (!/DEFAULT_LIGHT_DIRECTION/.test(worldRenderer)) failures.push('Spatial world must retain the canonical 145deg fallback light.')

const responsiveMainSource = readFileSync(join(srcDir, 'main.tsx'), 'utf8')
if (!/styles\/responsive\.css/.test(responsiveMainSource)) failures.push('Responsive authority stylesheet must be loaded after experience.css.')

const missingEnvironmentFiles = environmentFiles.filter((relative) => !existsSync(join(srcDir, relative)))
if (missingEnvironmentFiles.length) {
  for (const relative of missingEnvironmentFiles) failures.push('Missing environment foundation file: ' + relative)
} else {
  const environmentHook = readFileSync(join(srcDir, 'environment/useEnvironment.ts'), 'utf8')
  if (!environmentHook.includes('60_000') || !environmentHook.includes('visibilitychange')) {
    failures.push('Environment updates must remain minute-scale and visibility-aware.')
  }
  const weatherSource = readFileSync(join(srcDir, 'environment/weather.ts'), 'utf8')
  if (!weatherSource.includes('15 * 60 * 1000') || !weatherSource.includes('api.open-meteo.com')) {
    failures.push('Weather service must keep a bounded cache and use the documented Open-Meteo endpoint.')
  }
}
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(uiSystem) && !cssFiles.some((file) => /prefers-reduced-motion:\s*reduce/.test(readFileSync(file, 'utf8')))) {
  failures.push('A reduced-motion media query must exist in active frontend CSS.')
}

for (const file of modalCandidates) {
  const source = readFileSync(file, 'utf8')
  if (!source.includes('useModalBehavior')) {
    failures.push('Dialog without shared modal behavior: ' + file.replace(root, ''))
  }
  if (!/ref=\{dialogRef\}/.test(source)) {
    failures.push('Dialog without focus-trap root ref: ' + file.replace(root, ''))
  }
}

for (const lock of [join(root, 'package-lock.json'), join(root, '../backend/package-lock.json')]) {
  if (!existsSync(lock) || statSync(lock).size === 0) failures.push('Missing or empty lockfile: ' + lock)
}

if (failures.length) {
  console.error('MiD-Daily static QA gate FAILED')
  for (const failure of failures) console.error(' - ' + failure)
  process.exit(1)
}

console.log('MiD-Daily static QA gate passed.')
console.log('Dialogs audited:', modalCandidates.length)
console.log('Active CSS files audited:', cssFiles.length)
