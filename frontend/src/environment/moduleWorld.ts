import type { View } from '../types'

export type WorldVec3 = [number, number, number]
export type WorldLandmarkKind = 'ridge' | 'grove' | 'shelter'

export interface WorldModuleCamera {
  eye: WorldVec3
  target: WorldVec3
}

export interface WorldModuleComposition {
  landmarkKind: WorldLandmarkKind
  landmark: WorldVec3
  landmarkScale: number
  foregroundLeft: WorldVec3
  foregroundRight: WorldVec3
  horizon: WorldVec3
}

export interface WorldModuleAnchor {
  view: View
  position: WorldVec3
  color: WorldVec3
  camera: WorldModuleCamera
  composition: WorldModuleComposition
}

const anchors: WorldModuleAnchor[] = [
  {
    view: 'dashboard',
    position: [0, 0.58, 1.25],
    color: [0.11, 0.42, 0.52],
    camera: { eye: [0, 4.25, 10.8], target: [0, 1.4, 1.0] },
    composition: {
      landmarkKind: 'shelter',
      landmark: [0, 0.18, -1.15],
      landmarkScale: 0.92,
      foregroundLeft: [-7.8, 0.08, 6.2],
      foregroundRight: [7.6, 0.08, 5.8],
      horizon: [0, 0.08, -9.6],
    },
  },
  {
    view: 'schedule',
    position: [-5.0, 0.34, -0.8],
    color: [0.34, 0.29, 0.54],
    camera: { eye: [-2.4, 4.3, 10.8], target: [-1.8, 1.35, 0.2] },
    composition: {
      landmarkKind: 'ridge',
      landmark: [-4.2, 0.18, -1.6],
      landmarkScale: 0.88,
      foregroundLeft: [-7.6, 0.08, 5.5],
      foregroundRight: [4.9, 0.06, 5.8],
      horizon: [-6.8, 0.1, -9.4],
    },
  },
  {
    view: 'tasks',
    position: [-6.3, 0.3, 2.7],
    color: [0.22, 0.46, 0.31],
    camera: { eye: [-3.5, 4.25, 11.2], target: [-3.0, 1.35, 1.3] },
    composition: {
      landmarkKind: 'grove',
      landmark: [-5.5, 0.16, 1.35],
      landmarkScale: 0.9,
      foregroundLeft: [-8.2, 0.08, 5.4],
      foregroundRight: [3.8, 0.06, 5.8],
      horizon: [-8.6, 0.08, -8.8],
    },
  },
  {
    view: 'finance',
    position: [5.3, 0.3, 2.8],
    color: [0.5, 0.39, 0.2],
    camera: { eye: [3.4, 4.2, 11.2], target: [2.9, 1.35, 1.4] },
    composition: {
      landmarkKind: 'shelter',
      landmark: [5, 0.16, 1.2],
      landmarkScale: 0.9,
      foregroundLeft: [-5.4, 0.06, 5.8],
      foregroundRight: [8.3, 0.08, 5.1],
      horizon: [8.6, 0.08, -8.6],
    },
  },
  {
    view: 'social',
    position: [6.2, 0.28, -1.3],
    color: [0.51, 0.26, 0.34],
    camera: { eye: [3.9, 4.25, 10.4], target: [3.2, 1.35, -0.2] },
    composition: {
      landmarkKind: 'grove',
      landmark: [5.4, 0.15, -1.15],
      landmarkScale: 0.88,
      foregroundLeft: [-5.9, 0.06, 5.9],
      foregroundRight: [8.5, 0.08, 4.8],
      horizon: [8.7, 0.08, -8.2],
    },
  },
  {
    view: 'assistant',
    position: [3.9, 0.26, -4.4],
    color: [0.2, 0.46, 0.53],
    camera: { eye: [2.6, 4.2, 9.0], target: [2.0, 1.35, -1.9] },
    composition: {
      landmarkKind: 'shelter',
      landmark: [3.6, 0.14, -3.3],
      landmarkScale: 0.82,
      foregroundLeft: [-6.7, 0.06, 5.6],
      foregroundRight: [7.8, 0.08, 5.3],
      horizon: [7.2, 0.08, -9],
    },
  },
  {
    view: 'profile',
    position: [0, 0.25, -6.7],
    color: [0.42, 0.45, 0.48],
    camera: { eye: [0, 4.1, 7.8], target: [0, 1.3, -2.3] },
    composition: {
      landmarkKind: 'ridge',
      landmark: [0, 0.16, -5.45],
      landmarkScale: 0.96,
      foregroundLeft: [-7.5, 0.08, 4.8],
      foregroundRight: [7.7, 0.08, 4.8],
      horizon: [0, 0.08, -9.8],
    },
  },
  {
    view: 'insights',
    position: [-3.9, 0.27, -5.2],
    color: [0.27, 0.33, 0.56],
    camera: { eye: [-2.4, 4.15, 8.7], target: [-2.1, 1.3, -1.8] },
    composition: {
      landmarkKind: 'shelter',
      landmark: [-3.5, 0.14, -4.2],
      landmarkScale: 0.82,
      foregroundLeft: [-8, 0.08, 5.1],
      foregroundRight: [5.7, 0.07, 5.4],
      horizon: [-8.5, 0.08, -9],
    },
  },
  {
    view: 'habits',
    position: [-6.1, 0.26, -3.5],
    color: [0.39, 0.51, 0.27],
    camera: { eye: [-3.8, 4.2, 9.5], target: [-3.2, 1.3, -0.9] },
    composition: {
      landmarkKind: 'grove',
      landmark: [-5.2, 0.14, -2.65],
      landmarkScale: 0.86,
      foregroundLeft: [-8.5, 0.08, 5.3],
      foregroundRight: [5.2, 0.07, 5.6],
      horizon: [-8.8, 0.08, -8.7],
    },
  },
]

export function worldModuleAnchors(): readonly WorldModuleAnchor[] {
  return anchors
}

export function worldModuleAnchor(view: View): WorldModuleAnchor {
  return anchors.find((anchor) => anchor.view === view) ?? anchors[0]
}
