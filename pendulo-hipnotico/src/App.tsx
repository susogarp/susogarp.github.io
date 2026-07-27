import { useRef, useState } from 'react'
import { PendulumCanvas, type PendulumCanvasHandle, type PendulumTheme } from './components/PendulumCanvas'
import { ControlPanel } from './components/ControlPanel'

export default function App() {
  const [length, setLength] = useState(0.9)
  const [damping, setDamping] = useState(0.01)
  const [running, setRunning] = useState(true)
  const [showTrail, setShowTrail] = useState(true)
  const [theme, setTheme] = useState<PendulumTheme>('oro')
  const [collapsed, setCollapsed] = useState(false)
  const [angleDegrees, setAngleDegrees] = useState(35)
  const [periodSeconds, setPeriodSeconds] = useState(0)
  const [pseudo3D, setPseudo3D] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [soundVolume, setSoundVolume] = useState(0.6)

  const canvasHandle = useRef<PendulumCanvasHandle>(null)

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="app__title">Péndulo</p>
          <p className="app__subtitle">simulación física · no lineal</p>
        </div>
      </header>

      <div className="app__stage-wrap">
        <PendulumCanvas
          ref={canvasHandle}
          length={length}
          damping={damping}
          running={running}
          showTrail={showTrail}
          theme={theme}
          pseudo3D={pseudo3D}
          soundEnabled={soundEnabled}
          soundVolume={soundVolume}
          onAngleChange={(degrees, period) => {
            setAngleDegrees(degrees)
            setPeriodSeconds(period)
          }}
        />

        <ControlPanel
          length={length}
          onLengthChange={setLength}
          damping={damping}
          onDampingChange={setDamping}
          running={running}
          onToggleRunning={() => setRunning((r) => !r)}
          showTrail={showTrail}
          onToggleTrail={() => setShowTrail((s) => !s)}
          theme={theme}
          onThemeChange={setTheme}
          onRelease={() => canvasHandle.current?.release(35)}
          periodSeconds={periodSeconds}
          angleDegrees={angleDegrees}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
          pseudo3D={pseudo3D}
          onTogglePseudo3D={() => setPseudo3D((v) => !v)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((v) => !v)}
          soundVolume={soundVolume}
          onSoundVolumeChange={setSoundVolume}
        />
      </div>
    </div>
  )
}
