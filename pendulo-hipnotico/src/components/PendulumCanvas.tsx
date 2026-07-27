import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react'
import {
  projectedAngle,
  stateFromAngle,
  withDepthKick,
  type Pendulum3DParams,
  type Pendulum3DState,
  type Vec3
} from '../physics/pendulum3d'
import { usePendulumSimulation } from '../hooks/usePendulumSimulation'
import { useResizeCanvas } from '../hooks/useResizeCanvas'
import { usePendulumAudio } from '../hooks/usePendulumAudio'

export type PendulumTheme = 'oro' | 'plata' | 'ambar'

export interface PendulumCanvasProps {
  length: number
  damping: number
  running: boolean
  showTrail: boolean
  theme: PendulumTheme
  pseudo3D: boolean
  soundEnabled: boolean
  soundVolume: number
  onAngleChange?: (degrees: number, periodEstimate: number) => void
}

export interface PendulumCanvasHandle {
  /** Vuelve a soltar el péndulo desde un ángulo dado (grados), en reposo. */
  release: (angleDegrees: number) => void
}

interface TrailPoint {
  x: number
  y: number
  depthNorm: number
  age: number
}

const THEMES: Record<PendulumTheme, { core: string; mid: string; edge: string; glow: string; ring: string }> = {
  oro: { core: '#fff3d6', mid: '#d9a34a', edge: '#7a4e14', glow: 'rgba(217,163,74,0.55)', ring: 'rgba(201,162,75,0.16)' },
  plata: { core: '#f5f7fa', mid: '#aab3bf', edge: '#4a525c', glow: 'rgba(180,190,200,0.5)', ring: 'rgba(180,190,200,0.15)' },
  ambar: { core: '#ffe0b8', mid: '#c9682f', edge: '#5c2410', glow: 'rgba(201,104,47,0.55)', ring: 'rgba(201,104,47,0.16)' }
}

const MAX_DRAG_DEGREES = 85
const TRAIL_LENGTH = 46
const TRAIL_MAX_AGE = 46
/** Impulso de velocidad en profundidad (m/s) que se inyecta al activar el modo 3D o al soltar. */
const DEPTH_KICK = 0.55
/** Segundos mínimos entre campanillas, para no disparar varias en el mismo ápice por ruido numérico. */
const CHIME_COOLDOWN = 0.35

function alphaReplace(rgba: string, alpha: number): string {
  return rgba.replace(/[\d.]+\)$/, `${alpha.toFixed(3)})`)
}

export const PendulumCanvas = forwardRef<PendulumCanvasHandle, PendulumCanvasProps>(
  function PendulumCanvas(
    { length, damping, running, showTrail, theme, pseudo3D, soundEnabled, soundVolume, onAngleChange },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const size = useResizeCanvas(containerRef, canvasRef)
    const audio = usePendulumAudio({ enabled: soundEnabled, volume: soundVolume })

    const trailRef = useRef<TrailPoint[]>([])
    const draggingRef = useRef(false)
    const spinRef = useRef(0)
    const lastReportRef = useRef(0)
    const prevThetaRef = useRef(0)
    const prevDeltaSignRef = useRef(0)
    const chimeCooldownRef = useRef(0)
    const pseudo3DRef = useRef(pseudo3D)

    const initialParams: Pendulum3DParams = { g: 9.81, length, damping, allowDepth: pseudo3D }

    const draw = useCallback(
      (position: Vec3) => {
        const canvas = canvasRef.current
        if (!canvas || size.width === 0) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const { width, height, dpr } = size
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, width, height)

        const originX = width / 2
        const originY = height * 0.14
        const lengthPx = Math.min(width * 0.42, height * 0.72)
        const scale = lengthPx / length
        const palette = THEMES[theme]

        const depthNorm = pseudo3D ? Math.max(-1, Math.min(1, position.z / length)) : 0
        const parallaxX = pseudo3D ? position.z * scale * 0.22 : 0
        const bobX = originX + position.x * scale + parallaxX
        const bobY = originY + position.y * scale
        const sizeFactor = pseudo3D ? 1 + depthNorm * 0.32 : 1
        const farFactor = pseudo3D ? Math.max(0, -depthNorm) : 0

        // --- Fondo: viñeta suave ---
        const bgGrad = ctx.createRadialGradient(
          originX,
          height * 0.45,
          height * 0.05,
          originX,
          height * 0.45,
          height * 0.75
        )
        bgGrad.addColorStop(0, '#141420')
        bgGrad.addColorStop(1, '#07070b')
        ctx.fillStyle = bgGrad
        ctx.fillRect(0, 0, width, height)

        // --- Anillos concéntricos ambientales; en modo 3D respiran levemente con la profundidad ---
        ctx.save()
        ctx.strokeStyle = palette.ring
        ctx.lineWidth = 1
        const ringDepthFactor = pseudo3D ? 1 + depthNorm * 0.025 : 1
        for (let r = 1; r <= 4; r++) {
          ctx.beginPath()
          ctx.arc(originX, originY, ((lengthPx * 1.15 * r) / 4) * ringDepthFactor, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.restore()

        // --- Suelo + sombra proyectada (sólo en modo 3D: es la señal de profundidad más legible) ---
        if (pseudo3D) {
          const floorY = Math.min(height * 0.94, originY + lengthPx * 1.3)
          const floorGrad = ctx.createLinearGradient(0, floorY - 40, 0, floorY + 40)
          floorGrad.addColorStop(0, 'rgba(255,255,255,0)')
          floorGrad.addColorStop(1, 'rgba(255,255,255,0.03)')
          ctx.save()
          ctx.fillStyle = floorGrad
          ctx.fillRect(0, floorY - 40, width, 80)
          ctx.restore()

          const proximity = Math.max(0, Math.min(1, position.y / length))
          const shadowX = originX + position.x * scale
          const shadowBaseR = Math.max(10, Math.min(width, height) * 0.05)
          const shadowR = shadowBaseR * (0.7 + proximity * 0.5) * (1 + depthNorm * 0.2)
          const shadowAlpha = 0.1 + proximity * 0.28

          ctx.save()
          ctx.beginPath()
          ctx.ellipse(shadowX, floorY, shadowR, shadowR * 0.32, 0, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0,0,0,${shadowAlpha.toFixed(3)})`
          ctx.filter = 'blur(2px)'
          ctx.fill()
          ctx.restore()
        }

        // --- Estela ---
        if (showTrail) {
          const trail = trailRef.current
          for (let i = 0; i < trail.length; i++) {
            const p = trail[i]
            const lifeRatio = 1 - p.age / TRAIL_MAX_AGE
            if (lifeRatio <= 0) continue
            const depthAlphaFactor = pseudo3D ? 1 - Math.max(0, -p.depthNorm) * 0.5 : 1
            const depthSize = pseudo3D ? 1 + p.depthNorm * 0.3 : 1
            ctx.beginPath()
            ctx.fillStyle = alphaReplace(palette.glow, lifeRatio * 0.35 * depthAlphaFactor)
            ctx.arc(p.x, p.y, (3 + lifeRatio * 5) * depthSize, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        // --- Soporte / anclaje ---
        ctx.save()
        const mountGrad = ctx.createLinearGradient(originX - 40, originY, originX + 40, originY)
        mountGrad.addColorStop(0, '#2a2a33')
        mountGrad.addColorStop(0.5, '#55555f')
        mountGrad.addColorStop(1, '#2a2a33')
        ctx.fillStyle = mountGrad
        ctx.fillRect(originX - 46, originY - 6, 92, 6)
        ctx.beginPath()
        ctx.fillStyle = '#1c1c22'
        ctx.arc(originX, originY, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // --- Cuerda ---
        ctx.save()
        const stringGrad = ctx.createLinearGradient(originX, originY, bobX, bobY)
        stringGrad.addColorStop(0, 'rgba(210,210,220,0.55)')
        stringGrad.addColorStop(1, 'rgba(210,210,220,0.2)')
        ctx.strokeStyle = stringGrad
        ctx.lineWidth = pseudo3D ? 1.5 * sizeFactor : 1.5
        ctx.beginPath()
        ctx.moveTo(originX, originY)
        ctx.lineTo(bobX, bobY)
        ctx.stroke()
        ctx.restore()

        // --- Lenteja (medallón) ---
        const bobRadius = Math.max(16, Math.min(width, height) * 0.045) * sizeFactor

        ctx.save()
        ctx.globalAlpha = 1 - farFactor * 0.22
        ctx.shadowColor = palette.glow
        ctx.shadowBlur = bobRadius * 1.8 * (1 - farFactor * 0.4)
        const bobGrad = ctx.createRadialGradient(
          bobX - bobRadius * 0.35,
          bobY - bobRadius * 0.35,
          bobRadius * 0.1,
          bobX,
          bobY,
          bobRadius
        )
        bobGrad.addColorStop(0, palette.core)
        bobGrad.addColorStop(0.55, palette.mid)
        bobGrad.addColorStop(1, palette.edge)
        ctx.beginPath()
        ctx.fillStyle = bobGrad
        ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Anillo interior decorativo + brillo giratorio (puramente estético, no físico)
        ctx.save()
        ctx.globalAlpha = 1 - farFactor * 0.3
        ctx.translate(bobX, bobY)
        ctx.rotate(spinRef.current)
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(0, 0, bobRadius * 0.62, 0, Math.PI * 1.1)
        ctx.stroke()
        ctx.restore()

        if (draggingRef.current) {
          ctx.save()
          ctx.strokeStyle = 'rgba(255,255,255,0.4)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(bobX, bobY, bobRadius + 8, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()
        }
      },
      [size, showTrail, theme, pseudo3D, length]
    )

    const handleFrame = useCallback(
      (state: Pendulum3DState, dtSeconds: number) => {
        spinRef.current += dtSeconds * 0.15

        const canvas = canvasRef.current
        if (canvas && size.width > 0) {
          const originX = size.width / 2
          const originY = size.height * 0.14
          const lengthPx = Math.min(size.width * 0.42, size.height * 0.72)
          const scale = lengthPx / length
          const depthNorm = pseudo3D ? Math.max(-1, Math.min(1, state.position.z / length)) : 0
          const parallaxX = pseudo3D ? state.position.z * scale * 0.22 : 0
          const bobX = originX + state.position.x * scale + parallaxX
          const bobY = originY + state.position.y * scale

          const trail = trailRef.current
          trail.forEach((p) => (p.age += 1))
          trail.push({ x: bobX, y: bobY, depthNorm, age: 0 })
          while (trail.length > TRAIL_LENGTH) trail.shift()
          trailRef.current = trail.filter((p) => p.age < TRAIL_MAX_AGE)
        }

        draw(state.position)

        // --- Detección del ápice (punto de inflexión) para la campanilla y el sonido ambiental ---
        const theta = projectedAngle(state.position)
        const delta = theta - prevThetaRef.current
        const deltaSign = Math.sign(delta)
        chimeCooldownRef.current = Math.max(0, chimeCooldownRef.current - dtSeconds)
        if (
          deltaSign !== 0 &&
          prevDeltaSignRef.current !== 0 &&
          deltaSign !== prevDeltaSignRef.current &&
          chimeCooldownRef.current === 0
        ) {
          audio.triggerChime()
          chimeCooldownRef.current = CHIME_COOLDOWN
        }
        if (deltaSign !== 0) prevDeltaSignRef.current = deltaSign
        prevThetaRef.current = theta

        const angularSpeed = Math.sqrt(
          state.velocity.x ** 2 + state.velocity.y ** 2 + state.velocity.z ** 2
        ) / length
        audio.update(theta, angularSpeed)

        lastReportRef.current += dtSeconds
        if (onAngleChange && lastReportRef.current > 0.1) {
          lastReportRef.current = 0
          const degrees = (theta * 180) / Math.PI
          const period = 2 * Math.PI * Math.sqrt(length / 9.81)
          onAngleChange(degrees, period)
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [draw, size, onAngleChange, length, pseudo3D, audio]
    )

    const sim = usePendulumSimulation({
      initialParams,
      initialState: stateFromAngle(35, length),
      onFrame: handleFrame
    })

    useEffect(() => {
      sim.setParams({ length, damping, allowDepth: pseudo3D })
    }, [sim, length, damping, pseudo3D])

    useEffect(() => {
      sim.setRunning(running)
    }, [sim, running])

    // Al activar el modo 3D, inyecta un impulso de profundidad para que el péndulo empiece a
    // precesar de inmediato (si no, con z=0 y vz=0 seguiría oscilando en un plano para siempre).
    // Al desactivarlo, vuelve a aplanar la trayectoria al instante.
    useEffect(() => {
      pseudo3DRef.current = pseudo3D
      const current = sim.getState()
      if (pseudo3D) {
        sim.setState(withDepthKick(current, DEPTH_KICK))
      } else {
        sim.setState({ position: { ...current.position, z: 0 }, velocity: { ...current.velocity, z: 0 } })
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pseudo3D])

    useImperativeHandle(ref, () => ({
      release: (angleDegrees: number) => {
        trailRef.current = []
        const base = stateFromAngle(angleDegrees, length)
        sim.setState(pseudo3DRef.current ? withDepthKick(base, DEPTH_KICK) : base)
      }
    }))

    // --- Interacción: arrastrar la lenteja para fijar el ángulo inicial ---
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const getAngleFromPointer = (clientX: number, clientY: number): number => {
        const rect = canvas.getBoundingClientRect()
        const originX = rect.left + rect.width / 2
        const originY = rect.top + rect.height * 0.14
        const dx = clientX - originX
        const dy = Math.max(clientY - originY, 1)
        let angleRad = Math.atan2(dx, dy)
        const maxRad = (MAX_DRAG_DEGREES * Math.PI) / 180
        angleRad = Math.max(-maxRad, Math.min(maxRad, angleRad))
        return angleRad
      }

      const setFromPointer = (clientX: number, clientY: number) => {
        const angle = getAngleFromPointer(clientX, clientY)
        const currentZ = sim.getState().position.z
        const px = length * Math.sin(angle)
        const py = length * Math.cos(angle)
        const pz = pseudo3DRef.current ? currentZ : 0
        const norm = length / Math.sqrt(px * px + py * py + pz * pz)
        sim.setState({
          position: { x: px * norm, y: py * norm, z: pz * norm },
          velocity: { x: 0, y: 0, z: 0 }
        })
      }

      const onPointerDown = (e: PointerEvent) => {
        draggingRef.current = true
        sim.setRunning(false)
        trailRef.current = []
        canvas.setPointerCapture(e.pointerId)
        setFromPointer(e.clientX, e.clientY)
      }

      const onPointerMove = (e: PointerEvent) => {
        if (!draggingRef.current) return
        setFromPointer(e.clientX, e.clientY)
      }

      const onPointerUp = () => {
        if (!draggingRef.current) return
        draggingRef.current = false
        if (pseudo3DRef.current) {
          sim.setState(withDepthKick(sim.getState(), DEPTH_KICK))
        }
        sim.setRunning(running)
      }

      canvas.addEventListener('pointerdown', onPointerDown)
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)

      return () => {
        canvas.removeEventListener('pointerdown', onPointerDown)
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('pointercancel', onPointerUp)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sim, running, length])

    return (
      <div ref={containerRef} className="pendulum-stage">
        <canvas ref={canvasRef} className="pendulum-canvas" aria-label="Simulación de péndulo hipnótico" role="img" />
      </div>
    )
  }
)
