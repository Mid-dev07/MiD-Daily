import { useEffect, useRef } from 'react'
import type { View } from '../types'
import { worldModuleAnchor, worldModuleAnchors } from './moduleWorld'
import { environmentLightDirection } from './mood'
import type { EnvironmentState } from './types'

interface MiDWorldCanvasProps {
  environment: EnvironmentState
  activeView: View
  workload: 'low' | 'medium' | 'high'
  onReady?: (ready: boolean) => void
}

type Vec3 = [number, number, number]

const DEFAULT_LIGHT_DIRECTION: Vec3 = [
  Math.cos((145 * Math.PI) / 180),
  0.82,
  Math.sin((145 * Math.PI) / 180),
]

const DESKTOP_FPS = 45
const MOBILE_FPS = 30
const MAX_WORLD_PIXELS = 2_200_000
const MODULE_ANCHORS = worldModuleAnchors()

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
  vec4 world = uModel * vec4(aPosition, 1.0);
  vWorldPosition = world.xyz;
  vWorldNormal = normalize(mat3(uModel) * aNormal);
  gl_Position = uProjection * uView * world;
}
`

const FRAGMENT_SHADER = `
precision mediump float;

uniform vec3 uCameraPosition;
uniform vec3 uLightDirection;
uniform vec3 uBaseColor;
uniform float uLightIntensity;
uniform float uEmissive;
uniform float uKind;
uniform float uWetness;
uniform float uLightWarmth;
uniform float uSkyCoolness;
uniform float uAirDensity;
uniform float uPrecipitation;
uniform float uOpacity;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

float surfaceHash(vec2 position) {
  return fract(sin(dot(position, vec2(127.1, 311.7))) * 43758.5453123);
}

float smoothNoise(vec2 position) {
  vec2 cell = floor(position);
  vec2 local = fract(position);
  local = local * local * (3.0 - 2.0 * local);

  float a = surfaceHash(cell);
  float b = surfaceHash(cell + vec2(1.0, 0.0));
  float c = surfaceHash(cell + vec2(0.0, 1.0));
  float d = surfaceHash(cell + vec2(1.0, 1.0));

  return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
}

float organicNoise(vec2 position) {
  float broad = smoothNoise(position * 0.42);
  float medium = smoothNoise(position * 1.2) * 0.42;
  float fine = smoothNoise(position * 3.4) * 0.16;
  return broad * 0.62 + medium + fine;
}

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 lightDir = normalize(uLightDirection);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

  if (uKind > 5.5) {
    float contactFalloff = 0.72 + 0.18 * max(normal.y, 0.0);
    gl_FragColor = vec4(uBaseColor * contactFalloff, uOpacity);
    return;
  }

  float diffuse = max(dot(normal, lightDir), 0.0);
  float wrap = mix(0.16, 0.3, 1.0 - max(normal.y, 0.0));
  float halfLambert = clamp((diffuse + wrap) / (1.0 + wrap), 0.0, 1.0);
  vec3 halfVector = normalize(lightDir + viewDir);

  /* Material family profile:
     1 mineral/architectural, 2 terrain, 3 rock/stone, 4 foliage, 5 wet surface. */
  float roughness = 0.9;
  float wetResponse = 0.5;
  float materialDiffuseResponse = 1.0;
  float specularGain = 1.0;
  float moistureRetention = 0.82;

  if (uKind > 0.5 && uKind < 1.5) {
    roughness = 0.82;
    wetResponse = 0.62;
    materialDiffuseResponse = 1.0;
    specularGain = 0.9;
    moistureRetention = 0.78;
  } else if (uKind > 1.5 && uKind < 2.5) {
    roughness = 0.96;
    wetResponse = 0.56;
    materialDiffuseResponse = 0.96;
    specularGain = 0.62;
    moistureRetention = 0.72;
  } else if (uKind > 2.5 && uKind < 3.5) {
    roughness = 0.66;
    wetResponse = 0.88;
    materialDiffuseResponse = 1.03;
    specularGain = 1.12;
    moistureRetention = 0.9;
  } else if (uKind > 3.5 && uKind < 4.5) {
    roughness = 0.97;
    wetResponse = 0.28;
    materialDiffuseResponse = 0.92;
    specularGain = 0.38;
    moistureRetention = 0.55;
  } else if (uKind > 4.5 && uKind < 5.5) {
    roughness = 0.3;
    wetResponse = 1.0;
    materialDiffuseResponse = 0.84;
    specularGain = 1.65;
    moistureRetention = 1.0;
  }

  float precipitation = clamp(uPrecipitation, 0.0, 1.0);
  float wet = clamp(max(uWetness, precipitation * 0.34) * wetResponse, 0.0, 1.0);
  float horizontalWetness = smoothstep(0.84, 1.0, max(normal.y, 0.0));
  float groundWet = smoothstep(0.0, 0.7, max(vWorldPosition.y, 0.0));
  float rainfallPooling = precipitation * horizontalWetness * (uKind > 1.5 && uKind < 5.5 ? 0.18 : 0.04);
  float materialWetness = clamp(wet * mix(1.0, 0.72, groundWet) + rainfallPooling, 0.0, 1.0);
  float specularPower = mix(10.0, 72.0, 1.0 - roughness);
  float puddleSpecular = uKind > 4.5 && uKind < 5.5
    ? precipitation * horizontalWetness * 0.14
    : 0.0;
  float weatherSpecular = uKind > 3.5 && uKind < 4.5
    ? wet * 0.035
    : materialWetness * 0.24 + puddleSpecular;
  float specularStrength = (mix(0.025, 0.16, 1.0 - roughness) + weatherSpecular) * specularGain;
  float specular = pow(max(dot(normal, halfVector), 0.0), specularPower) * specularStrength;
  float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0) * 0.05;

  float macroNoise = organicNoise(vWorldPosition.xz * 0.92);
  float microNoise = organicNoise(vWorldPosition.xz * 2.6);
  float fineNoise = smoothNoise(vWorldPosition.xz * 9.0);
  float surfaceVariation = mix(0.9, 1.07, macroNoise * 0.7 + microNoise * 0.2 + fineNoise * 0.1);

  vec3 materialBase = uBaseColor * surfaceVariation;
  if (uKind > 1.5 && uKind < 2.5) {
    float naturalBreak = mix(0.84, 1.06, macroNoise * 0.72 + microNoise * 0.28);
    float slope = 1.0 - max(normal.y, 0.0);
    float shallowCavity = 1.0 - smoothstep(0.25, 0.82, macroNoise);
    float groundVariation = 1.0 - slope * 0.16 - shallowCavity * 0.035;
    materialBase *= naturalBreak * groundVariation;
  } else if (uKind > 3.5 && uKind < 4.5) {
    float leafBacklight = pow(max(dot(-normal, lightDir), 0.0), 1.6) * 0.09;
    float dampLeaf = mix(1.0, 1.08, wet * 0.46);
    materialBase *= dampLeaf;
    materialBase += vec3(0.012, 0.028, 0.016) * leafBacklight * (1.0 - wet * 0.3);
  }

  float wetDarken = mix(1.0, 0.76, clamp(materialWetness * moistureRetention, 0.0, 1.0));
  materialBase *= wetDarken;

  float contact = 1.0;
  if (uKind > 0.5 && uKind < 4.5) {
    float groundBand = 1.0 - smoothstep(0.02, 0.34, max(vWorldPosition.y, 0.0));
    contact = mix(1.0, 0.72, groundBand * 0.24);
  }

  float grid = 0.0;
  if (uKind < 0.5) {
    vec2 cell = abs(fract(vWorldPosition.xz * 0.5 - 0.5) - 0.5);
    float line = 1.0 - min(min(cell.x, cell.y) / 0.045, 1.0);
    vec2 fineCell = abs(fract(vWorldPosition.xz * 0.1 - 0.5) - 0.5);
    float fine = 1.0 - min(min(fineCell.x, fineCell.y) / 0.06, 1.0);
    grid = max(line * 0.16, fine * 0.045);
  }

  float verticalBlend = clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 skyFill = vec3(0.11, 0.17, 0.22) * (0.82 + uSkyCoolness * 0.45);
  vec3 groundFill = mix(
    vec3(0.09, 0.11, 0.1),
    vec3(0.16, 0.11, 0.07),
    uLightWarmth,
  );
  vec3 ambientFill = mix(groundFill, skyFill, verticalBlend) * (0.13 + uLightIntensity * 0.06);
  vec3 sunColor = mix(
    vec3(0.82, 0.88, 0.94),
    vec3(1.0, 0.76, 0.5),
    uLightWarmth,
  );
  vec3 directionalLight = sunColor * (0.2 + halfLambert * 0.7 * uLightIntensity);

  vec3 materialLighting = ambientFill + directionalLight * materialDiffuseResponse;
  vec3 base = materialBase * materialLighting * contact;
  vec3 reflected = vec3(specular + rim);
  vec3 emissive = uBaseColor * uEmissive;
  vec3 color = base + reflected + emissive + uBaseColor * grid;

  float distanceFade = smoothstep(24.0, 6.0, length(vWorldPosition.xz));
  float localContrast = mix(0.98, 1.025, distanceFade);
  color *= localContrast;

  float viewDistance = length(uCameraPosition - vWorldPosition);
  float farBand = smoothstep(12.0, 32.0, viewDistance);
  float atmosphericDensity = clamp(uAirDensity * 0.34, 0.0, 0.48);
  float weatherHaze = precipitation * smoothstep(10.0, 4.0, viewDistance) * atmosphericDensity * 0.016;
  float atmosphericFade = min(
    0.58,
    farBand * atmosphericDensity * 0.68 + weatherHaze,
  );
  vec3 coolAtmosphere = mix(
    vec3(0.045, 0.07, 0.09),
    vec3(0.075, 0.11, 0.13),
    uSkyCoolness,
  );
  vec3 warmAtmosphere = mix(
    vec3(0.11, 0.10, 0.085),
    vec3(0.16, 0.125, 0.095),
    uLightWarmth,
  );
  vec3 atmosphereColor = mix(coolAtmosphere, warmAtmosphere, uLightWarmth * 0.72);
  color = mix(color, atmosphereColor, atmosphericFade);

  gl_FragColor = vec4(color, uOpacity);
}
`

interface Mesh {
  vao: WebGLVertexArrayObject
  vertexCount: number
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('WebGL shader could not be created.')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error.'
    gl.deleteShader(shader)
    throw new Error(log)
  }
  return shader
}

function createProgram(gl: WebGL2RenderingContext) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  const program = gl.createProgram()
  if (!program) throw new Error('WebGL program could not be created.')
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || 'Unknown WebGL link error.'
    gl.deleteProgram(program)
    throw new Error(log)
  }

  return program
}

function perspective(out: Float32Array, fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2)
  out[0] = f / aspect
  out[1] = 0
  out[2] = 0
  out[3] = 0
  out[4] = 0
  out[5] = f
  out[6] = 0
  out[7] = 0
  out[8] = 0
  out[9] = 0
  out[10] = (far + near) / (near - far)
  out[11] = -1
  out[12] = 0
  out[13] = 0
  out[14] = (2 * far * near) / (near - far)
  out[15] = 0
}

function lookAt(out: Float32Array, eye: Vec3, target: Vec3, up: Vec3) {
  let zx = eye[0] - target[0]
  let zy = eye[1] - target[1]
  let zz = eye[2] - target[2]
  const zLength = Math.hypot(zx, zy, zz) || 1
  zx /= zLength
  zy /= zLength
  zz /= zLength

  let xx = up[1] * zz - up[2] * zy
  let xy = up[2] * zx - up[0] * zz
  let xz = up[0] * zy - up[1] * zx
  const xLength = Math.hypot(xx, xy, xz) || 1
  xx /= xLength
  xy /= xLength
  xz /= xLength

  const yx = zy * xz - zz * xy
  const yy = zz * xx - zx * xz
  const yz = zx * xy - zy * xx

  out[0] = xx
  out[1] = yx
  out[2] = zx
  out[3] = 0
  out[4] = xy
  out[5] = yy
  out[6] = zy
  out[7] = 0
  out[8] = xz
  out[9] = yz
  out[10] = zz
  out[11] = 0
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2])
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2])
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2])
  out[15] = 1
}

function modelMatrix(out: Float32Array, position: Vec3, scale: Vec3, rotationY = 0) {
  const c = Math.cos(rotationY)
  const s = Math.sin(rotationY)

  out[0] = c * scale[0]
  out[1] = 0
  out[2] = -s * scale[0]
  out[3] = 0
  out[4] = 0
  out[5] = scale[1]
  out[6] = 0
  out[7] = 0
  out[8] = s * scale[2]
  out[9] = 0
  out[10] = c * scale[2]
  out[11] = 0
  out[12] = position[0]
  out[13] = position[1]
  out[14] = position[2]
  out[15] = 1
}

function boxGeometry() {
  const faces: Array<{ normal: Vec3; corners: Vec3[] }> = [
    { normal: [0, 0, 1], corners: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
    { normal: [0, 0, -1], corners: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
    { normal: [1, 0, 0], corners: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
    { normal: [-1, 0, 0], corners: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
    { normal: [0, 1, 0], corners: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
    { normal: [0, -1, 0], corners: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
  ]
  const vertices: number[] = []

  for (const face of faces) {
    const [a, b, c, d] = face.corners
    for (const corner of [a, b, c, a, c, d]) {
      vertices.push(corner[0], corner[1], corner[2], face.normal[0], face.normal[1], face.normal[2])
    }
  }

  return new Float32Array(vertices)
}

function rockGeometry(variant = 0) {
  const vertices: number[] = []
  const sides = 10
  const phase = variant * 0.83
  const radii = Array.from({ length: sides }, (_, index) => (
    0.74 + 0.26 * ((Math.sin(index * 1.71 + phase) + 1) * 0.5)
  ))
  const heights = Array.from({ length: sides }, (_, index) => (
    0.62 + 0.4 * ((Math.cos(index * 1.43 + phase * 0.7) + 1) * 0.5)
  ))

  const normalFor = (point: Vec3): Vec3 => {
    const normal = [point[0], point[1] * 0.82, point[2]] as Vec3
    const length = Math.hypot(normal[0], normal[1], normal[2]) || 1
    return [normal[0] / length, normal[1] / length, normal[2] / length]
  }

  const ringPoint = (index: number, radiusScale: number, heightScale: number): Vec3 => {
    const angle = (index / sides) * Math.PI * 2
    const wobble = 1 + 0.035 * Math.sin(index * 2.31 + phase)
    const radius = radii[index] * radiusScale * wobble
    return [
      Math.cos(angle) * radius,
      heights[index] * heightScale,
      Math.sin(angle) * radius,
    ]
  }

  for (let i = 0; i < sides; i += 1) {
    const next = (i + 1) % sides
    const bottomA: Vec3 = [
      Math.cos((i / sides) * Math.PI * 2) * radii[i],
      0,
      Math.sin((i / sides) * Math.PI * 2) * radii[i],
    ]
    const bottomB: Vec3 = [
      Math.cos((next / sides) * Math.PI * 2) * radii[next],
      0,
      Math.sin((next / sides) * Math.PI * 2) * radii[next],
    ]
    const shoulderA = ringPoint(i, 0.9, 0.58)
    const shoulderB = ringPoint(next, 0.9, 0.58)
    const crownA = ringPoint(i, 0.55, 0.9)
    const crownB = ringPoint(next, 0.55, 0.9)

    for (const corner of [bottomA, bottomB, shoulderB, bottomA, shoulderB, shoulderA, shoulderA, shoulderB, crownB, shoulderA, crownB, crownA]) {
      const normal = normalFor(corner)
      vertices.push(corner[0], corner[1], corner[2], normal[0], normal[1], normal[2])
    }
  }

  const top: Vec3 = [0, 0.96 + variant * 0.045, 0]
  for (let i = 0; i < sides; i += 1) {
    const next = (i + 1) % sides
    const crownA = ringPoint(i, 0.55, 0.9)
    const crownB = ringPoint(next, 0.55, 0.9)
    for (const corner of [crownA, crownB, top]) {
      vertices.push(corner[0], corner[1], corner[2], 0, 1, 0)
    }
  }

  return new Float32Array(vertices)
}

function terrainHeight(x: number, z: number) {
  const radial = Math.min(1, Math.hypot(x, z) / 18)
  const centerCalm = Math.max(0, 1 - Math.hypot(x, z) / 7.4)

  const broadLandform =
    Math.sin(x * 0.16 + 0.8) * 0.13 +
    Math.cos(z * 0.19 - 0.6) * 0.09
  const crossLandform =
    Math.sin((x + z) * 0.115) * 0.075 +
    Math.cos((x - z) * 0.17) * 0.05
  const midsizeBreak =
    Math.sin(x * 0.46 + z * 0.19) * 0.038 +
    Math.cos(z * 0.52 - x * 0.14) * 0.028
  const microRelief =
    Math.sin(x * 1.08 - z * 0.62) * 0.014 +
    Math.cos(z * 1.22 + x * 0.42) * 0.011
  const edgeLift = Math.pow(radial, 2.2) * 0.1

  const relief = (
    broadLandform +
    crossLandform +
    midsizeBreak +
    microRelief +
    edgeLift
  ) * 2.65

  return relief * (1 - centerCalm * 0.78)
}

function groundSurfaceY(x: number, z: number, offset = 0) {
  return terrainHeight(x, z) + offset
}

function terrainGeometry() {
  const segments = 28
  const size = 18
  const step = (size * 2) / segments
  const vertices: number[] = []

  const normalAt = (x: number, z: number): Vec3 => {
    const left = terrainHeight(x - step, z)
    const right = terrainHeight(x + step, z)
    const down = terrainHeight(x, z - step)
    const up = terrainHeight(x, z + step)
    let nx = -(right - left) / (2 * step)
    let ny = 1
    let nz = -(up - down) / (2 * step)
    const length = Math.hypot(nx, ny, nz) || 1
    nx /= length
    ny /= length
    nz /= length
    return [nx, ny, nz]
  }

  type SurfacePoint = {
    position: Vec3
    normal: Vec3
  }

  const point = (x: number, z: number): SurfacePoint => ({
    position: [x, terrainHeight(x, z), z],
    normal: normalAt(x, z),
  })

  const pushTriangle = (
    a: SurfacePoint,
    b: SurfacePoint,
    c: SurfacePoint,
  ) => {
    for (const corner of [a, b, c]) {
      vertices.push(
        corner.position[0],
        corner.position[1],
        corner.position[2],
        corner.normal[0],
        corner.normal[1],
        corner.normal[2],
      )
    }
  }

  for (let row = 0; row < segments; row += 1) {
    const z0 = -size + row * step
    const z1 = z0 + step

    for (let column = 0; column < segments; column += 1) {
      const x0 = -size + column * step
      const x1 = x0 + step

      const a = point(x0, z0)
      const b = point(x1, z0)
      const c = point(x1, z1)
      const d = point(x0, z1)

      pushTriangle(a, b, c)
      pushTriangle(a, c, d)
    }
  }

  return new Float32Array(vertices)
}
function foliageGeometry() {
  const vertices: number[] = []
  const blades = 12
  const heights = [0.64, 0.79, 0.71, 0.91, 0.76, 0.84, 0.68, 0.94, 0.77, 0.87, 0.7, 0.82]

  const pushTriangle = (a: Vec3, b: Vec3, c: Vec3) => {
    const ux = b[0] - a[0]
    const uy = b[1] - a[1]
    const uz = b[2] - a[2]
    const vx = c[0] - a[0]
    const vy = c[1] - a[1]
    const vz = c[2] - a[2]
    let nx = uy * vz - uz * vy
    let ny = uz * vx - ux * vz
    let nz = ux * vy - uy * vx
    const length = Math.hypot(nx, ny, nz) || 1
    nx /= length
    ny /= length
    nz /= length

    for (const point of [a, b, c]) {
      vertices.push(point[0], point[1], point[2], nx, ny, nz)
    }
    for (const point of [c, b, a]) {
      vertices.push(point[0], point[1], point[2], -nx, -ny, -nz)
    }
  }

  for (let index = 0; index < blades; index += 1) {
    const angle = (index / blades) * Math.PI * 2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const width = 0.085 + (index % 4) * 0.023
    const height = heights[index]
    const leanX = 0.055 + (index % 5) * 0.022
    const leanZ = Math.sin(index * 1.47) * 0.06
    const midY = height * (0.42 + (index % 3) * 0.035)
    const midLean = leanX * 0.42

    const rotate = (point: Vec3): Vec3 => [
      point[0] * cos - point[2] * sin,
      point[1],
      point[0] * sin + point[2] * cos,
    ]

    const bottomLeft = rotate([-width, 0, 0])
    const bottomRight = rotate([width, 0, 0])
    const midLeft = rotate([-width * 0.62, midY, leanZ * 0.18])
    const midRight = rotate([width * 0.62, midY, leanZ * 0.18])
    const tip = rotate([midLean + leanX * 0.58, height, leanZ])

    pushTriangle(bottomLeft, bottomRight, midRight)
    pushTriangle(bottomLeft, midRight, midLeft)
    pushTriangle(midLeft, midRight, tip)
  }

  return new Float32Array(vertices)
}

function treeTrunkGeometry() {
  const vertices: number[] = []
  const sides = 9
  const levels = [
    { y: 0, radius: 0.29, bend: 0 },
    { y: 0.72, radius: 0.265, bend: 0.035 },
    { y: 1.42, radius: 0.225, bend: 0.08 },
    { y: 2.15, radius: 0.17, bend: 0.13 },
  ]
  const phase = 0.31

  const point = (ring: number, index: number): Vec3 => {
    const level = levels[ring]
    const angle = (index / sides) * Math.PI * 2 + phase
    const organicRadius = 1 + 0.065 * Math.sin(index * 1.73 + phase + ring * 0.58)
    return [
      Math.cos(angle) * level.radius * organicRadius + level.bend,
      level.y,
      Math.sin(angle) * level.radius * organicRadius + level.bend * 0.34,
    ]
  }

  const pushVertex = (corner: Vec3, ring: number) => {
    const level = levels[ring]
    const nx = corner[0] - level.bend
    const ny = 0.12 + (ring === levels.length - 1 ? 0.05 : 0)
    const nz = corner[2] - level.bend * 0.34
    const length = Math.hypot(nx, ny, nz) || 1
    vertices.push(
      corner[0],
      corner[1],
      corner[2],
      nx / length,
      ny / length,
      nz / length,
    )
  }

  for (let ring = 0; ring < levels.length - 1; ring += 1) {
    const nextRing = ring + 1
    for (let index = 0; index < sides; index += 1) {
      const nextIndex = (index + 1) % sides
      const a = point(ring, index)
      const b = point(ring, nextIndex)
      const c = point(nextRing, nextIndex)
      const d = point(nextRing, index)

      pushVertex(a, ring)
      pushVertex(b, ring)
      pushVertex(c, nextRing)
      pushVertex(a, ring)
      pushVertex(c, nextRing)
      pushVertex(d, nextRing)
    }
  }

  return new Float32Array(vertices)
}

function canopyGeometry() {
  const vertices: number[] = []
  const segments = 14
  const rings = 6
  const lobeCenters = [
    { x: -0.43, y: 0.03, z: 0.02, scale: 0.88 },
    { x: 0.38, y: 0.10, z: 0.08, scale: 0.96 },
    { x: 0.02, y: -0.02, z: -0.42, scale: 0.82 },
  ]

  for (let lobeIndex = 0; lobeIndex < lobeCenters.length; lobeIndex += 1) {
    const center = lobeCenters[lobeIndex]

    const point = (ring: number, index: number): { position: Vec3; normal: Vec3 } => {
      const theta = (ring / rings) * Math.PI
      const angle = (index / segments) * Math.PI * 2
      const baseY = Math.cos(theta)
      const baseRadius = Math.sin(theta)
      const lobe =
        1 +
        0.12 * Math.sin(angle * 3 + ring * 0.86 + lobeIndex * 1.13) +
        0.055 * Math.cos(angle * 5 - ring * 0.68 + lobeIndex * 0.71)
      const verticalScale = 0.86 + 0.08 * Math.cos(angle * 2 - ring * 0.52 + lobeIndex)
      const offsetX = 0.055 * Math.sin(angle * 2 + ring * 0.7 + lobeIndex * 0.42)
      const offsetZ = 0.045 * Math.cos(angle * 3 - ring * 0.45 + lobeIndex * 0.63)

      const local: Vec3 = [
        Math.cos(angle) * baseRadius * lobe * center.scale + offsetX,
        baseY * verticalScale * center.scale,
        Math.sin(angle) * baseRadius * lobe * center.scale + offsetZ,
      ]
      const position: Vec3 = [
        local[0] + center.x,
        local[1] + center.y,
        local[2] + center.z,
      ]
      const localNormalLength = Math.hypot(local[0], local[1], local[2]) || 1
      const normal: Vec3 = [
        local[0] / localNormalLength,
        local[1] / localNormalLength,
        local[2] / localNormalLength,
      ]
      return { position, normal }
    }

    for (let ring = 0; ring < rings; ring += 1) {
      const nextRing = ring + 1
      for (let index = 0; index < segments; index += 1) {
        const nextIndex = (index + 1) % segments
        const a = point(ring, index)
        const b = point(ring, nextIndex)
        const c = point(nextRing, nextIndex)
        const d = point(nextRing, index)

        for (const corner of [a, b, c, a, c, d]) {
          vertices.push(
            corner.position[0],
            corner.position[1],
            corner.position[2],
            corner.normal[0],
            corner.normal[1],
            corner.normal[2],
          )
        }
      }
    }
  }

  return new Float32Array(vertices)
}

function groundShadowGeometry() {
  const vertices: number[] = []
  const segments = 14

  for (let index = 0; index < segments; index += 1) {
    const a0 = (index / segments) * Math.PI * 2
    const a1 = ((index + 1) / segments) * Math.PI * 2
    const r0 = 0.9 + 0.08 * Math.sin(index * 1.7)
    const r1 = 0.9 + 0.08 * Math.sin((index + 1) * 1.7)

    for (const point of [
      [0, 0, 0],
      [Math.cos(a0) * r0, 0, Math.sin(a0) * r0],
      [Math.cos(a1) * r1, 0, Math.sin(a1) * r1],
    ] as Vec3[]) {
      vertices.push(point[0], point[1], point[2], 0, 1, 0)
    }
  }

  return new Float32Array(vertices)
}

function wetPatchGeometry() {
  const vertices: number[] = []
  const segments = 12

  for (let index = 0; index < segments; index += 1) {
    const a0 = (index / segments) * Math.PI * 2
    const a1 = ((index + 1) / segments) * Math.PI * 2
    const irregular0 = 0.82 + 0.16 * Math.sin(index * 1.91 + 0.4)
    const irregular1 = 0.82 + 0.16 * Math.sin((index + 1) * 1.91 + 0.4)
    const edge0: Vec3 = [
      Math.cos(a0) * irregular0,
      0,
      Math.sin(a0) * irregular0,
    ]
    const edge1: Vec3 = [
      Math.cos(a1) * irregular1,
      0,
      Math.sin(a1) * irregular1,
    ]

    for (const point of [[0, 0, 0], edge0, edge1] as Vec3[]) {
      vertices.push(point[0], point[1], point[2], 0, 1, 0)
    }
  }

  return new Float32Array(vertices)
}

function createMesh(gl: WebGL2RenderingContext, data: Float32Array, positionLocation: number, normalLocation: number): Mesh {
  const vao = gl.createVertexArray()
  const buffer = gl.createBuffer()
  if (!vao || !buffer) throw new Error('WebGL geometry resources could not be created.')

  gl.bindVertexArray(vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 24, 0)
  gl.enableVertexAttribArray(normalLocation)
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 24, 12)

  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  gl.bindVertexArray(null)

  return { vao, vertexCount: data.length / 6 }
}

function dayTint(environment: EnvironmentState): Vec3 {
  switch (environment.dayPhase) {
    case 'dawn':
      return [0.4, 0.31, 0.22]
    case 'golden-hour':
      return [0.42, 0.3, 0.2]
    case 'night':
      return [0.13, 0.2, 0.28]
    case 'dusk':
      return [0.27, 0.2, 0.2]
    default:
      return [0.25, 0.31, 0.28]
  }
}

function drawProjectedGroundShadow(
  draw: (
    mesh: Mesh,
    position: Vec3,
    scale: Vec3,
    color: Vec3,
    kind: number,
    emissive?: number,
    rotation?: number,
    opacity?: number,
  ) => void,
  shadowMesh: Mesh,
  lightDirection: Vec3,
  position: Vec3,
  height: number,
  footprint: [number, number],
  color: Vec3,
  softness: number,
) {
  const verticalLight = Math.max(0.28, lightDirection[1])
  const horizontalLength = Math.min(
    5.4,
    Math.max(0.25, height / verticalLight) * (0.62 + softness * 0.32),
  )
  const horizontalX = -lightDirection[0]
  const horizontalZ = -lightDirection[2]
  const horizontalMagnitude = Math.hypot(horizontalX, horizontalZ) || 1
  const dirX = horizontalX / horizontalMagnitude
  const dirZ = horizontalZ / horizontalMagnitude
  const rotation = Math.atan2(-dirX, dirZ)
  const centerX = position[0] + dirX * horizontalLength * 0.5
  const centerZ = position[2] + dirZ * horizontalLength * 0.5
  const scaleX = Math.max(footprint[0], 0.32)
  const scaleZ = Math.max(footprint[1] * 0.56 + horizontalLength * 0.5, 0.46)
  const opacity = Math.max(
    0.08,
    Math.min(0.28, (0.1 + height * 0.022) * (1 - softness * 0.42)),
  )

  draw(
    shadowMesh,
    [centerX, groundSurfaceY(centerX, centerZ, 0.006), centerZ],
    [scaleX, 1, scaleZ],
    color,
    6,
    0,
    rotation,
    opacity,
  )
}

function drawGroundCover(
  draw: (
    mesh: Mesh,
    position: Vec3,
    scale: Vec3,
    color: Vec3,
    kind: number,
    emissive?: number,
    rotation?: number,
    opacity?: number,
  ) => void,
  foliage: Mesh,
  composition: ReturnType<typeof worldModuleAnchor>['composition'],
  fern: Vec3,
  scale: number,
) {
  const [fx, , fz] = composition.foregroundLeft
  const [rx, , rz] = composition.foregroundRight
  const [hx, , hz] = composition.horizon
  const [lx, , lz] = composition.landmark
  const points: Array<[number, number, number, number]> = [
    [fx + 0.55 * scale, fz - 0.18 * scale, 0.48, 0.12],
    [fx - 0.32 * scale, fz + 0.52 * scale, 0.36, -0.24],
    [rx - 0.58 * scale, rz + 0.16 * scale, 0.44, 0.28],
    [rx + 0.32 * scale, rz - 0.46 * scale, 0.34, -0.18],
    [hx - 1.15 * scale, hz + 0.36 * scale, 0.3, 0.18],
    [hx + 1.32 * scale, hz - 0.28 * scale, 0.34, -0.2],
    [lx - 0.88 * scale, lz + 0.54 * scale, 0.4, 0.16],
    [lx + 0.96 * scale, lz - 0.38 * scale, 0.3, -0.14],
  ]

  points.forEach(([x, z, size, rotation], index) => {
    const y = groundSurfaceY(x, z, 0.018)
    const depthScale = index < 4 ? 1 : 0.78
    draw(
      foliage,
      [x, y, z],
      [size * depthScale, size * 0.78 * depthScale, size * depthScale],
      fern,
      4,
      0,
      rotation,
      index < 4 ? 0.82 : 0.54,
    )
  })
}

function drawSpatialPath(
  draw: (
    mesh: Mesh,
    position: Vec3,
    scale: Vec3,
    color: Vec3,
    kind: number,
    emissive?: number,
    rotation?: number,
  ) => void,
  rockA: Mesh,
  rockB: Mesh,
  start: Vec3,
  end: Vec3,
  primary: Vec3,
  secondary: Vec3,
) {
  const dx = end[0] - start[0]
  const dz = end[2] - start[2]
  const distance = Math.hypot(dx, dz)
  if (distance < 0.7) return

  const segments = Math.min(9, Math.max(4, Math.ceil(distance / 1.05)))
  const angle = Math.atan2(-dz, dx)

  for (let index = 0; index < segments; index += 1) {
    const t = (index + 0.5) / segments
    const lateral = Math.sin(index * 1.47) * 0.16
    const midX = start[0] + dx * t + (-Math.sin(angle) * lateral)
    const midZ = start[2] + dz * t + (-Math.cos(angle) * lateral)
    const scale = 0.22 + (index % 3) * 0.035
    const mesh = index % 2 === 0 ? rockA : rockB
    const color = index % 2 === 0 ? primary : secondary

    draw(
      mesh,
      [midX, groundSurfaceY(midX, midZ, 0.022 + (index % 3) * 0.006), midZ],
      [scale, 0.11 + (index % 2) * 0.02, scale * 0.72],
      color,
      3,
      0,
      angle + (index % 2 === 0 ? 0.16 : -0.2),
    )
  }
}

function drawWorldComposition(
  draw: (
    mesh: Mesh,
    position: Vec3,
    scale: Vec3,
    color: Vec3,
    kind: number,
    emissive?: number,
    rotation?: number,
  ) => void,
  rockA: Mesh,
  rockB: Mesh,
  rockC: Mesh,
  foliage: Mesh,
  treeTrunk: Mesh,
  treeCanopy: Mesh,
  composition: ReturnType<typeof worldModuleAnchor>['composition'],
  stone: Vec3,
  moss: Vec3,
  fern: Vec3,
  warm: Vec3,
  scale: number,
) {
  const [fx, , fz] = composition.foregroundLeft
  const [rx, , rz] = composition.foregroundRight
  const [hx, , hz] = composition.horizon
  const [lx, ly, lz] = composition.landmark
  const s = Math.max(0.72, Math.min(1.08, scale))

  draw(rockA, [fx, groundSurfaceY(fx, fz, 0.05), fz], [1.45 * s, 0.72 * s, 1.08 * s], stone, 3, 0, -0.18)
  draw(rockB, [rx, groundSurfaceY(rx, rz, 0.045), rz], [1.3 * s, 0.64 * s, 1.02 * s], moss, 3, 0, 0.16)

  draw(rockC, [hx - 2.0 * s, groundSurfaceY(hx - 2.0 * s, hz + 0.15, 0.04), hz + 0.15], [2.05 * s, 0.66 * s, 1.1 * s], stone, 3, 0, -0.08)
  draw(rockB, [hx + 1.2 * s, groundSurfaceY(hx + 1.2 * s, hz - 0.1, 0.035), hz - 0.1], [1.72 * s, 0.52 * s, 0.92 * s], moss, 3, 0, 0.14)
  draw(rockA, [hx + 3.0 * s, groundSurfaceY(hx + 3.0 * s, hz + 0.22, 0.03), hz + 0.22], [1.18 * s, 0.44 * s, 0.76 * s], fern, 3, 0, -0.2)

  if (composition.landmarkKind === 'grove') {
    draw(
      treeTrunk,
      [lx - 0.7 * s, groundSurfaceY(lx - 0.7 * s, lz, ly + 0.02), lz],
      [0.48 * s, 0.82 * s, 0.48 * s],
      warm,
      1,
      0,
      -0.08,
    )
    draw(
      treeCanopy,
      [lx - 0.7 * s, groundSurfaceY(lx - 0.7 * s, lz, ly + 1.64 * s), lz],
      [1.16 * s, 0.84 * s, 1.0 * s],
      fern,
      4,
      0,
      0.08,
    )
    draw(
      treeCanopy,
      [lx + 0.12 * s, groundSurfaceY(lx + 0.12 * s, lz + 0.26 * s, ly + 1.78 * s), lz + 0.26 * s],
      [0.72 * s, 0.58 * s, 0.66 * s],
      moss,
      4,
      0,
      -0.12,
    )
    draw(foliage, [lx + 0.82 * s, groundSurfaceY(lx + 0.82 * s, lz + 0.12 * s, ly - 0.05), lz + 0.12 * s], [0.72 * s, 0.68 * s, 0.72 * s], fern, 4, 0, 0.2)
    draw(rockC, [lx + 0.76 * s, groundSurfaceY(lx + 0.76 * s, lz + 0.16 * s, 0.05), lz + 0.16 * s], [0.72 * s, 0.34 * s, 0.56 * s], stone, 3, 0, 0.08)
    return
  }

  if (composition.landmarkKind === 'ridge') {
    draw(rockA, [lx - 1.0 * s, groundSurfaceY(lx - 1.0 * s, lz, 0.06), lz], [1.15 * s, 0.56 * s, 0.82 * s], stone, 3, 0, -0.14)
    draw(rockB, [lx + 0.15 * s, groundSurfaceY(lx + 0.15 * s, lz - 0.12 * s, 0.05), lz - 0.12 * s], [1.35 * s, 0.72 * s, 0.92 * s], moss, 3, 0, 0.12)
    draw(rockC, [lx + 1.15 * s, groundSurfaceY(lx + 1.15 * s, lz + 0.08 * s, 0.045), lz + 0.08 * s], [0.92 * s, 0.48 * s, 0.72 * s], fern, 3, 0, -0.18)
    return
  }

  draw(rockA, [lx - 0.72 * s, groundSurfaceY(lx - 0.72 * s, lz, 0.06), lz], [0.86 * s, 0.42 * s, 0.68 * s], stone, 3, 0, -0.22)
  draw(rockB, [lx + 0.02 * s, groundSurfaceY(lx + 0.02 * s, lz + 0.08 * s, 0.08 * s), lz + 0.08 * s], [1.15 * s, 0.58 * s, 0.76 * s], moss, 3, 0, 0.08)
  draw(rockC, [lx + 0.82 * s, groundSurfaceY(lx + 0.82 * s, lz - 0.06 * s, 0.045), lz - 0.06 * s], [0.7 * s, 0.34 * s, 0.54 * s], fern, 3, 0, -0.12)
  draw(foliage, [lx - 0.1 * s, groundSurfaceY(lx - 0.1 * s, lz + 0.78 * s, 0.03), lz + 0.78 * s], [0.58 * s, 0.62 * s, 0.58 * s], fern, 4, 0, 0.18)
}

function drawTree(
  draw: (
    mesh: Mesh,
    position: Vec3,
    scale: Vec3,
    color: Vec3,
    kind: number,
    emissive?: number,
    rotation?: number,
    opacity?: number,
  ) => void,
  trunk: Mesh,
  canopy: Mesh,
  shadowMesh: Mesh,
  lightDirection: Vec3,
  position: Vec3,
  scale: number,
  trunkColor: Vec3,
  canopyColor: Vec3,
  shadowColor: Vec3,
  shadowSoftness: number,
) {
  drawProjectedGroundShadow(
    draw,
    shadowMesh,
    lightDirection,
    [position[0], position[1] + 0.72 * scale, position[2]],
    1.7 * scale,
    [0.76 * scale, 1.18 * scale],
    shadowColor,
    shadowSoftness,
  )
  draw(
    trunk,
    [position[0], position[1], position[2]],
    [0.72 * scale, 1.1 * scale, 0.72 * scale],
    trunkColor,
    1,
    0,
    position[0] * 0.06,
  )
  draw(
    canopy,
    [position[0], position[1] + 2.0 * scale, position[2]],
    [1.72 * scale, 1.16 * scale, 1.48 * scale],
    canopyColor,
    4,
    0,
    position[2] * 0.035,
  )
  draw(
    canopy,
    [position[0] + 0.62 * scale, position[1] + 2.16 * scale, position[2] - 0.18 * scale],
    [0.84 * scale, 0.72 * scale, 0.72 * scale],
    canopyColor,
    4,
    0,
    -position[0] * 0.035,
  )
}

export function MiDWorldCanvas({ environment, activeView, workload, onReady }: MiDWorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const pointerFocusRef = useRef(0)
  const environmentRef = useRef(environment)
  const activeViewRef = useRef(activeView)
  const workloadRef = useRef(workload)

  useEffect(() => {
    environmentRef.current = environment
  }, [environment])

  useEffect(() => {
    activeViewRef.current = activeView
  }, [activeView])

  useEffect(() => {
    workloadRef.current = workload
  }, [workload])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let gl: WebGL2RenderingContext | null = null

    try {
      gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: window.innerWidth >= 900,
        powerPreference: 'low-power',
        preserveDrawingBuffer: false,
      })
    } catch {
      onReady?.(false)
      return
    }

    if (!gl) {
      onReady?.(false)
      return
    }

    const context: WebGL2RenderingContext = gl

    try {
      const gl = context
      const program = createProgram(gl)
      const positionLocation = gl.getAttribLocation(program, 'aPosition')
      const normalLocation = gl.getAttribLocation(program, 'aNormal')

      const uniforms = {
        projection: gl.getUniformLocation(program, 'uProjection'),
        view: gl.getUniformLocation(program, 'uView'),
        model: gl.getUniformLocation(program, 'uModel'),
        camera: gl.getUniformLocation(program, 'uCameraPosition'),
        light: gl.getUniformLocation(program, 'uLightDirection'),
        base: gl.getUniformLocation(program, 'uBaseColor'),
        intensity: gl.getUniformLocation(program, 'uLightIntensity'),
        emissive: gl.getUniformLocation(program, 'uEmissive'),
        kind: gl.getUniformLocation(program, 'uKind'),
        wetness: gl.getUniformLocation(program, 'uWetness'),
        lightWarmth: gl.getUniformLocation(program, 'uLightWarmth'),
        skyCoolness: gl.getUniformLocation(program, 'uSkyCoolness'),
        airDensity: gl.getUniformLocation(program, 'uAirDensity'),
        precipitation: gl.getUniformLocation(program, 'uPrecipitation'),
        opacity: gl.getUniformLocation(program, 'uOpacity'),
      }

      if ([uniforms.projection, uniforms.view, uniforms.model, uniforms.camera, uniforms.light, uniforms.base, uniforms.intensity, uniforms.emissive, uniforms.kind, uniforms.wetness, uniforms.lightWarmth, uniforms.skyCoolness, uniforms.airDensity, uniforms.opacity].some((uniform) => !uniform)) {
        throw new Error('WebGL uniform contract is incomplete.')
      }

      const box = createMesh(gl, boxGeometry(), positionLocation, normalLocation)
      const rockA = createMesh(gl, rockGeometry(0), positionLocation, normalLocation)
      const rockB = createMesh(gl, rockGeometry(1), positionLocation, normalLocation)
      const rockC = createMesh(gl, rockGeometry(2), positionLocation, normalLocation)
      const terrain = createMesh(gl, terrainGeometry(), positionLocation, normalLocation)
      const foliage = createMesh(gl, foliageGeometry(), positionLocation, normalLocation)
      const treeTrunk = createMesh(gl, treeTrunkGeometry(), positionLocation, normalLocation)
      const treeCanopy = createMesh(gl, canopyGeometry(), positionLocation, normalLocation)
      const shadow = createMesh(gl, groundShadowGeometry(), positionLocation, normalLocation)
      const wetPatch = createMesh(gl, wetPatchGeometry(), positionLocation, normalLocation)

      const projection = new Float32Array(16)
      const view = new Float32Array(16)
      const model = new Float32Array(16)

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
      const spatialPathQuery = window.matchMedia('(min-width: 821px) and (pointer: fine)')
      const frameInterval = 1000 / (window.innerWidth < 700 ? MOBILE_FPS : DESKTOP_FPS)
      const initialAnchor = worldModuleAnchor(activeViewRef.current)
      let cameraState: Vec3 = [...initialAnchor.camera.eye]
      let targetState: Vec3 = [...initialAnchor.camera.target]
      let frame = 0
      let running = true
      let renderRequested = true
      let keepAnimating = true
      let width = 1
      let height = 1
      let lastRender = -Infinity
      let lastTimestamp = 0
      let visualState = {
        intensity: 0.68,
        wetness: 0,
        lightWarmth: 0.42,
        skyCoolness: 0.2,
        airDensity: 0.08,
        precipitation: 0,
      }

      const requestRender = () => {
        renderRequested = true
        if (!running || frame) return
        frame = window.requestAnimationFrame(render)
      }

      const pointerListener = (event: Event) => {
        const detail = event instanceof CustomEvent
          ? event.detail as { x?: number; y?: number; focus?: number }
          : null
        pointerRef.current.x = Number(detail?.x ?? 0)
        pointerRef.current.y = Number(detail?.y ?? 0)
        pointerFocusRef.current = Math.max(0, Math.min(1, Number(detail?.focus ?? 0)))
        requestRender()
      }

      const invalidateListener = () => {
        requestRender()
      }

      const resize = () => {
        const rect = canvas.getBoundingClientRect()
        const cssWidth = Math.max(1, rect.width)
        const cssHeight = Math.max(1, rect.height)
        const pixelRatio = Math.min(
          window.devicePixelRatio || 1,
          Math.sqrt(MAX_WORLD_PIXELS / (cssWidth * cssHeight)),
        )
        width = Math.max(1, Math.round(cssWidth * pixelRatio))
        height = Math.max(1, Math.round(cssHeight * pixelRatio))

        if (canvas.width === width && canvas.height === height) return

        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
        perspective(projection, Math.PI / 4.8, width / Math.max(1, height), 0.1, 80)
      }

      gl.clearColor(0, 0, 0, 0)
      gl.enable(gl.DEPTH_TEST)
      gl.enable(gl.CULL_FACE)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      gl.useProgram(program)
      gl.uniform3f(uniforms.light, DEFAULT_LIGHT_DIRECTION[0], DEFAULT_LIGHT_DIRECTION[1], DEFAULT_LIGHT_DIRECTION[2])
      gl.uniform1f(uniforms.opacity, 1)

      function render(timestamp: number) {
        if (!running) return
        frame = 0

        if (timestamp - lastRender < frameInterval) {
          if (renderRequested || keepAnimating) {
            frame = window.requestAnimationFrame(render)
          }
          return
        }

        renderRequested = false

        lastRender = timestamp
        const delta = lastTimestamp > 0 ? Math.min(0.08, (timestamp - lastTimestamp) / 1000) : 1
        lastTimestamp = timestamp
        const pointer = pointerRef.current
        const focus = pointerFocusRef.current
        const workloadPressure = workloadRef.current === 'high'
          ? 0.82
          : workloadRef.current === 'medium'
            ? 0.54
            : 0.18
        const activeAnchor = worldModuleAnchor(activeViewRef.current)
        const pointerStrength = reduceMotion.matches
          ? 0
          : (0.86 + focus * 0.24) * (1 - workloadPressure * 0.08)
        const yaw = pointer.x * 0.055 * pointerStrength
        const pitch = pointer.y * 0.035 * pointerStrength
        const pointerOrbit = 0.48 + focus * 0.24
        const desiredCamera: Vec3 = [
          activeAnchor.camera.eye[0] + Math.sin(yaw) * pointerOrbit,
          activeAnchor.camera.eye[1] + pitch * 0.8,
          activeAnchor.camera.eye[2] + (Math.cos(yaw) - 1) * pointerOrbit,
        ]
        const desiredTarget: Vec3 = [
          activeAnchor.camera.target[0],
          activeAnchor.camera.target[1] + pitch * 0.5,
          activeAnchor.camera.target[2],
        ]
        const cameraBlend = reduceMotion.matches ? 1 : Math.min(1, delta * 7)
        cameraState = [
          cameraState[0] + (desiredCamera[0] - cameraState[0]) * cameraBlend,
          cameraState[1] + (desiredCamera[1] - cameraState[1]) * cameraBlend,
          cameraState[2] + (desiredCamera[2] - cameraState[2]) * cameraBlend,
        ]
        targetState = [
          targetState[0] + (desiredTarget[0] - targetState[0]) * cameraBlend,
          targetState[1] + (desiredTarget[1] - targetState[1]) * cameraBlend,
          targetState[2] + (desiredTarget[2] - targetState[2]) * cameraBlend,
        ]
        const camera = cameraState
        const target = targetState
        const env = environmentRef.current
        const tint = dayTint(env)
        const targetVisual = {
          intensity: Math.max(0.28, Math.min(1, env.visual.lightIntensity + 0.24)),
          wetness: Math.max(0, Math.min(1, env.visual.wetness)),
          lightWarmth: Math.max(0, Math.min(1, env.visual.lightWarmth)),
          skyCoolness: Math.max(0, Math.min(1, env.visual.skyCoolness)),
          airDensity: Math.max(0, Math.min(1, env.visual.airDensity)),
          precipitation: Math.max(0, Math.min(1, env.visual.precipitationOpacity)),
        }
        const environmentBlend = reduceMotion.matches ? 1 : Math.min(1, delta * 6.5)
        visualState = {
          intensity: visualState.intensity + (targetVisual.intensity - visualState.intensity) * environmentBlend,
          wetness: visualState.wetness + (targetVisual.wetness - visualState.wetness) * environmentBlend,
          lightWarmth: visualState.lightWarmth + (targetVisual.lightWarmth - visualState.lightWarmth) * environmentBlend,
          skyCoolness: visualState.skyCoolness + (targetVisual.skyCoolness - visualState.skyCoolness) * environmentBlend,
          airDensity: visualState.airDensity + (targetVisual.airDensity - visualState.airDensity) * environmentBlend,
          precipitation: visualState.precipitation + (targetVisual.precipitation - visualState.precipitation) * environmentBlend,
        }

        const cameraSettled =
          Math.abs(desiredCamera[0] - cameraState[0]) < 0.002 &&
          Math.abs(desiredCamera[1] - cameraState[1]) < 0.002 &&
          Math.abs(desiredCamera[2] - cameraState[2]) < 0.002 &&
          Math.abs(desiredTarget[0] - targetState[0]) < 0.002 &&
          Math.abs(desiredTarget[1] - targetState[1]) < 0.002 &&
          Math.abs(desiredTarget[2] - targetState[2]) < 0.002
        const visualSettled = Math.max(
          Math.abs(targetVisual.intensity - visualState.intensity),
          Math.abs(targetVisual.wetness - visualState.wetness),
          Math.abs(targetVisual.lightWarmth - visualState.lightWarmth),
          Math.abs(targetVisual.skyCoolness - visualState.skyCoolness),
          Math.abs(targetVisual.airDensity - visualState.airDensity),
          Math.abs(targetVisual.precipitation - visualState.precipitation),
        ) < 0.002
        keepAnimating = !cameraSettled || !visualSettled

        const intensity = visualState.intensity
        const lightDirection = env.sun.altitude > -6
          ? environmentLightDirection(env.sun.azimuth, env.sun.altitude)
          : DEFAULT_LIGHT_DIRECTION
        const naturalDepth = Math.max(0.86, Math.min(1.06, env.visual.worldContrast * 1.08))
        const wetness = visualState.wetness
        const lightWarmth = visualState.lightWarmth
        const skyCoolness = visualState.skyCoolness
        const airDensity = visualState.airDensity
        const precipitation = visualState.precipitation

        lookAt(view, camera, target, [0, 1, 0])

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.uniformMatrix4fv(uniforms.projection, false, projection)
        gl.uniformMatrix4fv(uniforms.view, false, view)
        gl.uniform3f(uniforms.camera, camera[0], camera[1], camera[2])
        gl.uniform3f(uniforms.light, lightDirection[0], lightDirection[1], lightDirection[2])
        gl.uniform1f(uniforms.intensity, intensity)
        gl.uniform1f(uniforms.wetness, wetness)
        gl.uniform1f(uniforms.lightWarmth, lightWarmth)
        gl.uniform1f(uniforms.skyCoolness, skyCoolness)
        gl.uniform1f(uniforms.airDensity, airDensity)
        gl.uniform1f(uniforms.precipitation, precipitation)

        const draw = (mesh: Mesh, position: Vec3, scale: Vec3, color: Vec3, kind: number, emissive = 0, rotation = 0, opacity = 1) => {
          gl.bindVertexArray(mesh.vao)
          modelMatrix(model, position, scale, rotation)
          gl.uniformMatrix4fv(uniforms.model, false, model)
          gl.uniform3f(uniforms.base, color[0], color[1], color[2])
          gl.uniform1f(uniforms.kind, kind)
          gl.uniform1f(uniforms.emissive, emissive)
          gl.uniform1f(uniforms.opacity, opacity)
          gl.drawArrays(gl.TRIANGLES, 0, mesh.vertexCount)
        }

        const naturalSaturation = env.visual.natureSaturation
        const damp = wetness * 0.14
        const mineral: Vec3 = [
          (0.11 + tint[0] * 0.25) * naturalDepth,
          (0.17 + tint[1] * 0.18) * naturalDepth,
          (0.2 + tint[2] * 0.16) * naturalDepth,
        ]
        const stone: Vec3 = [
          (0.17 + tint[0] * 0.2) * (1 - damp * 0.5),
          (0.23 + tint[1] * 0.16) * (1 - damp * 0.28),
          (0.25 + tint[2] * 0.14) * (1 - damp * 0.18),
        ]
        const moss: Vec3 = [
          Math.min(1, (0.17 + tint[0] * 0.12) * naturalSaturation),
          Math.min(1, (0.27 + tint[1] * 0.16) * naturalSaturation),
          Math.min(1, (0.20 + tint[2] * 0.08) * naturalSaturation),
        ]
        const fern: Vec3 = [
          Math.min(1, (0.10 + tint[0] * 0.08) * naturalSaturation),
          Math.min(1, (0.20 + tint[1] * 0.12) * naturalSaturation),
          Math.min(1, (0.14 + tint[2] * 0.06) * naturalSaturation),
        ]
        const warm: Vec3 = [0.42 + tint[0] * 0.05, 0.3 + tint[1] * 0.03, 0.18]

        draw(terrain, [0, -0.2, 0], [1, 1, 1], mineral, 2)

        if (spatialPathQuery.matches) {
          const puddleOpacity = Math.min(
            0.2,
            0.03 + precipitation * 0.24 + wetness * 0.08,
          )
          const puddleColor: Vec3 = [
            mineral[0] * 0.48,
            mineral[1] * 0.54,
            mineral[2] * 0.58,
          ]
          draw(
            wetPatch,
            [ -2.8, groundSurfaceY(-2.8, 2.5, 0.014), 2.5 ],
            [1.32, 1, 0.46],
            puddleColor,
            5,
            0,
            -0.16,
            puddleOpacity,
          )
          draw(
            wetPatch,
            [ 3.25, groundSurfaceY(3.25, 1.8, 0.016), 1.8 ],
            [0.92, 1, 0.36],
            puddleColor,
            5,
            0,
            0.22,
            puddleOpacity * 0.82,
          )
          draw(
            wetPatch,
            [ -4.9, groundSurfaceY(-4.9, -4.0, 0.014), -4.0 ],
            [0.74, 1, 0.30],
            puddleColor,
            5,
            0,
            0.12,
            puddleOpacity * 0.72,
          )
        }

        const shadowSoftness = Math.min(
          1,
          Math.max(0.12, (0.18 + env.visual.airDensity * 0.56 + env.visual.cloudOpacity * 0.22)),
        )
        const shadowTint: Vec3 = [
          mineral[0] * 0.26,
          mineral[1] * 0.28,
          mineral[2] * 0.30,
        ]

        drawProjectedGroundShadow(
          draw,
          shadow,
          lightDirection,
          [0, 0.08, 0],
          0.6,
          [4.7, 2.8],
          shadowTint,
          shadowSoftness,
        )
        drawProjectedGroundShadow(
          draw,
          shadow,
          lightDirection,
          [-5.8, 1.15, -2.0],
          1.15,
          [0.78, 1.9],
          shadowTint,
          shadowSoftness,
        )
        drawProjectedGroundShadow(
          draw,
          shadow,
          lightDirection,
          [5.8, 1.05, -1.4],
          1.05,
          [0.92, 1.7],
          shadowTint,
          shadowSoftness,
        )
        drawProjectedGroundShadow(
          draw,
          shadow,
          lightDirection,
          [-3.7, 2.0, -5.8],
          2.0,
          [2.1, 0.42],
          shadowTint,
          shadowSoftness,
        )
        drawProjectedGroundShadow(
          draw,
          shadow,
          lightDirection,
          [3.2, 1.65, -6.5],
          1.65,
          [1.55, 0.36],
          shadowTint,
          shadowSoftness,
        )
        // Natural grounding objects replace the former architectural primitives.
        draw(rockB, [0, groundSurfaceY(0, 0.8, 0.08), 0.8], [2.9, 0.42, 1.9], stone, 3, 0, -0.08)
        draw(rockC, [-5.8, groundSurfaceY(-5.8, -2.0, 0.22), -2.0], [0.9, 0.62, 1.8], moss, 3, 0, 0.16)
        draw(rockA, [5.7, groundSurfaceY(5.7, -1.4, 0.18), -1.4], [1.15, 0.62, 1.7], stone, 3, 0, -0.18)
        draw(rockC, [-3.7, groundSurfaceY(-3.7, -5.8, 0.08), -5.8], [2.5, 0.48, 0.72], stone, 3, 0, -0.08)
        draw(rockA, [3.2, groundSurfaceY(3.2, -6.5, 0.06), -6.5], [1.9, 0.4, 0.58], moss, 3, 0, 0.16)
        draw(rockB, [-7.4, groundSurfaceY(-7.4, 3.2, 0.06), 3.2], [2.2, 0.5, 0.7], stone, 3, 0, 0.08)
        draw(rockC, [7.0, groundSurfaceY(7.0, 3.8, 0.05), 3.8], [1.7, 0.42, 0.64], warm, 3, 0, -0.12)
        draw(rockA, [0, groundSurfaceY(0, 1.15, 0.08), 1.15], [1.8, 0.46, 1.2], moss, 3, 0, 0.04)

        drawTree(draw, treeTrunk, treeCanopy, shadow, lightDirection, [-6.7, groundSurfaceY(-6.7, -2.4, 0.04), -2.4], 1.02, warm, fern, shadowTint, shadowSoftness)
        drawTree(draw, treeTrunk, treeCanopy, shadow, lightDirection, [6.5, groundSurfaceY(6.5, -1.8, 0.04), -1.8], 0.88, warm, moss, shadowTint, shadowSoftness)
        drawTree(draw, treeTrunk, treeCanopy, shadow, lightDirection, [-8.2, groundSurfaceY(-8.2, 1.8, 0.03), 1.8], 1.16, warm, fern, shadowTint, shadowSoftness)
        drawTree(draw, treeTrunk, treeCanopy, shadow, lightDirection, [8.4, groundSurfaceY(8.4, 2.5, 0.03), 2.5], 1.04, warm, moss, shadowTint, shadowSoftness)
        drawTree(draw, treeTrunk, treeCanopy, shadow, lightDirection, [-3.2, groundSurfaceY(-3.2, -7.0, 0.03), -7.0], 0.78, warm, fern, shadowTint, shadowSoftness)
        drawTree(draw, treeTrunk, treeCanopy, shadow, lightDirection, [3.6, groundSurfaceY(3.6, -7.5, 0.03), -7.5], 0.82, warm, moss, shadowTint, shadowSoftness)

        if (spatialPathQuery.matches) {
          drawSpatialPath(
            draw,
            rockA,
            rockB,
            [0, 0.02, 1.15],
            activeAnchor.position,
            stone,
            moss,
          )
          drawWorldComposition(
            draw,
            rockA,
            rockB,
            rockC,
            foliage,
            treeTrunk,
            treeCanopy,
            activeAnchor.composition,
            stone,
            moss,
            fern,
            warm,
            activeAnchor.composition.landmarkScale,
          )

          drawGroundCover(
            draw,
            foliage,
            activeAnchor.composition,
            fern,
            activeAnchor.composition.landmarkScale,
          )

          const composition = activeAnchor.composition
          const [lx, ly, lz] = composition.landmark
          const landmarkScale = Math.max(0.72, Math.min(1.08, composition.landmarkScale))
          const landmarkShadowSoftness = Math.min(
            1,
            Math.max(0.18, 0.16 + env.visual.airDensity * 0.62 + env.visual.cloudOpacity * 0.18),
          )
          const landmarkShadowTint: Vec3 = [
            mineral[0] * 0.21,
            mineral[1] * 0.23,
            mineral[2] * 0.25,
          ]

          if (composition.landmarkKind === 'grove') {
            drawProjectedGroundShadow(
              draw,
              shadow,
              lightDirection,
              [lx - 0.45 * landmarkScale, ly + 0.38 * landmarkScale, lz],
              0.82 * landmarkScale,
              [1.0 * landmarkScale, 0.82 * landmarkScale],
              landmarkShadowTint,
              landmarkShadowSoftness,
            )
          } else if (composition.landmarkKind === 'ridge') {
            drawProjectedGroundShadow(
              draw,
              shadow,
              lightDirection,
              [lx + 0.08 * landmarkScale, ly + 0.56 * landmarkScale, lz],
              0.72 * landmarkScale,
              [1.55 * landmarkScale, 0.92 * landmarkScale],
              landmarkShadowTint,
              landmarkShadowSoftness,
            )
          } else {
            drawProjectedGroundShadow(
              draw,
              shadow,
              lightDirection,
              [lx, ly + 0.55 * landmarkScale, lz],
              0.95 * landmarkScale,
              [1.2 * landmarkScale, 0.82 * landmarkScale],
              landmarkShadowTint,
              landmarkShadowSoftness,
            )
          }
        }

        const contactShadow: Vec3 = [
          mineral[0] * 0.24,
          mineral[1] * 0.3,
          mineral[2] * 0.28,
        ]
        draw(box, [0, groundSurfaceY(0, 0.0, -0.02), 0.0], [4.9, 0.008, 2.8], contactShadow, 6, 0, 0, 0.22)
        draw(box, [-5.2, groundSurfaceY(-5.2, 3.0, 0.004), 3.0], [0.9, 0.008, 0.68], contactShadow, 6, 0, -0.12, 0.3)
        draw(box, [5.1, groundSurfaceY(5.1, 2.8, 0.004), 2.8], [0.78, 0.008, 0.6], contactShadow, 6, 0, 0.22, 0.3)
        draw(box, [-8.4, groundSurfaceY(-8.4, 5.6, 0.004), 5.6], [1.72, 0.008, 1.3], contactShadow, 6, 0, 0.12, 0.28)
        draw(box, [7.6, groundSurfaceY(7.6, -7.2, 0.004), -7.2], [1.66, 0.008, 1.26], contactShadow, 6, 0, -0.18, 0.28)

        draw(rockA, [-5.2, groundSurfaceY(-5.2, 3.0, 0.06), 3.0], [0.72, 0.42, 0.54], stone, 3, 0.0, -0.12)
        draw(rockB, [5.1, groundSurfaceY(5.1, 2.8, 0.04), 2.8], [0.62, 0.34, 0.48], warm, 3, 0.0, 0.22)
        draw(rockC, [-3.3, groundSurfaceY(-3.3, -3.9, 0.03), -3.9], [0.52, 0.28, 0.44], fern, 3, 0.0, -0.32)
        draw(rockA, [3.8, groundSurfaceY(3.8, -4.5, 0.04), -4.5], [0.7, 0.36, 0.52], moss, 3, 0.0, 0.16)
        draw(rockB, [-8.4, groundSurfaceY(-8.4, 5.6, 0.02), 5.6], [1.55, 0.72, 1.2], stone, 3, 0.0, 0.12)
        draw(rockC, [8.1, groundSurfaceY(8.1, 4.8, 0.02), 4.8], [1.38, 0.68, 1.1], mineral, 3, 0.0, -0.22)
        draw(rockA, [-8.8, groundSurfaceY(-8.8, -6.8, 0.02), -6.8], [1.7, 0.82, 1.25], warm, 3, 0.0, 0.28)
        draw(rockB, [7.6, groundSurfaceY(7.6, -7.2, 0.02), -7.2], [1.5, 0.74, 1.18], moss, 3, 0.0, -0.18)
        draw(rockC, [-1.0, groundSurfaceY(-1.0, -7.8, 0.02), -7.8], [1.05, 0.5, 0.86], stone, 3, 0.0, 0.05)

        draw(foliage, [-7.2, groundSurfaceY(-7.2, -0.8, -0.02), -0.8], [1.15, 0.95, 1.15], fern, 4, 0, 0.2)
        draw(foliage, [-5.9, groundSurfaceY(-5.9, 1.5, -0.02), 1.5], [0.82, 0.72, 0.82], moss, 4, 0, -0.25)
        draw(foliage, [6.5, groundSurfaceY(6.5, 0.6, -0.02), 0.6], [1.0, 0.84, 1.0], fern, 4, 0, -0.12)
        draw(foliage, [4.7, groundSurfaceY(4.7, -2.3, -0.02), -2.3], [0.86, 0.78, 0.86], moss, 4, 0, 0.24)
        draw(foliage, [-2.9, groundSurfaceY(-2.9, -5.2, -0.02), -5.2], [1.05, 0.9, 1.05], fern, 4, 0, -0.18)
        draw(foliage, [3.9, groundSurfaceY(3.9, -6.4, -0.02), -6.4], [0.92, 0.8, 0.92], moss, 4, 0, 0.16)

        for (const anchor of MODULE_ANCHORS) {
          const active = anchor.view === activeViewRef.current
          const distance = Math.hypot(anchor.position[0] - activeAnchor.position[0], anchor.position[2] - activeAnchor.position[2])
          const activeEmphasis = Math.min(0.055, (0.028 + focus * 0.018) * (1 - workloadPressure * 0.16))
          const nearbyEmphasis = 0.012 * (1 - workloadPressure * 0.1)
          const distantEmphasis = 0.005 * (1 - workloadPressure * 0.14)
          const emphasis = active ? activeEmphasis : distance < 6 ? nearbyEmphasis : distantEmphasis
          const scale: Vec3 = active
            ? [0.5 + focus * 0.04, 0.13, 0.34 + focus * 0.02]
            : [0.3, 0.08, 0.22]
          draw(
            rockA,
            [anchor.position[0], groundSurfaceY(anchor.position[0], anchor.position[2], 0.03), anchor.position[2]],
            scale,
            active ? anchor.color : moss,
            3,
            emphasis,
            active ? 0.05 : 0,
          )
        }

        gl.bindVertexArray(null)

        if (renderRequested || keepAnimating) {
          frame = window.requestAnimationFrame(render)
        }
      }

      resize()
      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(canvas)
      const handleVisibility = () => {
        if (document.visibilityState === 'hidden') {
          running = false
          window.cancelAnimationFrame(frame)
          return
        }

        if (!running) {
          running = true
          requestRender()
        }
      }

      window.addEventListener('mid:world-pointer', pointerListener)
      window.addEventListener('mid:world-invalidate', invalidateListener)
      document.addEventListener('visibilitychange', handleVisibility)
      onReady?.(true)
      requestRender()

      return () => {
        running = false
        window.cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        window.removeEventListener('mid:world-pointer', pointerListener)
        window.removeEventListener('mid:world-invalidate', invalidateListener)
        document.removeEventListener('visibilitychange', handleVisibility)
        gl.deleteVertexArray(box.vao)
        gl.deleteVertexArray(rockA.vao)
        gl.deleteVertexArray(rockB.vao)
        gl.deleteVertexArray(rockC.vao)
        gl.deleteVertexArray(terrain.vao)
        gl.deleteVertexArray(foliage.vao)
        gl.deleteVertexArray(treeTrunk.vao)
        gl.deleteVertexArray(treeCanopy.vao)
        gl.deleteVertexArray(shadow.vao)
        gl.deleteVertexArray(wetPatch.vao)
        gl.deleteProgram(program)
      }
    } catch {
      onReady?.(false)
    }
  }, [onReady])

  return <canvas ref={canvasRef} className="environment-world-canvas" aria-hidden="true" />
}