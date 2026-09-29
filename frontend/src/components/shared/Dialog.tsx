import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type DialogProps = {
  title: string
  eyebrow?: string
  onClose: () => void
  children: ReactNode
  size?: 'normal' | 'wide'
}

export function Dialog({ title, eyebrow, onClose, children, size = 'normal' }: DialogProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className={`dialog-card ${size === 'wide' ? 'dialog-card-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="dialog-header">
          <div>
            {eyebrow && <p className="dialog-eyebrow">{eyebrow}</p>}
            <h2>{title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Đóng hộp thoại"><X size={18} /></button>
        </header>
        {children}
      </section>
    </div>
  )
}