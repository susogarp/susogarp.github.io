import { useCallback, useEffect, useRef } from 'react'
import { stepPendulum3D, type Pendulum3DParams, type Pendulum3DState } from '../physics/pendulum3d'

/** Paso de integración fijo: 240 Hz. Independiente de la tasa de refresco de la pantalla. */
const FIXED_DT = 1 / 240
/** Evita la "espiral de la muerte" si la pestaña estuvo en segundo plano. */
const MAX_SUBSTEPS_PER_FRAME = 60

export interface SimulationHandle {
  getState: () => Pendulum3DState
  /** Fuerza el estado (p. ej. al arrastrar la lenteja, o al inyectar un impulso 3D). */
  setState: (state: Pendulum3DState) => void
  setParams: (params: Partial<Pendulum3DParams>) => void
  getParams: () => Pendulum3DParams
  setRunning: (running: boolean) => void
  isRunning: () => boolean
}

interface UsePendulumSimulationOptions {
  initialParams: Pendulum3DParams
  initialState: Pendulum3DState
  /** Se invoca en cada frame de pintado, después de avanzar la física. */
  onFrame: (state: Pendulum3DState, dtSeconds: number) => void
}

/**
 * Bucle de simulación con "paso de tiempo fijo + acumulador" (patrón clásico de motores
 * de física). Garantiza que el péndulo se mueva EXACTAMENTE igual en un iPhone a 60 Hz
 * que en un iPad Pro a 120 Hz: lo único que cambia es cuántas veces se pinta por segundo,
 * nunca la trayectoria física.
 */
export function usePendulumSimulation({
  initialParams,
  initialState,
  onFrame
}: UsePendulumSimulationOptions): SimulationHandle {
  const stateRef = useRef<Pendulum3DState>(initialState)
  const paramsRef = useRef<Pendulum3DParams>(initialParams)
  const runningRef = useRef(true)
  const accumulatorRef = useRef(0)
  const lastTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame

  const tick = useCallback((timeMs: number) => {
    if (lastTimeRef.current === null) {
      lastTimeRef.current = timeMs
    }
    const frameSeconds = (timeMs - lastTimeRef.current) / 1000
    lastTimeRef.current = timeMs

    if (runningRef.current) {
      accumulatorRef.current += Math.min(frameSeconds, 0.25) // clamp por si hubo un salto grande

      let substeps = 0
      while (accumulatorRef.current >= FIXED_DT && substeps < MAX_SUBSTEPS_PER_FRAME) {
        stateRef.current = stepPendulum3D(stateRef.current, paramsRef.current, FIXED_DT)
        accumulatorRef.current -= FIXED_DT
        substeps++
      }
    }

    onFrameRef.current(stateRef.current, frameSeconds)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [tick])

  return {
    getState: () => stateRef.current,
    setState: (state) => {
      stateRef.current = state
      accumulatorRef.current = 0
    },
    setParams: (partial) => {
      paramsRef.current = { ...paramsRef.current, ...partial }
    },
    getParams: () => paramsRef.current,
    setRunning: (running) => {
      runningRef.current = running
      lastTimeRef.current = null
    },
    isRunning: () => runningRef.current
  }
}
