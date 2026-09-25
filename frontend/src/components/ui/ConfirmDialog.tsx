import { useModalBehavior } from '../../lib/useModalBehavior'

interface ConfirmDialogProps {
  open: boolean
  eyebrow?: string
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  eyebrow = 'CONFIRM',
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useModalBehavior(open, onCancel, busy)

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && !busy && onCancel()}
    >
      <section
        ref={dialogRef}
        className="modal-card confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        tabIndex={-1}
      >
        <div className="modal-header">
          <div>
            <span className="section-kicker">{eyebrow}</span>
            <h3 id="confirm-dialog-title">{title}</h3>
          </div>
          <button className="icon-button" type="button" disabled={busy} onClick={onCancel} aria-label="Close confirmation dialog">×</button>
        </div>

        <div className="confirm-dialog-copy">
          <p id="confirm-dialog-description">{description}</p>
        </div>

        <div className="modal-actions confirm-dialog-actions">
          <button className="secondary-button" type="button" disabled={busy} data-modal-autofocus onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={tone === 'danger' ? 'primary-button confirm-dialog-confirm is-danger' : 'primary-button confirm-dialog-confirm'}
            type="button"
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
