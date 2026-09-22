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
const modalCandidates = tsxFiles.filter((file) => readFileSync(file, 'utf8').includes('role="dialog"'))

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
