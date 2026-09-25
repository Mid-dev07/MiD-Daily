import type { View } from '../types'

export type WorldVec3 = [number, number, number]

export interface WorldModuleAnchor {
  view: View
  position: WorldVec3
  color: WorldVec3
}

const anchors: WorldModuleAnchor[] = [
  { view: 'dashboard', position: [0, 0.58, 1.25], color: [0.11, 0.42, 0.52] },
  { view: 'schedule', position: [-5.0, 0.34, -0.8], color: [0.34, 0.29, 0.54] },
  { view: 'tasks', position: [-6.3, 0.3, 2.7], color: [0.22, 0.46, 0.31] },
  { view: 'finance', position: [5.3, 0.3, 2.8], color: [0.5, 0.39, 0.2] },
  { view: 'social', position: [6.2, 0.28, -1.3], color: [0.51, 0.26, 0.34] },
  { view: 'assistant', position: [3.9, 0.26, -4.4], color: [0.2, 0.46, 0.53] },
  { view: 'profile', position: [0, 0.25, -6.7], color: [0.42, 0.45, 0.48] },
  { view: 'insights', position: [-3.9, 0.27, -5.2], color: [0.27, 0.33, 0.56] },
  { view: 'habits', position: [-6.1, 0.26, -3.5], color: [0.39, 0.51, 0.27] },
]

export function worldModuleAnchors(): readonly WorldModuleAnchor[] {
  return anchors
}

export function worldModuleAnchor(view: View): WorldModuleAnchor {
  return anchors.find((anchor) => anchor.view === view) ?? anchors[0]
}
