import { useEffect, useRef } from 'react'
import type { View } from '../types'
import { worldModuleAnchor, worldModuleAnchors } from './moduleWorld'
import { environmentLightDirection } from './mood'
import type { EnvironmentState } from './types'

interface MiDWorldCanvasProps {
  environment: EnvironmentState
  activeView: View
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

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 lightDir = normalize(uLightDirection);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

  float diffuse = max(dot(normal, lightDir), 0.0);
  float halfLambert = diffuse * 0.72 + 0.28;
  vec3 halfVector = normalize(lightDir + viewDir);
  float specular = pow(max(dot(normal, halfVector), 0.0), 36.0);
  float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);

  float grid = 0.0;
  if (uKind < 0.5) {
    vec2 cell = abs(fract(vWorldPosition.xz * 0.5 - 0.5) - 0.5);
    float line = 1.0 - min(min(cell.x, cell.y) / 0.045, 1.0);
    vec2 fineCell = abs(fract(vWorldPosition.xz * 0.1 - 0.5) - 0.5);
    float fine = 1.0 - min(min(fineCell.x, fineCell.y) / 0.06, 1.0);
    grid = max(line * 0.16, fine * 0.045);
  }

  vec3 base = uBaseColor * (0.34 + halfLambert * 0.66 * uLightIntensity);
  vec3 reflected = vec3(specular * 0.17 + rim * 0.08);
  vec3 emissive = uBaseColor * uEmissive;
  vec3 color = base + reflected + emissive + uBaseColor * grid;

  float distanceFade = smoothstep(24.0, 6.0, length(vWorldPosition.xz));
  color *= mix(0.52, 1.0, distanceFade);

  gl_FragColor = vec4(color, 1.0);
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

function rockGeometry() {
  const vertices: number[] = []
  const sides = 7
  const radii = [1, .88, 1.08, .92, 1.03, .9, 1.06]
  const heights = [.82, .95, .76, .9, .72, .88, .78]

  for (let i = 0; i < sides; i += 1) {
    const next = (i + 1) % sides
    const a0 = (i / sides) * Math.PI * 2
    const a1 = (next / sides) * Math.PI * 2
    const r0 = radii[i]
    const r1 = radii[next]
    const p0: Vec3 = [Math.cos(a0) * r0, 0, Math.sin(a0) * r0]
    const p1: Vec3 = [Math.cos(a1) * r1, 0, Math.sin(a1) * r1]
    const q1: Vec3 = [Math.cos(a1) * r1 * .82, heights[next], Math.sin(a1) * r1 * .82]
    const q0: Vec3 = [Math.cos(a0) * r0 * .82, heights[i], Math.sin(a0) * r0 * .82]
    const normal: Vec3 = [
      Math.cos((a0 + a1) * .5),
      .22,
      Math.sin((a0 + a1) * .5),
    ]

    for (const corner of [p0, p1, q1, p0, q1, q0]) {
      vertices.push(corner[0], corner[1], corner[2], normal[0], normal[1], normal[2])
    }

    const centerTop: Vec3 = [0, .86, 0]
    for (const corner of [q0, q1, centerTop]) {
      vertices.push(corner[0], corner[1], corner[2], 0, 1, 0)
    }
  }

  return new Float32Array(vertices)
}

function planeGeometry() {
  return new Float32Array([
    -1, 0, -1, 0, 1, 0,
     1, 0, -1, 0, 1, 0,
     1, 0,  1, 0, 1, 0,
    -1, 0, -1, 0, 1, 0,
     1, 0,  1, 0, 1, 0,
    -1, 0,  1, 0, 1, 0,
  ])
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
    case 'golden-hour':
      return [0.36, 0.29, 0.21]
    case 'night':
      return [0.13, 0.2, 0.28]
    case 'dusk':
      return [0.24, 0.18, 0.2]
    default:
      return [0.18, 0.24, 0.24]
  }
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
  box: Mesh,
  start: Vec3,
  end: Vec3,
  color: Vec3,
) {
  const dx = end[0] - start[0]
  const dz = end[2] - start[2]
  const distance = Math.hypot(dx, dz)
  if (distance < 0.7) return

  const segments = Math.min(7, Math.max(3, Math.ceil(distance / 1.2)))
  const angle = Math.atan2(-dz, dx)

  for (let index = 0; index < segments; index += 1) {
    const a = index / segments
    const b = (index + 1) / segments
    const midX = start[0] + (dx * (a + b)) * 0.5
    const midZ = start[2] + (dz * (a + b)) * 0.5
    const segmentLength = distance * (b - a)

    draw(
      box,
      [midX, 0.015, midZ],
      [segmentLength * 0.44, 0.018, 0.075],
      color,
      1,
      0.008,
      angle,
    )
  }
}

export function MiDWorldCanvas({ environment, activeView, onReady }: MiDWorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const environmentRef = useRef(environment)
  const activeViewRef = useRef(activeView)

  useEffect(() => {
    environmentRef.current = environment
  }, [environment])

  useEffect(() => {
    activeViewRef.current = activeView
  }, [activeView])

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

    try {
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
      }

      if ([uniforms.projection, uniforms.view, uniforms.model, uniforms.camera, uniforms.light, uniforms.base, uniforms.intensity, uniforms.emissive, uniforms.kind].some((uniform) => !uniform)) {
        throw new Error('WebGL uniform contract is incomplete.')
      }

      const box = createMesh(gl, boxGeometry(), positionLocation, normalLocation)
      const rock = createMesh(gl, rockGeometry(), positionLocation, normalLocation)
      const floor = createMesh(gl, planeGeometry(), positionLocation, normalLocation)

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
      let width = 1
      let height = 1
      let lastRender = -Infinity
      let lastTimestamp = 0

      const pointerListener = (event: Event) => {
        const detail = event instanceof CustomEvent ? event.detail as { x?: number; y?: number } : null
        pointerRef.current.x = Number(detail?.x ?? 0)
        pointerRef.current.y = Number(detail?.y ?? 0)
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

      const render = (timestamp: number) => {
        if (!running) return

        if (timestamp - lastRender < frameInterval) {
          frame = window.requestAnimationFrame(render)
          return
        }

        lastRender = timestamp
        const delta = lastTimestamp > 0 ? Math.min(0.08, (timestamp - lastTimestamp) / 1000) : 1
        lastTimestamp = timestamp
        const pointer = pointerRef.current
        const activeAnchor = worldModuleAnchor(activeViewRef.current)
        const pointerStrength = reduceMotion.matches ? 0 : 1
        const yaw = pointer.x * 0.055 * pointerStrength
        const pitch = pointer.y * 0.035 * pointerStrength
        const pointerOrbit = 0.6
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
        const intensity = Math.max(0.28, Math.min(1, env.visual.lightIntensity + 0.24))
        const lightDirection = env.sun.altitude > -6
          ? environmentLightDirection(env.sun.azimuth, env.sun.altitude)
          : DEFAULT_LIGHT_DIRECTION
        const naturalDepth = env.visual.worldContrast
        const wetness = env.visual.wetness

        lookAt(view, camera, target, [0, 1, 0])

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.uniformMatrix4fv(uniforms.projection, false, projection)
        gl.uniformMatrix4fv(uniforms.view, false, view)
        gl.uniform3f(uniforms.camera, camera[0], camera[1], camera[2])
        gl.uniform3f(uniforms.light, lightDirection[0], lightDirection[1], lightDirection[2])
        gl.uniform1f(uniforms.intensity, intensity)

        const draw = (mesh: Mesh, position: Vec3, scale: Vec3, color: Vec3, kind: number, emissive = 0, rotation = 0) => {
          gl.bindVertexArray(mesh.vao)
          modelMatrix(model, position, scale, rotation)
          gl.uniformMatrix4fv(uniforms.model, false, model)
          gl.uniform3f(uniforms.base, color[0], color[1], color[2])
          gl.uniform1f(uniforms.kind, kind)
          gl.uniform1f(uniforms.emissive, emissive)
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
        const cyan: Vec3 = [0.11, 0.42, 0.52]
        const warm: Vec3 = [0.42 + tint[0] * 0.05, 0.3 + tint[1] * 0.03, 0.18]

        draw(floor, [0, -0.12, 0], [18, 1, 18], mineral, 0)
        draw(box, [0, 0.08, 0], [4.8, 0.14, 2.7], stone, 1)
        draw(box, [-5.8, 1.15, -2.0], [0.55, 1.15, 2.7], [0.09, 0.15, 0.18], 1)
        draw(box, [5.8, 1.05, -1.4], [0.7, 1.05, 2.4], [0.09, 0.15, 0.18], 1)
        draw(box, [-3.7, 2.0, -5.8], [2.2, 2.0, 0.28], [0.12, 0.18, 0.2], 1, 0.02)
        draw(box, [3.2, 1.65, -6.5], [1.6, 1.65, 0.22], [0.11, 0.17, 0.19], 1, 0.02)
        draw(box, [-7.4, 0.42, 3.2], [2.4, 0.42, 0.38], [0.08, 0.13, 0.16], 1)
        draw(box, [7.0, 0.34, 3.8], [1.8, 0.34, 0.38], [0.08, 0.13, 0.16], 1)
        draw(box, [0, 0.52, 1.15], [2.5, 0.52, 1.35], [0.08, 0.14, 0.17], 1, 0.01)

        if (spatialPathQuery.matches) {
          drawSpatialPath(
            draw,
            box,
            [0, 0.02, 1.15],
            activeAnchor.position,
            moss,
          )
        }

        draw(box, [-7.0, 0.18, -0.3], [2.1, 0.07, 0.28], fern, 1, 0.015, -0.18)
        draw(box, [-4.8, 0.11, 2.1], [1.4, 0.045, 0.26], moss, 1, 0.01, 0.18)
        draw(box, [4.4, 0.09, 1.8], [1.65, 0.04, 0.22], moss, 1, 0.01, -0.12)
        draw(rock, [-5.2, 0.06, 3.0], [0.72, 0.42, 0.54], stone, 1, 0.0, -0.12)
        draw(rock, [5.1, 0.04, 2.8], [0.62, 0.34, 0.48], warm, 1, 0.0, 0.22)
        draw(rock, [-3.3, 0.03, -3.9], [0.52, 0.28, 0.44], fern, 1, 0.0, -0.32)
        draw(rock, [3.8, 0.04, -4.5], [0.7, 0.36, 0.52], moss, 1, 0.0, 0.16)

        draw(box, [-2.2, 0.63, 0.0], [0.04, 0.63, 0.96], cyan, 1, 0.42)
        draw(box, [2.2, 0.63, 0.0], [0.04, 0.63, 0.96], cyan, 1, 0.42)
        draw(box, [0, 1.08, -0.01], [1.0, 0.025, 0.025], cyan, 1, 0.52)
        draw(box, [-4.9, 1.9, -2.7], [0.035, 0.52, 1.55], warm, 1, 0.18, 0.04)

        for (const anchor of MODULE_ANCHORS) {
          const active = anchor.view === activeViewRef.current
          const distance = Math.hypot(anchor.position[0] - activeAnchor.position[0], anchor.position[2] - activeAnchor.position[2])
          const emphasis = active ? 0.24 : distance < 6 ? 0.055 : 0.025
          const scale: Vec3 = active ? [0.9, 0.035, 0.52] : [0.64, 0.022, 0.38]
          draw(box, anchor.position, scale, anchor.color, 1, emphasis, active ? 0.08 : 0)
        }

        draw(box, [0, 0.95, -0.05], [1.15, 0.035, 1.15], cyan, 1, 0.16, 0)

        gl.bindVertexArray(null)
        frame = window.requestAnimationFrame(render)
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
          frame = window.requestAnimationFrame(render)
        }
      }

      window.addEventListener('mid:world-pointer', pointerListener)
      document.addEventListener('visibilitychange', handleVisibility)
      onReady?.(true)
      frame = window.requestAnimationFrame(render)

      return () => {
        running = false
        window.cancelAnimationFrame(frame)
        resizeObserver.disconnect()
        window.removeEventListener('mid:world-pointer', pointerListener)
        document.removeEventListener('visibilitychange', handleVisibility)
        gl.deleteVertexArray(box.vao)
        gl.deleteVertexArray(rock.vao)
        gl.deleteVertexArray(floor.vao)
        gl.deleteProgram(program)
      }
    } catch {
      onReady?.(false)
    }
  }, [onReady])

  return <canvas ref={canvasRef} className="environment-world-canvas" aria-hidden="true" />
}
