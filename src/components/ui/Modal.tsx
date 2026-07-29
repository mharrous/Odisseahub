import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'

export function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  const titleId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const dialog = dialogRef.current
    const focusableSelector = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
    window.requestAnimationFrame(() => dialog?.querySelector<HTMLElement>(focusableSelector)?.focus())

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)]
      if (!focusable.length) return
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

    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      previousFocus.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null
  const eyebrow = title.toLowerCase().startsWith('eliminar')
    ? 'Confirmación'
    : title.toLowerCase().startsWith('editar')
      ? 'Edición'
      : title.includes('Ayuda') || title === 'Notificaciones'
        ? 'ODISSEA HUB'
        : 'Nuevo registro'

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__head">
          <div><span className="eyebrow">{eyebrow}</span><h2 id={titleId}>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
        {children}
      </section>
    </div>
  )
}
