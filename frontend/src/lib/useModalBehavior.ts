import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  '[data-modal-autofocus]',
  'input[autofocus]:not([disabled])',
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useModalBehavior(open: boolean, onClose: () => void, disabled = false) {
  const dialogRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const previousActiveRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    previousActiveRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current
      if (!dialog) return
      const firstTarget = dialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      ;(firstTarget ?? dialog).focus()
    })

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow

      const previousActive = previousActiveRef.current
      previousActiveRef.current = null
      if (previousActive?.isConnected) previousActive.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !disabled) {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => element.offsetParent !== null)

      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, disabled])

  return dialogRef
}
