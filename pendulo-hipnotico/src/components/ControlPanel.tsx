import type { PendulumTheme } from './PendulumCanvas'
import './ControlPanel.css'

interface ControlPanelProps {
  length: number
  onLengthChange: (value: number) => void
  damping: number
  onDampingChange: (value: number) => void
  running: boolean
  onToggleRunning: () => void
  showTrail: boolean
  onToggleTrail: () => void
  theme: PendulumTheme
  onThemeChange: (theme: PendulumTheme) => void
  onRelease: () => void
  periodSeconds: number
  angleDegrees: number
  collapsed: boolean
  onToggleCollapsed: () => void
  pseudo3D: boolean
  onTogglePseudo3D: () => void
  soundEnabled: boolean
  onToggleSound: () => void
  soundVolume: number
  onSoundVolumeChange: (value: number) => void
}

const THEME_OPTIONS: { id: PendulumTheme; label: string }[] = [
  { id: 'oro', label: 'Oro' },
  { id: 'plata', label: 'Plata' },
  { id: 'ambar', label: 'Ámbar' }
]

export function ControlPanel({
  length,
  onLengthChange,
  damping,
  onDampingChange,
  running,
  onToggleRunning,
  showTrail,
  onToggleTrail,
  theme,
  onThemeChange,
  onRelease,
  periodSeconds,
  angleDegrees,
  collapsed,
  onToggleCollapsed,
  pseudo3D,
  onTogglePseudo3D,
  soundEnabled,
  onToggleSound,
  soundVolume,
  onSoundVolumeChange
}: ControlPanelProps) {
  return (
    <div className={`control-panel ${collapsed ? 'control-panel--collapsed' : ''}`}>
      <button
        type="button"
        className="control-panel__handle"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        aria-controls="control-panel-body"
      >
        <span className="control-panel__handle-bar" />
        <span className="control-panel__handle-label">
          {collapsed ? 'Mostrar controles' : 'Ocultar controles'}
        </span>
      </button>

      <div id="control-panel-body" className="control-panel__body">
        <div className="control-panel__readout">
          <div>
            <span className="control-panel__readout-value">{angleDegrees.toFixed(1)}°</span>
            <span className="control-panel__readout-label">ángulo</span>
          </div>
          <div>
            <span className="control-panel__readout-value">{periodSeconds.toFixed(2)}s</span>
            <span className="control-panel__readout-label">periodo natural</span>
          </div>
        </div>

        <div className="control-panel__row">
          <button type="button" className="control-panel__primary" onClick={onToggleRunning}>
            {running ? 'Pausar' : 'Reanudar'}
          </button>
          <button type="button" className="control-panel__secondary" onClick={onRelease}>
            Soltar de nuevo
          </button>
        </div>

        <label className="control-panel__slider">
          <span>Longitud de la cuerda</span>
          <input
            type="range"
            min={0.3}
            max={1.8}
            step={0.01}
            value={length}
            onChange={(e) => onLengthChange(Number(e.target.value))}
          />
        </label>

        <label className="control-panel__slider">
          <span>Amortiguación</span>
          <input
            type="range"
            min={0}
            max={0.4}
            step={0.005}
            value={damping}
            onChange={(e) => onDampingChange(Number(e.target.value))}
          />
        </label>

        <div className="control-panel__row control-panel__row--wrap">
          <label className="control-panel__toggle">
            <input type="checkbox" checked={showTrail} onChange={onToggleTrail} />
            <span>Estela</span>
          </label>

          <label className="control-panel__toggle">
            <input type="checkbox" checked={pseudo3D} onChange={onTogglePseudo3D} />
            <span>Efecto 3D</span>
          </label>

          <div className="control-panel__themes">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`control-panel__theme-dot control-panel__theme-dot--${opt.id} ${
                  theme === opt.id ? 'is-active' : ''
                }`}
                aria-label={opt.label}
                aria-pressed={theme === opt.id}
                onClick={() => onThemeChange(opt.id)}
              />
            ))}
          </div>
        </div>

        <div className="control-panel__sound">
          <label className="control-panel__toggle">
            <input type="checkbox" checked={soundEnabled} onChange={onToggleSound} />
            <span>Sonido ambiental</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={soundVolume}
            disabled={!soundEnabled}
            onChange={(e) => onSoundVolumeChange(Number(e.target.value))}
            aria-label="Volumen"
            className="control-panel__volume"
          />
        </div>

        <p className="control-panel__hint">
          Toca y arrastra el medallón para fijar el ángulo de salida.
          {pseudo3D && ' El modo 3D añade profundidad: el péndulo precesa y se acerca/aleja del punto de vista.'}
        </p>
      </div>
    </div>
  )
}
