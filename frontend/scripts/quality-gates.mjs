import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
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
const tokens = readFileSync(join(srcDir, 'styles/tokens.css'), 'utf8')
const dashboard = readFileSync(join(srcDir, 'features/dashboard/DashboardView.tsx'), 'utf8')
const featureLandscape = readFileSync(join(srcDir, 'features/dashboard/components/FeatureLandscape.tsx'), 'utf8')
const modalCandidates = tsxFiles.filter((file) => /role="dialog"[\s\S]{0,240}aria-modal="true"/.test(readFileSync(file, 'utf8')))
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
]

const failures = []

const rhythmSection = uiSystem.split('/* 4PT RHYTHM CONTRACT')[1] ?? ''
if (!/--rhythm-micro:\s*4px/.test(tokens) || !/--rhythm-tight:\s*8px/.test(tokens) || !/--rhythm-component:\s*16px/.test(tokens)) {
  failures.push('Canonical 4pt spacing tokens are missing from tokens.css.')
}
if (!/4PT RHYTHM CONTRACT/.test(uiSystem) || !/FINAL UI SYSTEM CLEANUP/.test(uiSystem)) {
  failures.push('Active UI stylesheet must include the canonical 4pt rhythm and final cleanup layers.')
}

const spatialDeclarations = [...uiSystem.matchAll(/(?:^|[;{}])\s*(gap|row-gap|column-gap|padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|min-height|max-height|min-width|max-width|height|width|top|right|bottom|left|inset|border-radius|grid-template-columns|grid-template-rows):\s*([^;{}]+)/gm)]
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

const requiredUiClasses = ["global-search-dialog","global-search-result","global-search-copy","global-search-footer","toast","dashboard-section-link","connection-loading","finance-toolbar-controls","stat-row","finance-budget-row","schedule-date-caption","schedule-now-strip","flexible-plan","secondary-panel","notification-card","task-item-card","task-item-footer","task-progress-track","task-actions-menu","profile-layout","profile-avatar-large","profile-form","profile-account-row","insights-metric-grid","insights-grid","review-note","insights-category-row","insights-schedule-row","habit-composer","habit-days","habit-board","habit-row","habit-week-grid","social-foundation-card","provider-details"]
for (const className of requiredUiClasses) {
  const selector = new RegExp('\\.' + className + '(?=[^A-Za-z0-9_-]|$)')
  if (!selector.test(uiSystem)) failures.push('Missing component UI selector: ' + className)
}

if (existsSync(join(srcDir, 'styles/app.css'))) {
  failures.push('Legacy styles/app.css must remain removed from the active stylesheet tree.')
}
if (uiSystem.includes('backdrop-filter')) {
  failures.push('Active ui-system.css must not use persistent backdrop-filter.')
}
if (!/data-ux-lit/.test(uiSystem) || !/feature-directory:has/.test(uiSystem) || !/prefers-reduced-motion:\s*reduce/.test(uiSystem)) {
  failures.push('Living material interaction contract is missing from the active UI stylesheet.')
}
if (!/surfaceSelector/.test(appSourceForInteraction) || !/requestAnimationFrame/.test(appSourceForInteraction) || !/pointermove/.test(appSourceForInteraction)) {
  failures.push('Foreground material interaction must use one delegated pointer stream with requestAnimationFrame.')
}
if (/pointermove/.test(environmentScene)) {
  failures.push('EnvironmentScene must not own pointermove handlers; keep pointer interaction bounded to foreground surfaces.')
}
if (!/--font-ui\s*:/.test(tokens) || !/--font-display\s*:/.test(tokens) || !/--ease-spring\s*:/.test(tokens)) {
  failures.push('Canonical MiD design tokens are missing from tokens.css.')
}
if (!/feature-landscape/.test(featureLandscape) || !/onNavigate/.test(featureLandscape)) {
  failures.push('Feature Landscape field guide must remain available as a real navigation surface.')
}
if (/\.feature-landscape\s*\{[^}]*display:\s*none\s*!important/.test(uiSystem) || /\.dashboard-page \.feature-landscape\s*\{[^}]*display:\s*none\s*!important/.test(uiSystem)) {
  failures.push('Live Feature Landscape must not be hidden by active UI CSS.')
}
if (!/FeatureLandscape/.test(dashboard) || !/<FeatureLandscape/.test(dashboard)) {
  failures.push('Dashboard must expose the spatial workspace compass as a live navigation surface.')
}
if (!/SIDEBAR_HIDDEN_STORAGE_KEY/.test(appSourceForInteraction) || !/setSidebarHidden/.test(appSourceForInteraction) || !/sidebarHidden/.test(appSourceForInteraction)) {
  failures.push('Workspace navigation visibility must remain user-controllable and persisted.')
}
if (!/sidebarHidden={sidebarHidden}/.test(appSourceForInteraction) || !/onToggleSidebar={toggleSidebar}/.test(appSourceForInteraction)) {
  failures.push('Topbar must remain wired to the sidebar visibility controller.')
}
if (!/sidebar-hidden/.test(uiSystem) || !/\.app-frame\.sidebar-hidden/.test(uiSystem) || !/\.sidebar-hidden \.sidebar/.test(uiSystem)) {
  failures.push('Sidebar visibility state must have bounded desktop/mobile presentation rules.')
}
if (!tsxFiles.some((file) => file.endsWith('app/App.tsx') && /useEnvironment/.test(readFileSync(file, 'utf8')) && /EnvironmentScene/.test(readFileSync(file, 'utf8')))) {
  failures.push('Living environment must be wired into the application shell.')
}
const sidebarSource = readFileSync(join(srcDir, 'components/layout/Sidebar.tsx'), 'utf8')
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
if (!/UNREAL Habitat Material System/.test(uiSystem)) {
  failures.push('UNREAL habitat material system must remain present in the active UI stylesheet.')
}
for (const terrain of [
  'data-module="dashboard"', 'data-module="schedule"', 'data-module="tasks"',
  'data-module="finance"', 'data-module="social"', 'data-module="assistant"',
  'data-module="profile"', 'data-module="insights"', 'data-module="habits"',
]) {
  if (!uiSystem.includes(terrain)) failures.push('Missing final ecosystem terrain selector: ' + terrain)
}
if (/overflow:\s*clip/.test(uiSystem)) {
  failures.push('Interactive cards must not reintroduce overflow: clip.')
}
if (!/environmentCssVariables/.test(readFileSync(join(srcDir, 'environment/visual.ts'), 'utf8'))) {
  failures.push('Environment visual state must remain the source for live CSS variables.')
}
if (!/className="environment-photograph"/.test(environmentScene) || !/fm=avif/.test(environmentScene) || !/q=60/.test(environmentScene) || !/w=1600/.test(environmentScene) || !/w=900/.test(environmentScene)) {
  failures.push('Real nature environment must use the bounded AVIF photographic layer (900px mobile / 1600px desktop, quality 60).')
}
if (/pointermove/.test(environmentScene) || existsSync(join(srcDir, 'hooks/useLivingInteractions.ts'))) {
  failures.push('Environment shell must not reintroduce pointermove JavaScript interaction handlers.')
}
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

for (const file of cssFiles) {
  const source = readFileSync(file, 'utf8')
  if (source.includes('backdrop-filter')) {
    failures.push('Persistent backdrop-filter found in active stylesheet: ' + file.replace(root, ''))
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
