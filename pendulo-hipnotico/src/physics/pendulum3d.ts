/**
 * Motor físico del péndulo, generalizado a 3 dimensiones (péndulo esférico).
 *
 * En vez de resolver el péndulo esférico con ángulos (θ, φ) —que tiene una
 * singularidad matemática justo en el punto de reposo, θ=0, donde 1/sin(θ)
 * se dispara—, se integra directamente la posición cartesiana de la lenteja
 * y se restringe a la esfera de radio `length` en cada paso (la cuerda es
 * inextensible). Es el mismo enfoque que usan los motores de física de
 * videojuegos para cuerdas y péndulos ("integración de Verlet + restricción
 * de distancia"): estable, sin singularidades, y consistente con la energía
 * del sistema.
 *
 * Convención de ejes (metros, relativos al punto de anclaje):
 *   x → derecha / izquierda en pantalla
 *   y → hacia abajo (a favor de la gravedad)
 *   z → profundidad: positivo = hacia el espectador, negativo = alejándose
 *
 * Cuando `allowDepth` es false, z se mantiene en 0 en todo momento y el
 * sistema se reduce exactamente al péndulo plano clásico (mismo resultado
 * físico que integrar sólo θ'' = -(g/L)sinθ - cθ').
 */

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Pendulum3DState {
  position: Vec3
  velocity: Vec3
}

export interface Pendulum3DParams {
  g: number
  length: number
  damping: number
  allowDepth: boolean
}

function length3(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

export function stepPendulum3D(
  state: Pendulum3DState,
  params: Pendulum3DParams,
  dt: number
): Pendulum3DState {
  const { g, length, damping, allowDepth } = params
  const p = state.position
  const v = state.velocity

  // Aceleración: gravedad (sobre y) + arrastre viscoso simple sobre la velocidad.
  const ax = -damping * v.x
  const ay = g - damping * v.y
  const az = allowDepth ? -damping * v.z : 0

  let nvx = v.x + ax * dt
  let nvy = v.y + ay * dt
  let nvz = allowDepth ? v.z + az * dt : 0

  let npx = p.x + nvx * dt
  let npy = p.y + nvy * dt
  let npz = allowDepth ? p.z + nvz * dt : 0

  // Restricción: proyectar de vuelta a la esfera de radio `length` (cuerda inextensible).
  const dist = length3({ x: npx, y: npy, z: npz }) || length
  const scale = length / dist
  npx *= scale
  npy *= scale
  npz *= scale

  // La velocidad se recalcula a partir del desplazamiento ya restringido:
  // esto elimina automáticamente cualquier componente radial (que estiraría
  // la cuerda) y conserva la componente tangencial, sin necesidad de
  // proyectar vectores explícitamente.
  nvx = (npx - p.x) / dt
  nvy = (npy - p.y) / dt
  nvz = allowDepth ? (npz - p.z) / dt : 0

  return {
    position: { x: npx, y: npy, z: npz },
    velocity: { x: nvx, y: nvy, z: nvz }
  }
}

/** Estado inicial a partir de un ángulo plano (grados, igual que en la versión 2D). */
export function stateFromAngle(angleDegrees: number, length: number): Pendulum3DState {
  const theta = (angleDegrees * Math.PI) / 180
  return {
    position: { x: length * Math.sin(theta), y: length * Math.cos(theta), z: 0 },
    velocity: { x: 0, y: 0, z: 0 }
  }
}

/**
 * Inyecta un impulso de velocidad puramente en profundidad (z). Al ser
 * tangente a la esfera en cualquier punto con z=0, no viola la restricción
 * de la cuerda: es exactamente lo que hace falta para que un péndulo plano
 * empiece a precesar y trace una elipse/roseta en el espacio, revelando la
 * profundidad. Físicamente equivale a darle un pequeño empuje lateral fuera
 * del plano de giro original.
 */
export function withDepthKick(state: Pendulum3DState, kick: number): Pendulum3DState {
  return {
    position: state.position,
    velocity: { ...state.velocity, z: state.velocity.z + kick }
  }
}

/** Ángulo "de pantalla" (izquierda/negativo - derecha/positivo) respecto a la vertical. */
export function projectedAngle(position: Vec3): number {
  return Math.atan2(position.x, position.y)
}
