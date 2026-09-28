import { useEffect } from 'react'

const MICRO_TILT_SELECTOR = '.feature-landscape, .dashboard-command-deck, .dashboard-hero-aside'
const PRIORITY_SURFACE_SELECTOR = '.dashboard-command-deck, .dashboard-hero-aside, .primary-button, .workspace-context-item'
const SURFACE_SELECTOR = [
  '.sidebar', '.topbar', '.content-card', '.glass-panel', '.stat-card', '.dashboard-signal-card',
  '.feature-directory-item', '.feature-node', '.secondary-button', '.filter-button', '.icon-button',
  '.profile-chip', '.environment-control', '.search-trigger', '.connections-toggle', '.briefing-item',
  '.planner-shortcut', '.global-search-result', '.toast', '.finance-budget-row', '.task-item-card',
  '.notification-card', '.notification-popover', '.secondary-panel', '.global-search-dialog',
  '.flexible-plan', '.schedule-now-strip', '.insights-metric', '.habit-check', '.habit-day',
  '.dashboard-section-link', '.dashboard-command-deck', '.dashboard-hero-aside', '.workspace-context-item',
  '.primary-button',
].join(',')

export function useForegroundInteraction() {
  useEffect(() => {
    const frame = document.querySelector('.app-frame')
    if (!(frame instanceof HTMLElement)) return

    const supportsPointerLighting = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    let activeSurface: HTMLElement | null = null
    let landscape: HTMLElement | null = null
    let animationFrame = 0
    let pointerX = 0
    let pointerY = 0
    let focusStrength = 0
    let keyboardFocusStrength = 0
    let focusedSurface: HTMLElement | null = null

    frame.style.setProperty('--ux-focus-strength', '0')

    const setFocusStrength = (value: number) => {
      focusStrength = value
      frame.style.setProperty('--ux-focus-strength', String(value))
    }

    const clearSurface = () => {
      if (!activeSurface) return
      activeSurface.removeAttribute('data-ux-lit')
      activeSurface.style.removeProperty('--ux-x')
      activeSurface.style.removeProperty('--ux-y')
      activeSurface.style.removeProperty('--ux-rx')
      activeSurface.style.removeProperty('--ux-ry')
      activeSurface.style.removeProperty('--ux-elevation')
      activeSurface = null
      setFocusStrength(keyboardFocusStrength)
    }

    const clearLandscape = () => {
      if (!landscape) return
      landscape.removeAttribute('data-ux-lit')
      landscape.style.removeProperty('--ux-tilt-x')
      landscape.style.removeProperty('--ux-tilt-y')
      landscape = null
    }

    const clearFocusSurface = () => {
      if (!focusedSurface) return
      focusedSurface.removeAttribute('data-ux-focus')
      focusedSurface = null
    }

    const emitWorldPointer = (clientX: number, clientY: number, focus: number) => {
      window.dispatchEvent(new CustomEvent('mid:world-pointer', {
        detail: {
          x: (clientX / Math.max(1, window.innerWidth) - 0.5) * 2,
          y: (clientY / Math.max(1, window.innerHeight) - 0.5) * 2,
          focus,
        },
      }))
    }

    const schedule = () => {
      if (animationFrame) return
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0

        if (activeSurface) {
          const rect = activeSurface.getBoundingClientRect()
          const x = Math.max(0, Math.min(100, ((pointerX - rect.left) / Math.max(1, rect.width)) * 100))
          const y = Math.max(0, Math.min(100, ((pointerY - rect.top) / Math.max(1, rect.height)) * 100))
          activeSurface.style.setProperty('--ux-x', x + '%')
          activeSurface.style.setProperty('--ux-y', y + '%')

          const nx = ((pointerX - rect.left) / Math.max(1, rect.width)) - .5
          const ny = ((pointerY - rect.top) / Math.max(1, rect.height)) - .5
          const distance = Math.min(1, Math.hypot(nx, ny) * 1.414)
          activeSurface.style.setProperty('--ux-elevation', (1 - distance).toFixed(3))

          if (activeSurface.matches(MICRO_TILT_SELECTOR)) {
            activeSurface.style.setProperty('--ux-rx', (-ny * 0.45).toFixed(2) + 'deg')
            activeSurface.style.setProperty('--ux-ry', (nx * 0.45).toFixed(2) + 'deg')
          } else {
            activeSurface.style.removeProperty('--ux-rx')
            activeSurface.style.removeProperty('--ux-ry')
          }
        }

        if (landscape) {
          const rect = landscape.getBoundingClientRect()
          const nx = ((pointerX - rect.left) / Math.max(1, rect.width)) - .5
          const ny = ((pointerY - rect.top) / Math.max(1, rect.height)) - .5
          landscape.style.setProperty('--ux-tilt-x', (nx * .9).toFixed(2) + 'deg')
          landscape.style.setProperty('--ux-tilt-y', (-ny * .7).toFixed(2) + 'deg')
        }
      })
    }

    const onPointerOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const nextSurface = target?.closest(SURFACE_SELECTOR)
      const nextLandscape = target?.closest('.feature-landscape')

      if (!(nextSurface instanceof HTMLElement) && !(nextLandscape instanceof HTMLElement)) {
        clearSurface()
        clearLandscape()
        setFocusStrength(keyboardFocusStrength)

        if (focusedSurface instanceof HTMLElement && keyboardFocusStrength > 0) {
          const rect = focusedSurface.getBoundingClientRect()
          emitWorldPointer(rect.left + rect.width / 2, rect.top + rect.height / 2, keyboardFocusStrength)
        }
        return
      }

      if (nextSurface instanceof HTMLElement && nextSurface !== activeSurface) {
        clearSurface()
        activeSurface = nextSurface
        activeSurface.setAttribute('data-ux-lit', 'true')
      }

      if (nextLandscape instanceof HTMLElement && nextLandscape !== landscape) {
        clearLandscape()
        landscape = nextLandscape
        landscape.setAttribute('data-ux-lit', 'true')
      }

      if (nextSurface instanceof HTMLElement) {
        setFocusStrength(nextSurface.matches(PRIORITY_SURFACE_SELECTOR) ? 1 : .68)
      } else if (nextLandscape instanceof HTMLElement) {
        setFocusStrength(.52)
      }

      pointerX = event.clientX
      pointerY = event.clientY
      schedule()
    }

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX
      pointerY = event.clientY
      emitWorldPointer(event.clientX, event.clientY, focusStrength)
      if (activeSurface || landscape) schedule()
    }

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const nextSurface = target?.closest(SURFACE_SELECTOR)
      const focusTarget = nextSurface instanceof HTMLElement
        ? nextSurface
        : target instanceof HTMLElement
          ? target
          : null
      if (!focusTarget) return

      clearFocusSurface()
      focusedSurface = focusTarget
      focusedSurface.setAttribute('data-ux-focus', 'true')

      const rect = focusedSurface.getBoundingClientRect()
      const nextFocus = focusedSurface.matches(PRIORITY_SURFACE_SELECTOR) ? 1 : .62
      keyboardFocusStrength = nextFocus
      setFocusStrength(nextFocus)
      emitWorldPointer(rect.left + rect.width / 2, rect.top + rect.height / 2, focusStrength)
    }

    const onFocusOut = (event: FocusEvent) => {
      const relatedTarget = event.relatedTarget
      if (relatedTarget instanceof Node && frame.contains(relatedTarget)) return

      clearFocusSurface()
      keyboardFocusStrength = 0
      setFocusStrength(activeSurface ? .68 : 0)
      emitWorldPointer(pointerX || window.innerWidth / 2, pointerY || window.innerHeight / 2, focusStrength)
    }

    const onPointerLeave = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = 0
      clearSurface()
      clearLandscape()
      setFocusStrength(keyboardFocusStrength)

      if (focusedSurface instanceof HTMLElement && keyboardFocusStrength > 0) {
        const rect = focusedSurface.getBoundingClientRect()
        emitWorldPointer(rect.left + rect.width / 2, rect.top + rect.height / 2, keyboardFocusStrength)
      } else {
        emitWorldPointer(window.innerWidth / 2, window.innerHeight / 2, 0)
      }
    }

    if (supportsPointerLighting) {
      frame.addEventListener('pointerover', onPointerOver, { passive: true })
      frame.addEventListener('pointermove', onPointerMove, { passive: true })
      frame.addEventListener('pointerleave', onPointerLeave)
    }
    frame.addEventListener('focusin', onFocusIn)
    frame.addEventListener('focusout', onFocusOut)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      if (supportsPointerLighting) {
        frame.removeEventListener('pointerover', onPointerOver)
        frame.removeEventListener('pointermove', onPointerMove)
        frame.removeEventListener('pointerleave', onPointerLeave)
      }
      frame.removeEventListener('focusin', onFocusIn)
      frame.removeEventListener('focusout', onFocusOut)
      clearSurface()
      clearLandscape()
      clearFocusSurface()
      keyboardFocusStrength = 0
      focusStrength = 0
      frame.style.removeProperty('--ux-focus-strength')
    }
  }, [])
}
