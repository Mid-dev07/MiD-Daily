import { useEffect, useState } from 'react'
import { MiDWorldCanvas } from './MiDWorldCanvas'
import { environmentCssVariables } from './visual'
import type { EnvironmentState } from './types'

interface EnvironmentSceneProps {
  environment: EnvironmentState
}

const stars = [
  ['8%', '14%', '2px'], ['15%', '24%', '1px'], ['24%', '10%', '2px'], ['31%', '18%', '1px'],
  ['42%', '8%', '1px'], ['49%', '23%', '2px'], ['58%', '13%', '1px'], ['67%', '20%', '2px'],
  ['76%', '9%', '1px'], ['84%', '25%', '2px'], ['92%', '14%', '1px'], ['18%', '34%', '1px'],
  ['37%', '31%', '1px'], ['55%', '34%', '1px'], ['72%', '31%', '1px'], ['89%', '36%', '2px'],
]

export function EnvironmentScene({ environment }: EnvironmentSceneProps) {
  const [worldReady, setWorldReady] = useState(false)

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      window.dispatchEvent(new CustomEvent('mid:world-pointer', {
        detail: {
          x: (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2,
          y: (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2,
        },
      }))
    }

    window.addEventListener('pointermove', handlePointer, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointer)
  }, [])

  return (
    <div
      className="environment-scene"
      data-renderer={worldReady ? 'webgl' : 'css'}
      data-day-phase={environment.dayPhase}
      data-weather={environment.weather?.condition ?? 'clear'}
      style={environmentCssVariables(environment)}
      aria-hidden="true"
    >
      <MiDWorldCanvas environment={environment} onReady={setWorldReady} />
      <div className="environment-sky" />
      <div className="environment-stars">
        {stars.map(([x, y, size], index) => (
          <i
            key={index}
            style={{
              '--star-x': x,
              '--star-y': y,
              '--star-size': size,
            } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="environment-sun" />
      <div className="environment-moon" />
      <div className="environment-clouds">
        <span className="environment-cloud cloud-a" />
        <span className="environment-cloud cloud-b" />
        <span className="environment-cloud cloud-c" />
      </div>
      <div className="environment-horizon" />
      <div className="environment-terrain" />
      <div className="environment-canopy" />
      <div className="environment-light-shafts" />
      <div className="environment-rain" />
      <div className="environment-fog" />
      <div className="environment-vignette" />
    </div>
  )
}
