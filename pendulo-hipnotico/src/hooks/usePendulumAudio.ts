import { useCallback, useEffect, useRef } from 'react'

/**
 * Motor de audio ambiental, sintetizado en tiempo real con Web Audio API
 * (nada de archivos .mp3): un "drone" grave cuya afinación se mece
 * suavemente con el balanceo del péndulo, y una campanilla breve en cada
 * punto de inflexión (el instante en que el péndulo se detiene y cambia de
 * sentido). Se puede activar/desactivar en cualquier momento; el
 * AudioContext solo se crea la primera vez que el usuario activa el sonido
 * (los navegadores exigen un gesto del usuario antes de permitir audio).
 */
export interface UsePendulumAudioOptions {
  enabled: boolean
  /** Volumen maestro, 0 a 1. */
  volume: number
}

export function usePendulumAudio({ enabled, volume }: UsePendulumAudioOptions) {
  const ctxRef = useRef<AudioContext | null>(null)
  const droneOscRef = useRef<OscillatorNode | null>(null)
  const padOscRef = useRef<OscillatorNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  const ensureContext = useCallback((): AudioContext | null => {
    if (ctxRef.current) return ctxRef.current

    const AudioContextCtor: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return null

    const ctx = new AudioContextCtor()

    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    filter.Q.value = 0.5
    filter.connect(master)

    // Drone principal: un zumbido grave y continuo, columna vertebral del ambiente.
    const droneGain = ctx.createGain()
    droneGain.gain.value = 0.14
    droneGain.connect(filter)
    const droneOsc = ctx.createOscillator()
    droneOsc.type = 'sine'
    droneOsc.frequency.value = 110
    droneOsc.connect(droneGain)
    droneOsc.start()

    // Segunda voz, una quinta justa por encima y muy tenue: le da cuerpo (pad), sin protagonismo.
    const padGain = ctx.createGain()
    padGain.gain.value = 0.045
    padGain.connect(filter)
    const padOsc = ctx.createOscillator()
    padOsc.type = 'sine'
    padOsc.frequency.value = 110 * 1.5
    padOsc.connect(padGain)
    padOsc.start()

    ctxRef.current = ctx
    droneOscRef.current = droneOsc
    padOscRef.current = padOsc
    filterRef.current = filter
    masterGainRef.current = master

    return ctx
  }, [])

  useEffect(() => {
    if (enabled) {
      const ctx = ensureContext()
      if (!ctx || !masterGainRef.current) return
      if (ctx.state === 'suspended') void ctx.resume()
      masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime)
      masterGainRef.current.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.7)
    } else {
      const ctx = ctxRef.current
      if (!ctx || !masterGainRef.current) return
      masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime)
      masterGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ensureContext])

  // Ajuste de volumen en caliente, sin re-disparar el fundido de entrada/salida.
  useEffect(() => {
    const ctx = ctxRef.current
    if (!enabled || !ctx || !masterGainRef.current) return
    masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime)
    masterGainRef.current.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.15)
  }, [volume, enabled])

  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {
        /* el contexto ya pudo haberse cerrado; no hay nada que hacer */
      })
    }
  }, [])

  /** Llamar en cada frame: desliza suavemente la afinación y el timbre según el movimiento. */
  const update = useCallback(
    (signedAngleRad: number, angularSpeed: number) => {
      const ctx = ctxRef.current
      if (!ctx || !enabled) return
      const now = ctx.currentTime
      const baseFreq = 110
      const targetFreq = baseFreq + signedAngleRad * 14
      droneOscRef.current?.frequency.setTargetAtTime(targetFreq, now, 0.25)
      padOscRef.current?.frequency.setTargetAtTime(targetFreq * 1.5, now, 0.25)

      const targetCutoff = 650 + Math.min(angularSpeed, 4) * 220
      filterRef.current?.frequency.setTargetAtTime(targetCutoff, now, 0.2)
    },
    [enabled]
  )

  /** Campanilla breve y suave: pensada para el ápice del giro (el punto de inflexión). */
  const triggerChime = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || !enabled) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 660

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)

    osc.connect(gain)
    gain.connect(filterRef.current ?? ctx.destination)
    osc.start(now)
    osc.stop(now + 1.3)
  }, [enabled])

  return { update, triggerChime }
}
