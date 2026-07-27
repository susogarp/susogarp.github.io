# Péndulo Hipnótico

Simulación física (no una animación con seno) de un péndulo de hipnosis, construida con
React + TypeScript + Vite, renderizada en Canvas 2D, e instalable como PWA en iPhone, iPad,
Android, tablets, laptop y desktop.

## Poner en marcha

```bash
npm install
npm run dev       # servidor de desarrollo
npm run build     # build de producción (dist/), incluye manifest + service worker
npm run preview   # sirve el build de producción para probar instalación PWA
```

Requiere Node 18+.

## Por qué es una simulación física real

El movimiento **no** usa `sin(t * velocidad)`. Se integra la ecuación diferencial real de un
péndulo simple:

```
θ'' = -(g / L) · sin(θ) − c · θ'
```

con Runge-Kutta de 4º orden (`src/physics/pendulum.ts`). Esto importa porque un péndulo real
es un oscilador **no lineal**: uno liberado desde 80° tarda más en completar un ciclo que uno
liberado desde 20°, algo que una animación senoidal simple no puede reproducir (ahí el periodo
es constante, independiente de la amplitud).

## Fluidez en cualquier dispositivo

`src/hooks/usePendulumSimulation.ts` implementa un bucle de **paso de tiempo fijo con
acumulador** (el patrón estándar de motores de física/juegos): la física avanza siempre en
pasos de 1/240s, sin importar la tasa de refresco real de la pantalla. Así, el péndulo se
comporta exactamente igual en un iPhone a 60Hz que en un iPad Pro a 120Hz (ProMotion); lo único
que cambia es cuántas veces se pinta por segundo, nunca la trayectoria.

El renderizado usa `requestAnimationFrame` y un `<canvas>` escalado según
`devicePixelRatio` (con tope en 3x por rendimiento) para verse nítido en pantallas retina.

## Sonido

`src/hooks/usePendulumAudio.ts` sintetiza el sonido en tiempo real con Web Audio API — sin
ningún archivo de audio, así que no añade peso a la app y funciona sin conexión dentro de la
PWA. Dos capas: un "drone" grave que se mece con el ángulo y una campanilla breve en cada punto
de inflexión (cuando el péndulo se detiene un instante y cambia de sentido, igual que un
péndulo real). El `AudioContext` solo se crea al activar el interruptor de sonido por primera
vez (gesto del usuario, requerido por las políticas de autoplay de los navegadores). Hay un
interruptor para desactivarlo por completo y un control de volumen independiente.

## Modo pseudo-3D

El botón "Efecto 3D" cambia el motor físico de un péndulo plano (2D) a un **péndulo esférico**
(`src/physics/pendulum3d.ts`): se integra la posición cartesiana en 3D y se restringe a la
esfera de radio `length` en cada paso (cuerda inextensible), el mismo enfoque que usan los
motores de física de videojuegos para cuerdas. Al activarlo se inyecta un pequeño impulso de
velocidad en el eje de profundidad (z), lo que hace que el péndulo empiece a **precesar**
(trazar una elipse/roseta en el espacio) en vez de oscilar en un plano fijo — es un fenómeno
físico real, no una animación añadida.

Señales de profundidad renderizadas a partir de esa física real:
- **Escala y brillo**: la lenteja crece y brilla más cuando está "cerca" (z positivo) y se
  atenúa cuando está "lejos".
- **Sombra proyectada**: una sombra suave en un plano de suelo, cuyo tamaño/opacidad siguen la
  proximidad real del péndulo en ese instante.
- **Paralaje**: los anillos concéntricos de fondo respiran levemente con la profundidad, como
  si la cámara reaccionara al movimiento.
- **Estela con profundidad**: los puntos de la estela heredan el tamaño/alpha del momento en
  que se registraron, reforzando la sensación de recorrido en el espacio.

## Interacción

Toca/arrastra el medallón para fijar el ángulo de salida (igual que un péndulo real): al
soltar, la física continúa desde ese ángulo con velocidad cero. El panel de control permite
ajustar la longitud de la cuerda (periodo), la amortiguación, el tema visual y la estela.

## Estructura

```
src/
  physics/pendulum.ts        ecuación no lineal + integrador RK4
  hooks/usePendulumSimulation.ts   bucle de física a paso fijo
  hooks/useResizeCanvas.ts         canvas responsive + DPR
  components/PendulumCanvas.tsx    render + interacción de arrastre
  components/ControlPanel.tsx      controles (hoja inferior en móvil, panel lateral en desktop)
```

## PWA

Configurada vía `vite-plugin-pwa` (`vite.config.ts`): manifest con iconos 192/512/maskable,
`display: standalone`, service worker con precache (`generateSW`/Workbox). Para regenerar los
iconos PNG desde cero: `python3 scripts/generate_icons.py` (requiere Pillow).

En iOS, "Instalar" se hace desde Safari → Compartir → "Añadir a pantalla de inicio" (Apple no
soporta el prompt `beforeinstallprompt`, por eso no hay un botón "Instalar" automático en iOS).
En Android/desktop con Chrome/Edge sí aparece el prompt nativo de instalación.
