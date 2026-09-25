import type { View } from '../types'

export type WorldVec3 = [number, number, number]

export interface WorldModuleCamera {
  eye: WorldVec3
  target: WorldVec3
}

export interface WorldModuleAnchor {
  view: View
  position: WorldVec3
  color: WorldVec3
  camera: WorldModuleCamera
}

const anchors: WorldModuleAnchor[] = [
  {
    view: 'dashboard',
    position: [0, 0.58, 1.25],
    color: [0.11, 0.42, 0.52],
    camera: { eye: [0, 4.25, 10.8], target: [0, 1.4, 1.0] },
  },
  {
    view: 'schedule',
    position: [-5.0, 0.34, -0.8],
    color: [0.34, 0.29, 0.54],
    camera: { eye: [-2.4, 4.3, 10.8], target: [-1.8, 1.35, 0.2] },
  },
  {
    view: 'tasks',
    position: [-6.3, 0.3, 2.7],
    color: [0.22, 0.46, 0.31],
    camera: { eye: [-3.5, 4.25, 11.2], target: [-3.0, 1.35, 1.3] },
  },
  {
    view: 'finance',
    position: [5.3, 0.3, 2.8],
    color: [0.5, 0.39, 0.2],
    camera: { eye: [3.4, 4.2, 11.2], target: [2.9, 1.35, 1.4] },
  },
  {
    view: 'social',
    position: [6.2, 0.28, -1.3],
    color: [0.51, 0.26, 0.34],
    camera: { eye: [3.9, 4.25, 10.4], target: [3.2, 1.35, -0.2] },
  },
  {
    view: 'assistant',
    position: [3.9, 0.26, -4.4],
    color: [0.2, 0.46, 0.53],
    camera: { eye: [2.6, 4.2, 9.0], target: [2.0, 1.35, -1.9] },
  },
  {
    view: 'profile',
    position: [0, 0.25, -6.7],
    color: [0.42, 0.45, 0.48],
    camera: { eye: [0, 4.1, 7.8], target: [0, 1.3, -2.3] },
  },
  {
    view: 'insights',
    position: [-3.9, 0.27, -5.2],
    color: [0.27, 0.33, 0.56],
    camera: { eye: [-2.4, 4.15, 8.7], target: [-2.1, 1.3, -1.8] },
  },
  {
    view: 'habits',
    position: [-6.1, 0.26, -3.5],
    color: [0.39, 0.51, 0.27],
    camera: { eye: [-3.8, 4.2, 9.5], target: [-3.2, 1.3, -0.9] },
  },
]

export function worldModuleAnchors(): readonly WorldModuleAnchor[] {
  return anchors
}

export function worldModuleAnchor(view: View): WorldModuleAnchor {
  return anchors.find((anchor) => anchor.view === view) ?? anchors[0]
}
