import { useEffect } from 'react'
import type { RefObject } from 'react'

type InteractionRoot = HTMLElement | null

const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches
const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useLivingInteractions(rootRef: RefObject<InteractionRoot>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || isCoarsePointer() || isReducedMotion()) return undefined

    let frame = 0
    let pointerX = 50
    let pointerY = 50

    const writeEnvironmentMotion = () => {
      frame = 0
      const deltaX = pointerX - 50
      const deltaY = pointerY - 50
      root.style.setProperty('--pointer-x', pointerX.toFixed(2) + '%')
      root.style.setProperty('--pointer-y', pointerY.toFixed(2) + '%')
      root.style.setProperty('--environment-parallax-x', (deltaX * 0.06).toFixed(2) + 'px')
      root.style.setProperty('--environment-parallax-y', (deltaY * 0.035).toFixed(2) + 'px')
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = (event.clientX / Math.max(window.innerWidth, 1)) * 100
      pointerY = (event.clientY / Math.max(window.innerHeight, 1)) * 100
      if (!frame) frame = window.requestAnimationFrame(writeEnvironmentMotion)

      const target = (event.target as Element | null)?.closest<HTMLElement>(
        '.content-card, .stat-card, .feature-node, .primary-button, .secondary-button, .nav-item',
      )
      if (!target || target.closest('[aria-hidden="true"]')) return

      const rect = target.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      const localX = ((event.clientX - rect.left) / rect.width) * 100
      const localY = ((event.clientY - rect.top) / rect.height) * 100
      target.style.setProperty('--surface-x', localX.toFixed(2) + '%')
      target.style.setProperty('--surface-y', localY.toFixed(2) + '%')
    }

    const handlePointerLeave = () => {
      pointerX = 50
      pointerY = 50
      if (!frame) frame = window.requestAnimationFrame(writeEnvironmentMotion)
    }

    root.addEventListener('pointermove', handlePointerMove, { passive: true })
    root.addEventListener('pointerleave', handlePointerLeave, { passive: true })

    return () => {
      root.removeEventListener('pointermove', handlePointerMove)
      root.removeEventListener('pointerleave', handlePointerLeave)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [rootRef])
}
