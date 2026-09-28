import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const failures = []
const operatingStandardPath = join(root, '../docs/MID_PREMIUM_UNREAL_STANDARD.md')
if (!existsSync(operatingStandardPath)) failures.push('Premium Unreal operating standard document is missing.')
const identityPath = join(root, '../docs/MID_IDENTITY_SYSTEM.md')
const effectsPath = join(root, '../docs/MID_EFFECTS_CONSTITUTION.md')
if (!existsSync(identityPath)) failures.push('MiD core identity system document is missing.')
if (!existsSync(effectsPath)) failures.push('MiD effects constitution document is missing.')
const srcDir = join(root, 'src')
const appCompositionSource = readFileSync(join(srcDir, 'app/App.tsx'), 'utf8')
const workspaceDataSource = readFileSync(join(srcDir, 'features/workspace/useWorkspaceData.ts'), 'utf8')
const workspaceProfileSource = readFileSync(join(srcDir, 'features/profile/useWorkspaceProfile.ts'), 'utf8')
const foregroundInteractionSource = readFileSync(join(srcDir, 'app/useForegroundInteraction.ts'), 'utf8')
const workspaceContextRailPath = join(srcDir, 'components/layout/WorkspaceContextRail.tsx')
const environmentHookSource = readFileSync(join(srcDir, 'environment/useEnvironment.ts'), 'utf8')

if (appCompositionSource.split('\n').length > 320) {
  failures.push('App.tsx must remain a composition root; move data/interaction orchestration into dedicated hooks and components.')
}
for (const [label, source] of [
  ['workspace data orchestration', workspaceDataSource],
  ['workspace profile orchestration', workspaceProfileSource],
  ['foreground interaction orchestration', foregroundInteractionSource],
]) {
  if (!source.trim()) failures.push(label + ' refactor boundary is empty.')
}
if (!existsSync(workspaceContextRailPath)) {
  failures.push('Workspace context rail must remain isolated from the application composition root.')
}
if (!/const EnvironmentScene = lazy\(\(\) => import\('\.\.\/environment\/EnvironmentScene'/.test(appCompositionSource)) {
  failures.push('Heavy WebGL environment renderer must remain code-split from the initial application chunk.')
}
if (!/const forceWeatherFetch = true/.test(environmentHookSource)
  || !/usableCached && !forceWeatherFetch/.test(environmentHookSource)
  || !/visibilityState === 'visible'/.test(environmentHookSource)
  || !/refresh\(false, false\)/.test(environmentHookSource)) {
  failures.push('Background environment refresh must respect the fresh weather cache instead of refetching on every visibility change.')