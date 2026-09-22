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
const modalCandidates = tsxFiles.filter((file) => /role="dialog"[\s\S]{0,240}aria-modal="true"/.test(readFileSync(file, 'utf8')))
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

if (existsSync(join(srcDir, 'styles/app.css'))) {
  failures.push('Legacy styles/app.css must remain removed from the active stylesheet tree.')
}
if (uiSystem.includes('backdrop-filter')) {
  failures.push('Active ui-system.css must not use persistent backdrop-filter.')
}
if (!/--font-ui\s*:/.test(tokens) || !/--font-display\s*:/.test(tokens) || !/--ease-spring\s*:/.test(tokens)) {
  failures.push('Canonical MiD design tokens are missing from tokens.css.')
}
if (!/FeatureLandscape/.test(dashboard) || !/<FeatureLandscape/.test(dashboard)) {
  failures.push('Dashboard signature FeatureLandscape must remain wired into DashboardView.')
}
if (!tsxFiles.some((file) => file.endsWith('app/App.tsx') && /useEnvironment/.test(readFileSync(file, 'utf8')) && /EnvironmentScene/.test(readFileSync(file, 'utf8')))) {
  failures.push('Living environment must be wired into the application shell.')
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
