'use client'

import { useEffect, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Engine, ISourceOptions } from '@tsparticles/engine'

export function HiveParticleField() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const initParticles = async () => {
      await initParticlesEngine(async (engine: Engine) => {
        await loadSlim(engine)
      })
      setReady(true)
    }
    initParticles().catch((error) => {
      console.error('Failed to initialize particles:', error)
    })
  }, [])

  const options: ISourceOptions = {
    background: {
      color: {
        value: 'transparent',
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: 'grab',
        },
        onClick: {
          enable: true,
          mode: 'push',
        },
      },
      modes: {
        grab: {
          distance: 140,
          links: {
            opacity: 0.5,
            color: '#F59E0B',
          },
        },
        push: {
          quantity: 2,
        },
      },
    },
    particles: {
      color: {
        value: ['#F59E0B', '#06B6D4', '#8B5CF6'],
      },
      links: {
        color: '#F59E0B',
        distance: 150,
        enable: true,
        opacity: 0.1,
        width: 1,
      },
      move: {
        enable: true,
        speed: 0.5,
        direction: 'none',
        random: true,
        straight: false,
        outModes: {
          default: 'bounce',
        },
      },
      number: {
        density: {
          enable: true,
          width: 1920,
          height: 1080,
        },
        value: 60,
      },
      opacity: {
        value: {
          min: 0.1,
          max: 0.5,
        },
        animation: {
          enable: true,
          speed: 0.5,
          startValue: 'random',
          sync: false,
        },
      },
      shape: {
        type: 'circle',
      },
      size: {
        value: {
          min: 1,
          max: 3,
        },
        animation: {
          enable: true,
          speed: 2,
          startValue: 'random',
          sync: false,
        },
      },
    },
    detectRetina: true,
  }

  if (!ready) return null

  return (
    <Particles
      id="hive-particles"
      className="fixed inset-0 pointer-events-none"
      options={options}
    />
  )
}
