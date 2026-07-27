import { type RefObject, useEffect, useState } from 'react'

export interface CanvasSize {
  width: number
  height: number
  dpr: number
}

/**
 * Mantiene un <canvas> con el tamaño de su contenedor y escalado correcto para
 * pantallas de alta densidad (Retina/iPhone/iPad), usando ResizeObserver para
 * reaccionar a cambios de tamaño, rotación de pantalla o entrada/salida de
 * pantalla completa.
 */
export function useResizeCanvas(
  containerRef: RefObject<HTMLElement>,
  canvasRef: RefObject<HTMLCanvasElement>
): CanvasSize {
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0, dpr: 1 })

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const applySize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 3) // límite razonable de rendimiento
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      setSize({ width, height, dpr })
    }

    applySize()

    const resizeObserver = new ResizeObserver(() => applySize())
    resizeObserver.observe(container)

    // Cambios de orientación en iOS a veces no disparan ResizeObserver a tiempo.
    window.addEventListener('orientationchange', applySize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('orientationchange', applySize)
    }
  }, [containerRef, canvasRef])

  return size
}
